import { roundForSteps, snapValueToStep } from "./math.js";

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

export type RangeLayout = {
  width: number;
  centerY: number;
  tickHeight: number;
  minorTickHeight: number;
  handleSize: number;
  edgePadding: number;
  drawableWidth: number;
};

export function getRangeLayout(elements: RangeElements, width: number): RangeLayout {
  const safeWidth = Math.max(1, width);
  const centerY = elements.svg.clientHeight / 2 || 32;
  const tickHeight = elements.tickHeightProbe.getBoundingClientRect().height || 12;
  const minorTickHeight = elements.minorTickHeightProbe.getBoundingClientRect().height || 6;
  const handleSize = elements.handleSizeProbe.getBoundingClientRect().height || 8;
  const edgePadding = Math.min(20, safeWidth * 0.05);
  const drawableWidth = Math.max(0, safeWidth - edgePadding * 2);
  return { width: safeWidth, centerY, tickHeight, minorTickHeight, handleSize, edgePadding, drawableWidth };
}

export function getTickCount(min: number, max: number, tickStep: number): number {
  return Math.floor((max - min) / tickStep + 1e-10) + 1;
}

export function getTickValue(min: number, max: number, tickStep: number, index: number): number {
  return roundForSteps(min + index * tickStep, min, max, tickStep);
}

export function valueToX(value: number, min: number, max: number, layout: RangeLayout): number {
  const ratio = max === min ? 0.5 : (value - min) / (max - min);
  return layout.edgePadding + ratio * layout.drawableWidth;
}

export function getHandle(target: EventTarget | null): SVGCircleElement | null {
  return target instanceof SVGCircleElement && target.classList.contains("range-handle") ? target : null;
}

export function getClosestHandle(svg: SVGSVGElement, handles: SVGGElement, clientX: number): SVGCircleElement | null {
  const svgLeft = svg.getBoundingClientRect().left;
  let closestHandle: SVGCircleElement | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;
  for (const child of handles.children) {
    const handle = child as SVGCircleElement;
    const distance = Math.abs(svgLeft + Number(handle.getAttribute("cx")) - clientX);
    if (distance < closestDistance) {
      closestHandle = handle;
      closestDistance = distance;
    }
  }
  return closestHandle;
}

export function isPointerOverHandle(handle: SVGCircleElement, event: PointerEvent): boolean {
  const bounds = handle.getBoundingClientRect();
  return event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
}

export function getPointerPosition(elements: RangeElements, event: PointerEvent, handleIndex: number, min: number, max: number, step: number): { value: number; x: number } {
  const bounds = elements.svg.getBoundingClientRect();
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
