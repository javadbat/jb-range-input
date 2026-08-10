import CSS from "./jb-range-input.css";
import VariablesCSS from "./variables.css";
import type { RangeInputValue } from "./types.js";
import { normalizeStep, roundForSteps, snapValueToStep } from "./math.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export type RangeElements = {
  svg: SVGSVGElement;
  line: SVGLineElement;
  activeLine: SVGLineElement;
  dots: SVGGElement;
  handles: SVGGElement;
  balloon: SVGGElement;
  balloonLabel: SVGGElement;
  balloonValue: SVGTextElement;
  dotHeightProbe: HTMLSpanElement;
  handleSizeProbe: HTMLSpanElement;
};

export type RangeInteractionOptions = {
  getMin: () => number;
  getMax: () => number;
  getStep: () => number;
  onInput: (handleIndex: number, value: number) => number;
  onChange: () => void;
  onCancel: () => void;
};

export function renderHTML(): string {
  return /* html */ `
    <div class="jb-range-input-web-component" part="root">
      <svg class="range-svg" height="64" role="img" aria-labelledby="range-title" part="range">
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
        <g class="range-dots" part="range-dots"></g>
        <g class="range-joined-shapes">
          <g class="range-handles" part="range-handles"></g>
          <g class="range-balloon" part="range-balloon" aria-hidden="true">
            <g class="range-balloon-content">
              <path class="range-balloon-shape" d="M 0 -4 C -4 -11 -20 -25 -20 -40 A 20 20 0 1 1 20 -40 C 20 -25 4 -11 0 -4 Z"></path>
            </g>
          </g>
        </g>
        <g class="range-balloon-label" aria-hidden="true">
          <text class="range-balloon-value" x="0" y="-40"></text>
        </g>
      </svg>
      <span class="dot-height-probe" aria-hidden="true"></span>
      <span class="handle-size-probe" aria-hidden="true"></span>
    </div>
  `;
}

export function initializeDOM(host: HTMLElement): RangeElements {
  const shadowRoot = host.attachShadow({ mode: "open" });
  const template = document.createElement("template");
  template.innerHTML = `<style>${CSS} ${VariablesCSS}</style>${renderHTML()}`;
  shadowRoot.appendChild(template.content.cloneNode(true));

  return {
    svg: shadowRoot.querySelector<SVGSVGElement>(".range-svg")!,
    line: shadowRoot.querySelector<SVGLineElement>(".range-line")!,
    activeLine: shadowRoot.querySelector<SVGLineElement>(".range-active-line")!,
    dots: shadowRoot.querySelector<SVGGElement>(".range-dots")!,
    handles: shadowRoot.querySelector<SVGGElement>(".range-handles")!,
    balloon: shadowRoot.querySelector<SVGGElement>(".range-balloon")!,
    balloonLabel: shadowRoot.querySelector<SVGGElement>(".range-balloon-label")!,
    balloonValue: shadowRoot.querySelector<SVGTextElement>(".range-balloon-value")!,
    dotHeightProbe: shadowRoot.querySelector<HTMLSpanElement>(".dot-height-probe")!,
    handleSizeProbe: shadowRoot.querySelector<HTMLSpanElement>(".handle-size-probe")!,
  };
}

export function renderRange(elements: RangeElements, min: number, max: number, step: number, pointStep: number, value: RangeInputValue, width: number): void {
  const safeWidth = Math.max(1, width);
  const centerY = elements.svg.clientHeight / 2 || 32;
  const dotHeight = elements.dotHeightProbe.getBoundingClientRect().height || 12;
  const handleSize = elements.handleSizeProbe.getBoundingClientRect().height || 8;
  const edgePadding = Math.min(20, safeWidth * 0.05);
  const drawableWidth = Math.max(0, safeWidth - edgePadding * 2);

  elements.svg.setAttribute("width", String(safeWidth));
  elements.line.setAttribute("x1", String(edgePadding));
  elements.line.setAttribute("x2", String(safeWidth - edgePadding));
  elements.line.setAttribute("y1", String(centerY));
  elements.line.setAttribute("y2", String(centerY));
  elements.activeLine.setAttribute("y1", String(centerY));
  elements.activeLine.setAttribute("y2", String(centerY));
  elements.dots.replaceChildren();

  if (max < min) {
    return;
  }

  const normalizedPointStep = normalizeStep(pointStep);
  const pointCount = Math.floor((max - min) / normalizedPointStep + 1e-10) + 1;
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < pointCount; index++) {
    const pointValue = roundForSteps(min + index * normalizedPointStep, min, max, normalizedPointStep);
    const ratio = max === min ? 0.5 : (pointValue - min) / (max - min);
    const x = edgePadding + ratio * drawableWidth;
    const point = document.createElementNS(SVG_NAMESPACE, "line");
    point.classList.add("range-dot");
    point.setAttribute("part", "range-dot");
    point.setAttribute("x1", String(x));
    point.setAttribute("x2", String(x));
    point.setAttribute("y1", String(centerY - dotHeight / 2));
    point.setAttribute("y2", String(centerY + dotHeight / 2));
    point.setAttribute("data-value", String(pointValue));
    point.setAttribute("aria-label", String(pointValue));

    const title = document.createElementNS(SVG_NAMESPACE, "title");
    title.textContent = String(pointValue);
    point.appendChild(title);
    fragment.appendChild(point);
  }

  elements.dots.appendChild(fragment);

  const values = Array.isArray(value) ? value : [value];
  if (elements.handles.children.length !== values.length) {
    elements.handles.replaceChildren();
    for (let index = 0; index < values.length; index++) {
      const handle = document.createElementNS(SVG_NAMESPACE, "circle");
      handle.classList.add("range-handle");
      handle.setAttribute("part", "range-handle");
      handle.setAttribute("role", "slider");
      handle.setAttribute("tabindex", "0");
      elements.handles.appendChild(handle);
    }
  }
  values.forEach((handleValue, handleIndex) => {
    const ratio = max === min ? 0.5 : (handleValue - min) / (max - min);
    const x = edgePadding + ratio * drawableWidth;
    const handle = elements.handles.children[handleIndex] as SVGCircleElement;
    handle.setAttribute("cx", String(x));
    handle.setAttribute("cy", String(centerY));
    handle.setAttribute("r", String(handleSize));
    handle.setAttribute("data-value", String(handleValue));
    handle.setAttribute("data-handle-index", String(handleIndex));
    handle.setAttribute("aria-label", String(handleValue));
    handle.setAttribute("aria-valuemin", String(min));
    handle.setAttribute("aria-valuemax", String(max));
    handle.setAttribute("aria-valuenow", String(handleValue));
    handle.setAttribute("aria-valuetext", String(handleValue));
    handle.setAttribute("data-step", String(step));
  });
  updateActiveLine(elements, edgePadding);
}

