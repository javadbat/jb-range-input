import { initializeDOM, registerRangeInteractions, renderRange, type RangeElements } from "./render.js";
import { parseNumberAttribute } from "jb-core";
import { registerDefaultVariables } from 'jb-core/theme';
import type { RangeInputMode, RangeInputValue } from "./types.js";
import { normalizeStep, snapValueToStep } from "./math.js";
export * from "./types.js";
export class JBRangeInputWebComponent extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["min", "max", "step", "point-step", "mode", "value"];
  }

  #min = 0;
  #max = 10;
  #step = 1;
  #pointStep = 1;
  #mode: RangeInputMode = "single";
  #value: RangeInputValue = 0;

  get min(): number {
    return this.#min;
  }

  set min(value: number) {
    const normalizedValue = this.#normalizeNumber(value, 0);
    this.#min = normalizedValue;
    this.#reflectNumberAttribute("min", normalizedValue);
    this.#render(this.getBoundingClientRect().width);
  }

  get max(): number {
    return this.#max;
  }

  set max(value: number) {
    const normalizedValue = this.#normalizeNumber(value, 10);
    this.#max = normalizedValue;
    this.#reflectNumberAttribute("max", normalizedValue);
    this.#render(this.getBoundingClientRect().width);
  }

  get step(): number {
    return this.#step;
  }

  set step(value: number) {
    this.#step = normalizeStep(value);
    this.#value = this.#normalizeValue(this.#value);
    this.#reflectNumberAttribute("step", this.#step);
    this.#reflectValueAttribute();
    this.#render(this.getBoundingClientRect().width);
  }

  get pointStep(): number {
    return this.#pointStep;
  }

  set pointStep(value: number) {
    this.#pointStep = normalizeStep(value);
    this.#reflectNumberAttribute("point-step", this.#pointStep);
    this.#render(this.getBoundingClientRect().width);
  }

  get mode(): RangeInputMode {
    return this.#mode;
  }

  set mode(value: RangeInputMode) {
    this.#mode = value === "range" ? "range" : "single";
    this.#value = this.#normalizeValue(this.#value);
    this.#reflectAttribute("mode", this.#mode);
    this.#reflectValueAttribute();
    this.#render(this.getBoundingClientRect().width);
  }

  get value(): RangeInputValue {
    return Array.isArray(this.#value) ? [...this.#value] as [number, number] : this.#value;
  }

  set value(value: RangeInputValue) {
    this.#value = this.#normalizeValue(value);
    this.#reflectValueAttribute();
    this.#render(this.getBoundingClientRect().width);
  }

  #elements: RangeElements;
  #resizeObserver: ResizeObserver;

  constructor() {
    super();
    this.#elements = initializeDOM(this);
    this.#resizeObserver = new ResizeObserver(() => {
      this.#render(this.getBoundingClientRect().width);
    });
    registerRangeInteractions(this.#elements, {
      getMin: () => this.#min,
      getMax: () => this.#max,
      getStep: () => this.#step,
      onInput: (handleIndex, value) => this.#updateValueFromHandle(handleIndex, value),
      onChange: () => this.dispatchEvent(new Event("change", { bubbles: true, composed: true })),
      onCancel: () => this.#render(this.getBoundingClientRect().width),
    });
  }

  connectedCallback(): void {
    registerDefaultVariables();
    this.#resizeObserver.observe(this);
    this.#resizeObserver.observe(this.#elements.dotHeightProbe);
    this.#resizeObserver.observe(this.#elements.handleSizeProbe);
    this.#render(this.getBoundingClientRect().width);
  }

  disconnectedCallback(): void {
    this.#resizeObserver.disconnect();
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (name === "min") {
      this.#min = parseNumberAttribute(newValue, 0);
    }
    if (name === "max") {
      this.#max = parseNumberAttribute(newValue, 10);
    }
    if (name === "step") {
      this.#step = normalizeStep(parseNumberAttribute(newValue, 1));
    }
    if (name === "point-step") {
      this.#pointStep = normalizeStep(parseNumberAttribute(newValue, 1));
    }
    if (name === "mode") {
      this.#mode = newValue === "range" ? "range" : "single";
      this.#value = this.#parseValueAttribute(this.getAttribute("value"));
    }
    if (name === "value") {
      this.#value = this.#parseValueAttribute(newValue);
    }
    if (name === "min" || name === "max" || name === "step") {
      this.#value = this.#normalizeValue(this.#value);
    }
    this.#render(this.getBoundingClientRect().width);
  }

  #normalizeNumber(value: number, fallback: number): number {
    return Number.isFinite(value) ? value : fallback;
  }

  #reflectNumberAttribute(name: "min" | "max" | "step" | "point-step", value: number): void {
    this.#reflectAttribute(name, String(value));
  }

  #reflectAttribute(name: string, value: string): void {
    if (this.getAttribute(name) !== value) this.setAttribute(name, value);
  }

  #normalizeValue(value: RangeInputValue): RangeInputValue {
    const clamp = (item: number) => snapValueToStep(this.#normalizeNumber(item, this.#min), this.#min, this.#max, this.#step);
    if (this.#mode === "range") {
      const values = Array.isArray(value) ? value : [value, this.#max];
      const start = clamp(values[0]);
      const end = clamp(values[1]);
      return start <= end ? [start, end] : [end, start];
    }
    return clamp(Array.isArray(value) ? value[0] : value);
  }

  #parseValueAttribute(value: string | null): RangeInputValue {
    if (this.#mode === "range") {
      const [start, end] = value?.split(",") ?? [];
      return this.#normalizeValue([
        parseNumberAttribute(start ?? null, this.#min),
        parseNumberAttribute(end ?? null, this.#max),
      ]);
    }
    return this.#normalizeValue(parseNumberAttribute(value, this.#min));
  }

  #reflectValueAttribute(): void {
    const value = Array.isArray(this.#value) ? this.#value.join(",") : String(this.#value);
    this.#reflectAttribute("value", value);
  }

  #updateValueFromHandle(handleIndex: number, value: number): number {
    if (this.#mode === "range") {
      const currentValue = this.#value as [number, number];
      this.value = handleIndex === 0
        ? [Math.min(value, currentValue[1]), currentValue[1]]
        : [currentValue[0], Math.max(value, currentValue[0])];
    } else {
      this.value = value;
    }
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    return Array.isArray(this.#value) ? this.#value[handleIndex] : this.#value;
  }

  #render(width: number): void {
    renderRange(this.#elements, this.min, this.max, this.step, this.pointStep, this.#value, width);
  }
}

if (!customElements.get("jb-range-input")) {
  customElements.define("jb-range-input", JBRangeInputWebComponent);
}
