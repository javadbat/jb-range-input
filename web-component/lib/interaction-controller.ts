import { updateActiveLine } from "./render.js";
import { getClosestHandle, getHandle, getPointerPosition, isPointerOverHandle, type RangeElements } from "./utils.js";

const MAX_BALLOON_ROTATION = 15;
const BALLOON_ROTATION_SPEED_FACTOR = 8;
const BALLOON_ROTATION_RESET_DELAY = 80;

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

export class RangeInteractionController {
  #activeHandleIndex: number | null = null;
  #animationFrame: number | null = null;
  #pendingPointerEvent: PointerEvent | null = null;
  #lastPointerX: number | null = null;
  #lastPointerTimestamp: number | null = null;
  #rotationResetTimer: number | null = null;

  constructor(
    private readonly elements: RangeElements,
    private readonly options: RangeInteractionOptions,
  ) {}

  register(signal: AbortSignal): void {
    this.#registerPointerInteractions(signal);
    this.#registerHoverInteractions(signal);
    this.#registerKeyboardInteractions(signal);
    signal.addEventListener("abort", () => this.#resetPointerInteraction(), { once: true });
  }

  #registerPointerInteractions(signal: AbortSignal): void {
    this.elements.svg.addEventListener("pointerdown", event => this.#handlePointerDown(event), { signal });
    this.elements.svg.addEventListener("pointermove", event => this.#handlePointerMove(event), { signal });
    this.elements.svg.addEventListener("pointerup", event => this.#finishPointerInteraction(event), { signal });
    this.elements.svg.addEventListener("pointercancel", () => this.#cancelPointerInteraction(), { signal });
  }

  #registerHoverInteractions(signal: AbortSignal): void {
    this.elements.svg.addEventListener(
      "pointerover",
      event => {
        if (event.pointerType === "touch" || this.options.getDisabled() || this.#activeHandleIndex !== null) return;
        const handle = getHandle(event.target);
        if (handle) this.#showBalloon(Number(handle.dataset.handleIndex), Number(handle.dataset.value), true);
      },
      { signal },
    );
    this.elements.svg.addEventListener(
      "pointerout",
      event => {
        if (this.#activeHandleIndex === null && getHandle(event.target)) this.#hideBalloon();
      },
      { signal },
    );
  }

  #registerKeyboardInteractions(signal: AbortSignal): void {
    this.elements.svg.addEventListener(
      "keydown",
      event => {
        if (this.options.getDisabled()) return;
        const handle = getHandle(event.target);
        if (!handle || !["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"].includes(event.key)) return;
        const direction = event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 1;
        const handleIndex = Number(handle.dataset.handleIndex);
        this.options.onInput(handleIndex, Number(handle.dataset.value) + direction * this.options.getStep());
        this.options.onChange();
        event.preventDefault();
      },
      { signal },
    );
  }

  #handlePointerDown(event: PointerEvent): void {
    if (this.options.getDisabled()) return;
    const handle = getHandle(event.target) ?? (event.pointerType === "mouse" ? null : getClosestHandle(this.elements.svg, this.elements.handles, event.clientX));
    if (!handle) return;
    this.#activeHandleIndex = Number(handle.dataset.handleIndex);
    this.#startBalloonMotion(event);
    this.elements.svg.classList.add("--dragging");
    this.elements.svg.setPointerCapture(event.pointerId);
    this.#previewPointerPosition(event, this.#activeHandleIndex);
    event.preventDefault();
  }

  #handlePointerMove(event: PointerEvent): void {
    if (this.#activeHandleIndex === null) return;
    this.#pendingPointerEvent = event;
    if (this.#animationFrame !== null) return;
    this.#animationFrame = requestAnimationFrame(() => {
      this.#animationFrame = null;
      if (this.#activeHandleIndex !== null && this.#pendingPointerEvent) {
        this.#updateBalloonRotation(this.#pendingPointerEvent);
        this.#previewPointerPosition(this.#pendingPointerEvent, this.#activeHandleIndex);
      }
      this.#pendingPointerEvent = null;
    });
  }

  #cancelPointerInteraction(): void {
    if (this.#activeHandleIndex === null) return;
    this.#resetPointerInteraction();
    this.options.onCancel();
  }

  #previewPointerPosition(event: PointerEvent, handleIndex: number): number {
    const handle = this.elements.handles.children[handleIndex] as SVGCircleElement;
    const position = getPointerPosition(this.elements, event, handleIndex, this.options.getMin(), this.options.getMax(), this.options.getStep());
    handle.setAttribute("cx", String(position.x));
    handle.setAttribute("data-value", String(position.value));
    handle.setAttribute("aria-valuenow", String(position.value));
    handle.setAttribute("aria-valuetext", String(position.value));
    updateActiveLine(this.elements, Number(this.elements.line.getAttribute("x1")));
    this.#showBalloon(handleIndex, position.value);
    return position.value;
  }

  #startBalloonMotion(event: PointerEvent): void {
    this.#resetBalloonRotation();
    this.#lastPointerX = event.clientX;
    this.#lastPointerTimestamp = event.timeStamp;
  }