function updateActiveLine(elements: RangeElements, rangeStart: number): void {
  const firstHandle = elements.handles.children[0] as SVGCircleElement | undefined;
  const secondHandle = elements.handles.children[1] as SVGCircleElement | undefined;
  const firstX = firstHandle?.getAttribute("cx") ?? String(rangeStart);
  elements.activeLine.setAttribute("x1", secondHandle ? firstX : String(rangeStart));
  elements.activeLine.setAttribute("x2", secondHandle?.getAttribute("cx") ?? firstX);
}

export function registerRangeInteractions(elements: RangeElements, options: RangeInteractionOptions): void {
  let activeHandleIndex: number | null = null;
  let animationFrame: number | null = null;
  let pendingPointerEvent: PointerEvent | null = null;

  const getHandle = (target: EventTarget | null): SVGCircleElement | null => {
    return target instanceof SVGCircleElement && target.classList.contains("range-handle") ? target : null;
  };
  const getPointerPosition = (event: PointerEvent, handleIndex: number): { value: number; x: number } => {
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
  };
  const showBalloon = (handleIndex: number, value: number): void => {
    const handle = elements.handles.children[handleIndex] as SVGCircleElement | undefined;
    if (!handle) return;
    elements.balloon.setAttribute("transform", `translate(${handle.getAttribute("cx") ?? 0} ${handle.getAttribute("cy") ?? 0})`);
    elements.balloonLabel.setAttribute("transform", `translate(${handle.getAttribute("cx") ?? 0} ${handle.getAttribute("cy") ?? 0})`);
    elements.balloonValue.textContent = String(value);
    elements.balloon.classList.add("--show");
    elements.balloonLabel.classList.add("--show");
  };
  const hideBalloon = (): void => {
    elements.balloon.classList.remove("--show");
    elements.balloonLabel.classList.remove("--show");
  };
  const previewPointerPosition = (event: PointerEvent, handleIndex: number): number => {
    const handle = elements.handles.children[handleIndex] as SVGCircleElement;
    const position = getPointerPosition(event, handleIndex);
    handle.setAttribute("cx", String(position.x));
    handle.setAttribute("data-value", String(position.value));
    handle.setAttribute("aria-valuenow", String(position.value));
    handle.setAttribute("aria-valuetext", String(position.value));
    updateActiveLine(elements, Number(elements.line.getAttribute("x1")));
    showBalloon(handleIndex, position.value);
    return position.value;
  };
  const schedulePointerInput = (event: PointerEvent): void => {
    pendingPointerEvent = event;
    if (animationFrame !== null) return;
    animationFrame = requestAnimationFrame(() => {
      animationFrame = null;
      if (activeHandleIndex !== null && pendingPointerEvent) {
        previewPointerPosition(pendingPointerEvent, activeHandleIndex);
      }
      pendingPointerEvent = null;
    });
  };

  elements.svg.addEventListener("pointerdown", (event) => {
    const handle = getHandle(event.target);
    if (!handle) return;
    activeHandleIndex = Number(handle.dataset.handleIndex);
    elements.svg.classList.add("--dragging");
    elements.svg.setPointerCapture(event.pointerId);
    previewPointerPosition(event, activeHandleIndex);
    event.preventDefault();
  });
  elements.svg.addEventListener("pointermove", (event) => {
    if (activeHandleIndex === null) return;
    schedulePointerInput(event);
  });
  const finishPointerInteraction = (event: PointerEvent): void => {
    if (activeHandleIndex === null) return;
    const handleIndex = activeHandleIndex;
    const value = previewPointerPosition(event, handleIndex);
    activeHandleIndex = null;
    pendingPointerEvent = null;
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    animationFrame = null;
    elements.svg.classList.remove("--dragging");
    options.onInput(handleIndex, value);
    hideBalloon();
    options.onChange();
  };
  elements.svg.addEventListener("pointerup", finishPointerInteraction);
  elements.svg.addEventListener("pointercancel", () => {
    if (activeHandleIndex === null) return;
    activeHandleIndex = null;
    pendingPointerEvent = null;
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    animationFrame = null;
    elements.svg.classList.remove("--dragging");
    hideBalloon();
    options.onCancel();
    options.onChange();
  });
  elements.svg.addEventListener("keydown", (event) => {
    const handle = getHandle(event.target);
    if (!handle || !["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"].includes(event.key)) return;
    const direction = event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 1;
    const handleIndex = Number(handle.dataset.handleIndex);
    options.onInput(handleIndex, Number(handle.dataset.value) + direction * options.getStep());
    options.onChange();
    event.preventDefault();
  });
}
