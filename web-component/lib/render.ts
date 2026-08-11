import CSS from "./jb-range-input.css";
import VariablesCSS from "./variables.css";
import type { RangeInputValue } from "./types.js";
import { normalizeStep, roundForSteps, snapValueToStep } from "./math.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const MAX_BALLOON_ROTATION = 15;
const BALLOON_ROTATION_SPEED_FACTOR = 8;
const BALLOON_ROTATION_RESET_DELAY = 80;

export type RangeElements = {
  root: HTMLDivElement;
  label: HTMLLabelElement;
  svg: SVGSVGElement;
  line: SVGLineElement;
  activeLine: SVGLineElement;
  ticks: SVGGElement;
  handles: SVGGElement;
  balloon: SVGGElement;
  balloonLabel: SVGGElement;
  balloonValue: SVGTextElement;
  tickHeightProbe: HTMLSpanElement;
  minorTickHeightProbe: HTMLSpanElement;
  tickLabels: HTMLDivElement;
  handleSizeProbe: HTMLSpanElement;
  messageBox: HTMLDivElement;
};

export type RangeInteractionOptions = {
  getMin: () => number;
  getMax: () => number;
  getStep: () => number;
  getDisabled: () => boolean;
  getBalloonRotationDisabled: () => boolean;
  onInput: (handleIndex: number, value: number) => number;
  onChange: () => void;
  onCancel: () => void;
};