  #updateBalloonRotation(event: PointerEvent): void {
    if (this.options.getBalloonRotationDisabled()) {
      this.#resetBalloonRotation();
      return;
    }
    if (this.#lastPointerX !== null && this.#lastPointerTimestamp !== null) {
      const elapsed = Math.max(1, event.timeStamp - this.#lastPointerTimestamp);
      const velocity = (event.clientX - this.#lastPointerX) / elapsed;
      const rotation = Math.max(-MAX_BALLOON_ROTATION, Math.min(MAX_BALLOON_ROTATION, -velocity * BALLOON_ROTATION_SPEED_FACTOR));
      this.#setBalloonRotation(rotation);
    }
    this.#lastPointerX = event.clientX;
    this.#lastPointerTimestamp = event.timeStamp;
    if (this.#rotationResetTimer !== null) window.clearTimeout(this.#rotationResetTimer);
    this.#rotationResetTimer = window.setTimeout(() => {
      this.#rotationResetTimer = null;
      this.#setBalloonRotation(0);
    }, BALLOON_ROTATION_RESET_DELAY);
  }

  #resetBalloonRotation(): void {
    if (this.#rotationResetTimer !== null) window.clearTimeout(this.#rotationResetTimer);
    this.#rotationResetTimer = null;
    this.#lastPointerX = null;
    this.#lastPointerTimestamp = null;
    this.#setBalloonRotation(0);
  }

  #setBalloonRotation(rotation: number): void {
    this.elements.svg.style.setProperty("--balloon-rotation", `${rotation}deg`);
  }

  #finishPointerInteraction(event: PointerEvent): void {
    if (this.#activeHandleIndex === null) return;
    const handleIndex = this.#activeHandleIndex;
    const value = this.#previewPointerPosition(event, handleIndex);
    this.#resetPointerInteraction();
    this.options.onInput(handleIndex, value);
    this.options.onChange();
    const handle = this.elements.handles.children[handleIndex] as SVGCircleElement | undefined;
    if (event.pointerType !== "touch" && handle && isPointerOverHandle(handle, event)) this.#showBalloon(handleIndex, value, true);
  }

  #resetPointerInteraction(): void {
    this.#activeHandleIndex = null;
    this.#pendingPointerEvent = null;
    if (this.#animationFrame !== null) cancelAnimationFrame(this.#animationFrame);
    this.#animationFrame = null;
    this.#resetBalloonRotation();
    this.elements.svg.classList.remove("--dragging");
    this.#hideBalloon();
  }

  #showBalloon(handleIndex: number, value: number, isHover = false): void {
    const handle = this.elements.handles.children[handleIndex] as SVGCircleElement | undefined;
    if (!handle) return;
    const transform = `translate(${handle.getAttribute("cx") ?? 0} ${handle.getAttribute("cy") ?? 0})`;
    this.elements.balloon.setAttribute("transform", transform);
    this.elements.balloonLabel.setAttribute("transform", transform);
    this.elements.balloonValue.textContent = String(value);
    this.elements.balloon.classList.toggle("--hover", isHover);
    this.elements.balloonLabel.classList.toggle("--hover", isHover);
    this.elements.balloon.classList.add("--show");
    this.elements.balloonLabel.classList.add("--show");
  }

  #hideBalloon(): void {
    this.elements.balloon.classList.remove("--show", "--hover");
    this.elements.balloonLabel.classList.remove("--show", "--hover");
  }
}
