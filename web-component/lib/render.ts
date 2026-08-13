import type { RangeInputValue } from "./types.js";
import { normalizeStep } from "./math.js";
import { getRangeLayout, getTickCount, getTickValue, valueToX, type RangeElements, type RangeLayout } from "./utils.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export function renderHTML(): string {
  return /* html */ `
    <div class="jb-range-input-web-component" part="root">
      <label class="label" id="range-label" part="label"></label>
      <div class="range-container">
        <svg class="range-svg" height="64" role="group" aria-labelledby="range-title" aria-describedby="message" part="range">
          <title id="range-title">Range values</title>
          <defs>
            <filter id="range-join-filter" x="-50%" y="-100%" width="200%" height="250%" color-interpolation-filters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur-sm"></feGaussianBlur>
              <feColorMatrix in="blur-sm" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 14 -6" result="goo"></feColorMatrix>
              <feMorphology in="goo" operator="dilate" radius="1.25" result="goo-expanded"></feMorphology>
              <feComposite in="goo-expanded" in2="SourceGraphic" operator="over"></feComposite>
            </filter>
          </defs>
          <line class="range-line" y1="32" y2="32" part="range-line"></line>
          <line class="range-active-line" y1="32" y2="32" part="range-active-line"></line>
          <g class="range-ticks" part="range-ticks"></g>
          <g class="range-joined-shapes" part="range-joined-shapes">
            <g class="range-handles" part="range-handles"></g>
            <g class="range-balloon" part="range-balloon" aria-hidden="true">
              <g class="range-balloon-scaler">
                <g class="range-balloon-content" part="range-balloon-content">
                  <path class="range-balloon-shape" part="range-balloon-shape" d="M 0 -4 C -4 -11 -20 -25 -20 -40 A 20 20 0 1 1 20 -40 C 20 -25 4 -11 0 -4 Z"></path>
                </g>
              </g>
            </g>
          </g>
          <g class="range-balloon-label" part="range-balloon-label" aria-hidden="true">
            <g class="range-balloon-label-scaler">
              <text class="range-balloon-value" part="range-balloon-value" x="0" y="-40"></text>
            </g>
          </g>
        </svg>
        <div class="tick-labels" part="tick-labels" aria-hidden="true"></div>
        <span class="tick-height-probe" aria-hidden="true"></span>
        <span class="minor-tick-height-probe" aria-hidden="true"></span>
        <span class="handle-size-probe" aria-hidden="true"></span>
      </div>
      <div class="message-box" id="message" part="message" aria-live="polite" role="status"></div>
    </div>
  `;
}

export function renderRange(
  elements: RangeElements,
  min: number,
  max: number,
  step: number,
  tickStep: number,
  minorTickStep: number | null,
  showTickLabels: boolean,
  tickLabelFormatter: (value: number) => string,
  value: RangeInputValue,
  startPoint: number,
  width: number,
): void {
  const layout = getRangeLayout(elements, width);
  renderTrack(elements, layout);
  clearScale(elements);

  if (max < min) return;

  renderTicks(elements, {
    min,
    max,
    tickStep,
    minorTickStep,
    showTickLabels,
    tickLabelFormatter,
    layout,
  });
  renderHandles(elements, value, min, max, step, layout);
  updateActiveLine(elements, layout, min, max, startPoint);
}

type TickRenderOptions = {
  min: number;
  max: number;
  tickStep: number;
  minorTickStep: number | null;
  showTickLabels: boolean;
  tickLabelFormatter: (value: number) => string;
  layout: RangeLayout;
};

function renderTrack(elements: RangeElements, layout: RangeLayout): void {
  const { width, centerY, edgePadding } = layout;
  elements.root.style.setProperty("--range-edge-padding", `${edgePadding}px`);
  elements.svg.setAttribute("width", String(width));
  elements.line.setAttribute("x1", String(edgePadding));
  elements.line.setAttribute("x2", String(width - edgePadding));
  elements.line.setAttribute("y1", String(centerY));
  elements.line.setAttribute("y2", String(centerY));
  elements.activeLine.setAttribute("y1", String(centerY));
  elements.activeLine.setAttribute("y2", String(centerY));
}

function clearScale(elements: RangeElements): void {
  elements.ticks.replaceChildren();
  elements.tickLabels.replaceChildren();
}

function renderTicks(elements: RangeElements, options: TickRenderOptions): void {
  const { min, max, tickStep, minorTickStep, showTickLabels, tickLabelFormatter, layout } = options;
  const normalizedTickStep = normalizeStep(tickStep);
  const tickFragment = document.createDocumentFragment();
  renderMinorTicks(tickFragment, min, max, normalizedTickStep, minorTickStep, layout);
  const labelFragment = renderMajorTicks(tickFragment, min, max, normalizedTickStep, showTickLabels, tickLabelFormatter, layout);
  elements.ticks.appendChild(tickFragment);
  elements.tickLabels.appendChild(labelFragment);
}