export function renderHTML(): string {
  return /* html */ `
    <div class="jb-range-input-web-component" part="root">
      <label class="label" id="range-label" part="label"></label>
      <div class="range-container">
        <svg class="range-svg" height="64" role="group" aria-labelledby="range-title" aria-describedby="message" part="range">
          <title id="range-title">Range values</title>
          <defs>
            <filter id="range-join-filter" x="-50%" y="-100%" width="200%" height="250%" color-interpolation-filters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"></feGaussianBlur>
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="joined"></feColorMatrix>
              <feBlend in="SourceGraphic" in2="joined"></feBlend>
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

export function initializeDOM(host: HTMLElement): RangeElements {
  const shadowRoot = host.attachShadow({ mode: "open" });
  const template = document.createElement("template");
  template.innerHTML = `<style>${CSS} ${VariablesCSS}</style>${renderHTML()}`;
  shadowRoot.appendChild(template.content.cloneNode(true));

  return {
    root: shadowRoot.querySelector<HTMLDivElement>(".jb-range-input-web-component")!,
    label: shadowRoot.querySelector<HTMLLabelElement>(".label")!,
    svg: shadowRoot.querySelector<SVGSVGElement>(".range-svg")!,
    line: shadowRoot.querySelector<SVGLineElement>(".range-line")!,
    activeLine: shadowRoot.querySelector<SVGLineElement>(".range-active-line")!,
    ticks: shadowRoot.querySelector<SVGGElement>(".range-ticks")!,
    handles: shadowRoot.querySelector<SVGGElement>(".range-handles")!,
    balloon: shadowRoot.querySelector<SVGGElement>(".range-balloon")!,
    balloonLabel: shadowRoot.querySelector<SVGGElement>(".range-balloon-label")!,
    balloonValue: shadowRoot.querySelector<SVGTextElement>(".range-balloon-value")!,
    tickHeightProbe: shadowRoot.querySelector<HTMLSpanElement>(".tick-height-probe")!,
    minorTickHeightProbe: shadowRoot.querySelector<HTMLSpanElement>(".minor-tick-height-probe")!,
    tickLabels: shadowRoot.querySelector<HTMLDivElement>(".tick-labels")!,
    handleSizeProbe: shadowRoot.querySelector<HTMLSpanElement>(".handle-size-probe")!,
    messageBox: shadowRoot.querySelector<HTMLDivElement>(".message-box")!,
  };
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
  updateActiveLine(elements, layout.edgePadding);
}

type RangeLayout = {
  width: number;
  centerY: number;
  tickHeight: number;
  minorTickHeight: number;
  handleSize: number;
  edgePadding: number;
  drawableWidth: number;
};

type TickRenderOptions = {
  min: number;
  max: number;
  tickStep: number;
  minorTickStep: number | null;
  showTickLabels: boolean;
  tickLabelFormatter: (value: number) => string;
  layout: RangeLayout;
};

function getRangeLayout(elements: RangeElements, width: number): RangeLayout {
  const safeWidth = Math.max(1, width);
  const centerY = elements.svg.clientHeight / 2 || 32;
  const tickHeight = elements.tickHeightProbe.getBoundingClientRect().height || 12;
  const minorTickHeight = elements.minorTickHeightProbe.getBoundingClientRect().height || 6;
  const handleSize = elements.handleSizeProbe.getBoundingClientRect().height || 8;
  const edgePadding = Math.min(20, safeWidth * 0.05);
  const drawableWidth = Math.max(0, safeWidth - edgePadding * 2);
  return { width: safeWidth, centerY, tickHeight, minorTickHeight, handleSize, edgePadding, drawableWidth };
}

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

function getTickCount(min: number, max: number, tickStep: number): number {
  return Math.floor((max - min) / tickStep + 1e-10) + 1;
}

function getTickValue(min: number, max: number, tickStep: number, index: number): number {
  return roundForSteps(min + index * tickStep, min, max, tickStep);
}

function valueToX(value: number, min: number, max: number, layout: RangeLayout): number {
  const ratio = max === min ? 0.5 : (value - min) / (max - min);
  return layout.edgePadding + ratio * layout.drawableWidth;
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

function updateActiveLine(elements: RangeElements, rangeStart: number): void {
  const firstHandle = elements.handles.children[0] as SVGCircleElement | undefined;
  const secondHandle = elements.handles.children[1] as SVGCircleElement | undefined;
  const firstX = firstHandle?.getAttribute("cx") ?? String(rangeStart);
  elements.activeLine.setAttribute("x1", secondHandle ? firstX : String(rangeStart));
  elements.activeLine.setAttribute("x2", secondHandle?.getAttribute("cx") ?? firstX);
}

export function registerRangeInteractions(elements: RangeElements, options: RangeInteractionOptions, signal: AbortSignal): void {
  const state: RangeInteractionState = {
    activeHandleIndex: null,
    animationFrame: null,
    pendingPointerEvent: null,
    lastPointerX: null,
    lastPointerTimestamp: null,
    rotationResetTimer: null,
  };
  registerPointerInteractions(elements, options, state, signal);
  registerHoverInteractions(elements, options, state, signal);
  registerKeyboardInteractions(elements, options, signal);
  signal.addEventListener("abort", () => resetPointerInteraction(elements, state), { once: true });
}

type RangeInteractionState = {
  activeHandleIndex: number | null;
  animationFrame: number | null;
  pendingPointerEvent: PointerEvent | null;
  lastPointerX: number | null;
  lastPointerTimestamp: number | null;
  rotationResetTimer: number | null;
};

function registerPointerInteractions(elements: RangeElements, options: RangeInteractionOptions, state: RangeInteractionState, signal: AbortSignal): void {
  elements.svg.addEventListener(
    "pointerdown",
    event => {
      if (options.getDisabled()) return;
      const handle = getHandle(event.target);
      if (!handle) return;
      state.activeHandleIndex = Number(handle.dataset.handleIndex);
      startBalloonMotion(elements, state, event);
      elements.svg.classList.add("--dragging");
      elements.svg.setPointerCapture(event.pointerId);
      previewPointerPosition(elements, options, event, state.activeHandleIndex);
      event.preventDefault();
    },
    { signal },
  );
  elements.svg.addEventListener(
    "pointermove",
    event => {
      if (state.activeHandleIndex === null) return;
      schedulePointerPreview(elements, options, state, event);
    },
    { signal },
  );
  elements.svg.addEventListener("pointerup", event => finishPointerInteraction(elements, options, state, event), { signal });
  elements.svg.addEventListener(
    "pointercancel",
    () => {
      if (state.activeHandleIndex === null) return;
      resetPointerInteraction(elements, state);
      options.onCancel();
    },
    { signal },
  );
}

function registerHoverInteractions(elements: RangeElements, options: RangeInteractionOptions, state: RangeInteractionState, signal: AbortSignal): void {
  elements.svg.addEventListener(
    "pointerover",
    event => {
      if (event.pointerType === "touch" || options.getDisabled() || state.activeHandleIndex !== null) return;
      const handle = getHandle(event.target);
      if (!handle) return;
      showBalloon(elements, Number(handle.dataset.handleIndex), Number(handle.dataset.value), true);
    },
    { signal },
  );
  elements.svg.addEventListener(
    "pointerout",
    event => {
      if (state.activeHandleIndex !== null || !getHandle(event.target)) return;
      hideBalloon(elements);
    },
    { signal },
  );
}

function registerKeyboardInteractions(elements: RangeElements, options: RangeInteractionOptions, signal: AbortSignal): void {
  elements.svg.addEventListener(
    "keydown",
    event => {
      if (options.getDisabled()) return;
      const handle = getHandle(event.target);
      if (!handle || !["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"].includes(event.key)) return;
      const direction = event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 1;
      const handleIndex = Number(handle.dataset.handleIndex);
      options.onInput(handleIndex, Number(handle.dataset.value) + direction * options.getStep());
      options.onChange();
      event.preventDefault();
    },
    { signal },
  );
}

function getHandle(target: EventTarget | null): SVGCircleElement | null {
  return target instanceof SVGCircleElement && target.classList.contains("range-handle") ? target : null;
}

function getPointerPosition(elements: RangeElements, options: RangeInteractionOptions, event: PointerEvent, handleIndex: number): { value: number; x: number } {
  const bounds = elements.svg.getBoundingClientRect();
  const min = options.getMin();
  const max = options.getMax();
  const step = options.getStep();
  const edgePadding = Math.min(20, bounds.width * 0.05);
  const drawableWidth = Math.max(1, bounds.width - edgePadding * 2);
  const ratio = Math.min(1, Math.max(0, (event.clientX - bounds.left - edgePadding) / drawableWidth));
  let x = edgePadding + ratio * drawableWidth;
  if (elements.handles.children.length === 2) {
    const otherHandle = elements.handles.children[handleIndex === 0 ? 1 : 0] as SVGCircleElement;
    const otherX = Number(otherHandle.getAttribute("cx"));
    x = handleIndex === 0 ? Math.min(x, otherX) : Math.max(x, otherX);
  }
  const constrainedRatio = (x - edgePadding) / drawableWidth;
  return { value: snapValueToStep(min + constrainedRatio * (max - min), min, max, step), x };
}

function previewPointerPosition(elements: RangeElements, options: RangeInteractionOptions, event: PointerEvent, handleIndex: number): number {
  const handle = elements.handles.children[handleIndex] as SVGCircleElement;
  const position = getPointerPosition(elements, options, event, handleIndex);
  handle.setAttribute("cx", String(position.x));
  handle.setAttribute("data-value", String(position.value));
  handle.setAttribute("aria-valuenow", String(position.value));
  handle.setAttribute("aria-valuetext", String(position.value));
  updateActiveLine(elements, Number(elements.line.getAttribute("x1")));
  showBalloon(elements, handleIndex, position.value);
  return position.value;
}

function schedulePointerPreview(elements: RangeElements, options: RangeInteractionOptions, state: RangeInteractionState, event: PointerEvent): void {
  state.pendingPointerEvent = event;
  if (state.animationFrame !== null) return;
  state.animationFrame = requestAnimationFrame(() => {
    state.animationFrame = null;
    if (state.activeHandleIndex !== null && state.pendingPointerEvent) {
      updateBalloonRotation(elements, options, state, state.pendingPointerEvent);
      previewPointerPosition(elements, options, state.pendingPointerEvent, state.activeHandleIndex);
    }
    state.pendingPointerEvent = null;
  });
}

function startBalloonMotion(elements: RangeElements, state: RangeInteractionState, event: PointerEvent): void {
  resetBalloonRotation(elements, state);
  state.lastPointerX = event.clientX;
  state.lastPointerTimestamp = event.timeStamp;
}

function updateBalloonRotation(elements: RangeElements, options: RangeInteractionOptions, state: RangeInteractionState, event: PointerEvent): void {
  if (options.getBalloonRotationDisabled()) {
    resetBalloonRotation(elements, state);
    return;
  }
  if (state.lastPointerX !== null && state.lastPointerTimestamp !== null) {
    const elapsed = Math.max(1, event.timeStamp - state.lastPointerTimestamp);
    const velocity = (event.clientX - state.lastPointerX) / elapsed;
    const rotation = Math.max(-MAX_BALLOON_ROTATION, Math.min(MAX_BALLOON_ROTATION, -velocity * BALLOON_ROTATION_SPEED_FACTOR));
    setBalloonRotation(elements, rotation);
  }
  state.lastPointerX = event.clientX;
  state.lastPointerTimestamp = event.timeStamp;
  if (state.rotationResetTimer !== null) window.clearTimeout(state.rotationResetTimer);
  state.rotationResetTimer = window.setTimeout(() => {
    state.rotationResetTimer = null;
    setBalloonRotation(elements, 0);
  }, BALLOON_ROTATION_RESET_DELAY);
}

function resetBalloonRotation(elements: RangeElements, state: RangeInteractionState): void {
  if (state.rotationResetTimer !== null) window.clearTimeout(state.rotationResetTimer);
  state.rotationResetTimer = null;
  state.lastPointerX = null;
  state.lastPointerTimestamp = null;
  setBalloonRotation(elements, 0);
}

function setBalloonRotation(elements: RangeElements, rotation: number): void {
  elements.svg.style.setProperty("--balloon-rotation", `${rotation}deg`);
}

function finishPointerInteraction(elements: RangeElements, options: RangeInteractionOptions, state: RangeInteractionState, event: PointerEvent): void {
  if (state.activeHandleIndex === null) return;
  const handleIndex = state.activeHandleIndex;
  const value = previewPointerPosition(elements, options, event, handleIndex);
  resetPointerInteraction(elements, state);
  options.onInput(handleIndex, value);
  options.onChange();
  const handle = elements.handles.children[handleIndex] as SVGCircleElement | undefined;
  if (event.pointerType !== "touch" && handle && isPointerOverHandle(handle, event)) showBalloon(elements, handleIndex, value, true);
}

function isPointerOverHandle(handle: SVGCircleElement, event: PointerEvent): boolean {
  const bounds = handle.getBoundingClientRect();
  return event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
}

function resetPointerInteraction(elements: RangeElements, state: RangeInteractionState): void {
  state.activeHandleIndex = null;
  state.pendingPointerEvent = null;
  if (state.animationFrame !== null) cancelAnimationFrame(state.animationFrame);
  state.animationFrame = null;
  resetBalloonRotation(elements, state);
  elements.svg.classList.remove("--dragging");
  hideBalloon(elements);
}

function showBalloon(elements: RangeElements, handleIndex: number, value: number, isHover = false): void {
  const handle = elements.handles.children[handleIndex] as SVGCircleElement | undefined;
  if (!handle) return;
  const transform = `translate(${handle.getAttribute("cx") ?? 0} ${handle.getAttribute("cy") ?? 0})`;
  elements.balloon.setAttribute("transform", transform);
  elements.balloonLabel.setAttribute("transform", transform);
  elements.balloonValue.textContent = String(value);
  elements.balloon.classList.toggle("--hover", isHover);
  elements.balloonLabel.classList.toggle("--hover", isHover);
  elements.balloon.classList.add("--show");
  elements.balloonLabel.classList.add("--show");
}

function hideBalloon(elements: RangeElements): void {
  elements.balloon.classList.remove("--show", "--hover");
  elements.balloonLabel.classList.remove("--show", "--hover");
}