function renderMinorTicks(fragment: DocumentFragment, min: number, max: number, majorTickStep: number, minorTickStep: number | null, layout: RangeLayout): void {
  if (minorTickStep === null) return;
  const normalizedMinorTickStep = normalizeStep(minorTickStep);
  const tickCount = getTickCount(min, max, normalizedMinorTickStep);
  for (let index = 0; index < tickCount; index++) {
    const tickValue = getTickValue(min, max, normalizedMinorTickStep, index);
    const majorStepIndex = (tickValue - min) / majorTickStep;
    if (Math.abs(majorStepIndex - Math.round(majorStepIndex)) < 1e-10) continue;
    fragment.appendChild(createTick(tickValue, valueToX(tickValue, min, max, layout), layout.centerY, layout.minorTickHeight, "minor"));
  }
}

function renderMajorTicks(
  tickFragment: DocumentFragment,
  min: number,
  max: number,
  tickStep: number,
  showTickLabels: boolean,
  tickLabelFormatter: (value: number) => string,
  layout: RangeLayout,
): DocumentFragment {
  const labelFragment = document.createDocumentFragment();
  const tickCount = getTickCount(min, max, tickStep);
  for (let index = 0; index < tickCount; index++) {
    const tickValue = getTickValue(min, max, tickStep, index);
    const x = valueToX(tickValue, min, max, layout);
    tickFragment.appendChild(createTick(tickValue, x, layout.centerY, layout.tickHeight, "major"));
    if (showTickLabels) {
      labelFragment.appendChild(createTickLabel(tickValue, x, index === 0, Math.abs(tickValue - max) < 1e-10, tickLabelFormatter));
    }
  }
  return labelFragment;
}

function createTickLabel(value: number, x: number, isStart: boolean, isEnd: boolean, formatter: (value: number) => string): HTMLSpanElement {
  const label = document.createElement("span");
  label.classList.add("tick-label");
  label.setAttribute("part", "tick-label");
  label.dataset.value = String(value);
  label.style.left = `${x}px`;
  label.textContent = formatter(value);
  if (isStart) label.classList.add("--start");
  if (isEnd) label.classList.add("--end");
  return label;
}

function renderHandles(elements: RangeElements, value: RangeInputValue, min: number, max: number, step: number, layout: RangeLayout): void {
  const values = Array.isArray(value) ? value : [value];
  ensureHandleCount(elements.handles, values.length);
  values.forEach((handleValue, handleIndex) => {
    const handle = elements.handles.children[handleIndex] as SVGCircleElement;
    handle.setAttribute("cx", String(valueToX(handleValue, min, max, layout)));
    handle.setAttribute("cy", String(layout.centerY));
    handle.setAttribute("r", String(layout.handleSize));
    handle.setAttribute("data-value", String(handleValue));
    handle.setAttribute("data-handle-index", String(handleIndex));
    handle.setAttribute("aria-label", String(handleValue));
    handle.setAttribute("aria-valuemin", String(min));
    handle.setAttribute("aria-valuemax", String(max));
    handle.setAttribute("aria-valuenow", String(handleValue));
    handle.setAttribute("aria-valuetext", String(handleValue));
    handle.setAttribute("data-step", String(step));
  });
}

function ensureHandleCount(handles: SVGGElement, count: number): void {
  if (handles.children.length === count) return;
  handles.replaceChildren();
  for (let index = 0; index < count; index++) {
    const handle = document.createElementNS(SVG_NAMESPACE, "circle");
    handle.classList.add("range-handle");
    handle.setAttribute("part", "range-handle");
    handle.setAttribute("role", "slider");
    handle.setAttribute("tabindex", "0");
    handles.appendChild(handle);
  }
}

function createTick(value: number, x: number, centerY: number, height: number, level: "major" | "minor"): SVGLineElement {
  const tick = document.createElementNS(SVG_NAMESPACE, "line");
  tick.classList.add("range-tick", `range-${level}-tick`);
  tick.setAttribute("part", `range-tick range-${level}-tick`);
  tick.setAttribute("x1", String(x));
  tick.setAttribute("x2", String(x));
  tick.setAttribute("y1", String(centerY - height / 2));
  tick.setAttribute("y2", String(centerY + height / 2));
  tick.setAttribute("data-value", String(value));
  tick.setAttribute("aria-label", String(value));
  const title = document.createElementNS(SVG_NAMESPACE, "title");
  title.textContent = String(value);
  tick.appendChild(title);
  return tick;
}

export function updateActiveLine(elements: RangeElements, layout: RangeLayout | number, min?: number, max?: number, startPoint?: number): void {
  const firstHandle = elements.handles.children[0] as SVGCircleElement | undefined;
  const secondHandle = elements.handles.children[1] as SVGCircleElement | undefined;
  const firstX = firstHandle?.getAttribute("cx") ?? String(typeof layout === "number" ? layout : layout.edgePadding);
  const startX = typeof layout === "number" ? (elements.activeLine.getAttribute("x1") ?? String(layout)) : String(valueToX(startPoint!, min!, max!, layout));
  elements.activeLine.setAttribute("x1", secondHandle ? firstX : startX);
  elements.activeLine.setAttribute("x2", secondHandle?.getAttribute("cx") ?? firstX);
}
