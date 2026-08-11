import { initializeDOM, registerRangeInteractions, renderRange, type RangeElements } from "./render.js";
import { parseNumberAttribute } from "jb-core";
import { getRequiredMessage, i18n } from "jb-core/i18n";
import { registerDefaultVariables } from "jb-core/theme";
import type { JBFormInputStandards } from "jb-form";
import { ValidationHelper, type ValidationItem, type ValidationResult, type WithValidation, type ShowValidationErrorParameters } from "jb-validation";
import type { RangeInputMode, RangeInputValue } from "./types.js";
import { normalizeStep, snapValueToStep } from "./math.js";
export * from "./types.js";
export class JBRangeInputWebComponent extends HTMLElement implements WithValidation<RangeInputValue>, JBFormInputStandards<RangeInputValue> {
  static formAssociated = true;
  static get observedAttributes(): string[] {
    return ["min", "max", "step", "tick-step", "minor-tick-step", "show-tick-labels", "mode", "value", "disabled", "required", "message", "error"];
  }

  #min = 0;
  #max = 10;
  #step = 1;
  #tickStep = 1;
  #minorTickStep: number | null = null;
  #showTickLabels = false;
  #tickLabelFormatter: (value: number) => string = value => String(value);
  #mode: RangeInputMode = "single";
  #value: RangeInputValue = 0;
  #initialValue: RangeInputValue = 0;
  #isDirty = false;
  #disabled = false;
  #required = false;
  #internals?: ElementInternals;
  #isReflectingMode = false;
  #isReflectingValue = false;
  #hasConnected = false;
  #hasValue = false;

  #validation = new ValidationHelper<RangeInputValue>({
    clearValidationError: this.clearValidationError.bind(this),
    getValue: () => this.value,
    getValidations: this.#getInsideValidations.bind(this),
    getValueString: value => (Array.isArray(value) ? value.join(",") : String(value)),
    setValidationResult: this.#setValidationResult.bind(this),
    showValidationError: this.showValidationError.bind(this),
  });

  get validation(): ValidationHelper<RangeInputValue> {
    return this.#validation;
  }

  isAutoValidationDisabled = false;

  get name(): string {
    return this.getAttribute("name") ?? "";
  }

  set name(value: string) {
    if (value) this.setAttribute("name", value);
    else this.removeAttribute("name");
  }

  get message(): string {
    return this.getAttribute("message") ?? "";
  }

  set message(value: string) {
    if (value) this.setAttribute("message", value);
    else this.removeAttribute("message");
  }

  get form(): HTMLFormElement | null {
    return this.#internals?.form ?? null;
  }

  get disabled(): boolean {
    return this.#disabled;
  }

  set disabled(value: boolean) {
    this.#disabled = Boolean(value);
    if (this.#disabled) this.#internals?.states?.add("disabled");
    else this.#internals?.states?.delete("disabled");
    this.#elements.svg.setAttribute("aria-disabled", String(this.#disabled));
    for (const handle of this.#elements.handles.children) {
      handle.setAttribute("tabindex", this.#disabled ? "-1" : "0");
    }
  }

  get required(): boolean {
    return this.#required;
  }

  set required(value: boolean) {
    this.#required = Boolean(value);
    if (this.#required) this.#internals?.states?.add("required");
    else this.#internals?.states?.delete("required");
    this.#elements.svg.setAttribute("aria-required", String(this.#required));
    this.#validation.checkValiditySync({ showError: false });
  }

  get initialValue(): RangeInputValue {
    return this.#cloneValue(this.#initialValue);
  }

  set initialValue(value: RangeInputValue) {
    this.#hasValue = true;
    this.#initialValue = this.#normalizeValue(value);
    if (!this.#isDirty) this.#setValue(this.#initialValue);
  }

  get isDirty(): boolean {
    return JSON.stringify(this.#value) !== JSON.stringify(this.#initialValue);
  }

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

  get tickStep(): number {
    return this.#tickStep;
  }

  set tickStep(value: number) {
    this.#tickStep = normalizeStep(value);
    this.#reflectNumberAttribute("tick-step", this.#tickStep);
    this.#render(this.getBoundingClientRect().width);
  }

  get minorTickStep(): number | null {
    return this.#minorTickStep;
  }

  set minorTickStep(value: number | null) {
    this.#minorTickStep = value === null ? null : normalizeStep(value);
    if (this.#minorTickStep === null) this.removeAttribute("minor-tick-step");
    else this.#reflectNumberAttribute("minor-tick-step", this.#minorTickStep);
    this.#render(this.getBoundingClientRect().width);
  }

  get showTickLabels(): boolean {
    return this.#showTickLabels;
  }

  set showTickLabels(value: boolean) {
    this.#showTickLabels = Boolean(value);
    this.toggleAttribute("show-tick-labels", this.#showTickLabels);
    this.#render(this.getBoundingClientRect().width);
  }

  get tickLabelFormatter(): (value: number) => string {
    return this.#tickLabelFormatter;
  }

  set tickLabelFormatter(value: (value: number) => string) {
    this.#tickLabelFormatter = typeof value === "function" ? value : tickValue => String(tickValue);
    this.#render(this.getBoundingClientRect().width);
  }

  get mode(): RangeInputMode {
    return this.#mode;
  }

  set mode(value: RangeInputMode) {
    this.#mode = value === "range" ? "range" : "single";
    this.#value = this.#normalizeValue(this.#value);
    this.#isReflectingMode = true;
    try {
      this.#reflectAttribute("mode", this.#mode);
    } finally {
      this.#isReflectingMode = false;
    }
    this.#reflectValueAttribute();
    this.#setFormValue();
    this.#render(this.getBoundingClientRect().width);
  }

  get value(): RangeInputValue {
    return Array.isArray(this.#value) ? ([...this.#value] as [number, number]) : this.#value;
  }

  set value(value: RangeInputValue) {
    this.#hasValue = true;
    this.#isDirty = true;
    this.#setValue(value);
  }

  #elements: RangeElements;
  #resizeObserver: ResizeObserver;
  #eventAbortController: AbortController | null = null;

  constructor() {
    super();
    if (typeof this.attachInternals === "function") this.#internals = this.attachInternals();
    this.#elements = initializeDOM(this);
    this.#resizeObserver = new ResizeObserver(() => {
      this.#render(this.getBoundingClientRect().width);
    });
  }

  #registerEventListeners(): void {
    this.#eventAbortController?.abort();
    this.#eventAbortController = new AbortController();
    const { signal } = this.#eventAbortController;
    registerRangeInteractions(
      this.#elements,
      {
        getMin: () => this.#min,
        getMax: () => this.#max,
        getStep: () => this.#step,
        getDisabled: () => this.#disabled,
        onInput: (handleIndex, value) => this.#updateValueFromHandle(handleIndex, value),
        onChange: () => {
          this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
          if (!this.isAutoValidationDisabled) this.#validation.checkValidity({ showError: true });
        },
        onCancel: () => this.#render(this.getBoundingClientRect().width),
      },
      signal,
    );
    this.addEventListener(
      "invalid",
      () => {
        if (!this.isAutoValidationDisabled) this.#validation.checkValidity({ showError: true });
      },
      { signal },
    );
  }

  connectedCallback(): void {
    this.#registerEventListeners();
    registerDefaultVariables();
    if (!this.#hasConnected) {
      this.#hasConnected = true;
      this.#min = parseNumberAttribute(this.getAttribute("min"), 0);
      this.#max = parseNumberAttribute(this.getAttribute("max"), 10);
      this.#step = normalizeStep(parseNumberAttribute(this.getAttribute("step"), 1));
      this.#tickStep = normalizeStep(parseNumberAttribute(this.getAttribute("tick-step"), 1));
      this.#minorTickStep = this.hasAttribute("minor-tick-step") ? normalizeStep(parseNumberAttribute(this.getAttribute("minor-tick-step"), 1)) : null;
      this.#showTickLabels = this.hasAttribute("show-tick-labels");
      this.#mode = this.getAttribute("mode") === "range" ? "range" : "single";
      this.#hasValue = this.hasAttribute("value");
      this.#value = this.#parseValueAttribute(this.getAttribute("value"));
      if (!this.#isDirty) this.#initialValue = this.#cloneValue(this.#value);
      this.disabled = this.hasAttribute("disabled");
      this.required = this.hasAttribute("required");
      this.#setMessage(this.message, false);
    }
    this.#resizeObserver.observe(this);
    this.#resizeObserver.observe(this.#elements.tickHeightProbe);
    this.#resizeObserver.observe(this.#elements.minorTickHeightProbe);
    this.#resizeObserver.observe(this.#elements.handleSizeProbe);
    this.#render(this.getBoundingClientRect().width);
    this.#setFormValue();
  }

  disconnectedCallback(): void {
    this.#eventAbortController?.abort();
    this.#eventAbortController = null;
    this.#resizeObserver.disconnect();
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    // Existing attributes are delivered in markup order during upgrade. Defer
    // their interpretation until connectedCallback can read them deterministically.
    if (!this.#hasConnected) return;
    if (name === "min") {
      this.#min = parseNumberAttribute(newValue, 0);
    }
    if (name === "max") {
      this.#max = parseNumberAttribute(newValue, 10);
    }
    if (name === "step") {
      this.#step = normalizeStep(parseNumberAttribute(newValue, 1));
    }
    if (name === "tick-step") {
      this.#tickStep = normalizeStep(parseNumberAttribute(newValue, 1));
    }
    if (name === "minor-tick-step") {
      this.#minorTickStep = newValue === null ? null : normalizeStep(parseNumberAttribute(newValue, 1));
    }
    if (name === "show-tick-labels") {
      this.#showTickLabels = newValue !== null;
    }
    if (name === "mode") {
      if (!this.#isReflectingMode) {
        this.#mode = newValue === "range" ? "range" : "single";
        this.#value = this.#parseValueAttribute(this.getAttribute("value"));
        if (!this.#isDirty) this.#initialValue = this.#cloneValue(this.#value);
        this.#reflectValueAttribute();
        this.#setFormValue();
      }
    }
    if (name === "value") {
      if (!this.#isReflectingValue) this.#hasValue = newValue !== null;
      this.#value = this.#parseValueAttribute(newValue);
      if (!this.#isDirty) this.#initialValue = this.#cloneValue(this.#value);
      this.#setFormValue();
    }
    if (name === "disabled") {
      this.disabled = newValue !== null;
    }
    if (name === "required") {
      this.required = newValue !== null;
    }
    if (name === "message" && !this.#elements.messageBox.classList.contains("error")) {
      this.#setMessage(newValue ?? "", false);
    }
    if (name === "error") {
      this.#validation.checkValiditySync({ showError: this.#internals?.states?.has("invalid") ?? false });
    }
    if (name === "min" || name === "max" || name === "step") {
      this.#value = this.#normalizeValue(this.#value);
      this.#reflectValueAttribute();
      this.#setFormValue();
    }
    this.#render(this.getBoundingClientRect().width);
  }

  #normalizeNumber(value: number, fallback: number): number {
    return Number.isFinite(value) ? value : fallback;
  }

  #reflectNumberAttribute(name: "min" | "max" | "step" | "tick-step" | "minor-tick-step", value: number): void {
    this.#reflectAttribute(name, String(value));
  }

  #reflectAttribute(name: string, value: string): void {
    if (this.getAttribute(name) !== value) this.setAttribute(name, value);
  }

  #normalizeValue(value: RangeInputValue): RangeInputValue {
    const clamp = (item: number) => snapValueToStep(this.#normalizeNumber(item, this.#min), this.#min, this.#max, this.#step);
    if (this.#mode === "range") {
      const values = Array.isArray(value) ? value : [this.#min, value];
      const start = clamp(values[0]);
      const end = clamp(values[1]);
      return start <= end ? [start, end] : [end, start];
    }
    return clamp(Array.isArray(value) ? value[1] : value);
  }

  #parseValueAttribute(value: string | null): RangeInputValue {
    if (this.#mode === "range") {
      const [start, end] = value?.split(",") ?? [];
      if (end === undefined) {
        return this.#normalizeValue(parseNumberAttribute(start ?? null, this.#min));
      }
      return this.#normalizeValue([parseNumberAttribute(start ?? null, this.#min), parseNumberAttribute(end ?? null, this.#max)]);
    }
    const singleValue = value?.includes(",") ? value.split(",")[1] : value;
    return this.#normalizeValue(parseNumberAttribute(singleValue ?? null, this.#min));
  }

  #reflectValueAttribute(): void {
    const value = Array.isArray(this.#value) ? this.#value.join(",") : String(this.#value);
    this.#isReflectingValue = true;
    try {
      this.#reflectAttribute("value", value);
    } finally {
      this.#isReflectingValue = false;
    }
  }

  #setValue(value: RangeInputValue): void {
    this.#value = this.#normalizeValue(value);
    this.#reflectValueAttribute();
    this.#setFormValue();
    this.#render(this.getBoundingClientRect().width);
  }

  #cloneValue(value: RangeInputValue): RangeInputValue {
    return Array.isArray(value) ? ([...value] as [number, number]) : value;
  }

  #setFormValue(): void {
    const value = Array.isArray(this.#value) ? this.#value.join(",") : String(this.#value);
    this.#internals?.setFormValue(value);
  }

  #updateValueFromHandle(handleIndex: number, value: number): number {
    this.#hasValue = true;
    this.#isDirty = true;
    if (this.#mode === "range") {
      const currentValue = this.#value as [number, number];
      this.value = handleIndex === 0 ? [Math.min(value, currentValue[1]), currentValue[1]] : [currentValue[0], Math.max(value, currentValue[0])];
    } else {
      this.value = value;
    }
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    if (!this.isAutoValidationDisabled) this.#validation.checkValidity({ showError: false });
    return Array.isArray(this.#value) ? this.#value[handleIndex] : this.#value;
  }

  #render(width: number): void {
    renderRange(this.#elements, this.min, this.max, this.step, this.tickStep, this.minorTickStep, this.showTickLabels, this.tickLabelFormatter, this.#value, width);
    for (const handle of this.#elements.handles.children) {
      handle.setAttribute("tabindex", this.#disabled ? "-1" : "0");
    }
    this.#syncMessageAccessibility();
  }

  formResetCallback(): void {
    this.#isDirty = false;
    this.#setValue(this.#initialValue);
    this.#validation.reset();
    this.#internals?.setValidity({});
  }

  formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === "string") this.#setValue(this.#parseValueAttribute(state));
  }

  #getInsideValidations(): ValidationItem<RangeInputValue>[] {
    const validations: ValidationItem<RangeInputValue>[] = [];
    const error = this.getAttribute("error")?.trim();
    if (error) validations.push({ message: error, stateType: "customError" });
    if (this.required) {
      validations.push({
        validator: () => this.#hasValue,
        message: getRequiredMessage(i18n, null),
        stateType: "valueMissing",
      });
    }
    return validations;
  }

  #setValidationResult(result: ValidationResult<RangeInputValue>): void {
    const invalidResults = result.validationList.filter(item => !item.isValid);
    const flags: ValidityStateFlags = {};
    for (const item of invalidResults) flags[item.validation.stateType ?? "customError"] = true;
    this.#internals?.setValidity(flags, invalidResults[0]?.message ?? "");
  }

  showValidationError(error: ShowValidationErrorParameters): void {
    this.#setMessage(error.message, true);
    this.#internals?.states?.add("invalid");
    this.#elements.svg.setAttribute("aria-invalid", "true");
  }

  clearValidationError(): void {
    this.#setMessage(this.message, false);
    this.#internals?.states?.delete("invalid");
    this.#elements.svg.setAttribute("aria-invalid", "false");
  }

  #setMessage(message: string, isError: boolean): void {
    this.#elements.messageBox.textContent = message;
    this.#elements.messageBox.classList.toggle("error", isError);
    this.#elements.messageBox.setAttribute("aria-live", isError ? "assertive" : "polite");
    this.#elements.messageBox.setAttribute("role", isError ? "alert" : "status");
    this.#syncMessageAccessibility();
  }

  #syncMessageAccessibility(): void {
    const isError = this.#elements.messageBox.classList.contains("error");
    for (const handle of this.#elements.handles.children) {
      handle.setAttribute("aria-describedby", this.#elements.messageBox.id);
      handle.setAttribute("aria-invalid", String(isError));
      if (isError) {
        handle.setAttribute("aria-errormessage", this.#elements.messageBox.id);
      } else {
        handle.removeAttribute("aria-errormessage");
      }
    }
  }

  get validationMessage(): string {
    return this.#internals?.validationMessage ?? "";
  }

  checkValidity(): boolean {
    const result = this.#validation.checkValiditySync({ showError: false });
    if (!result.isAllValid) this.dispatchEvent(new Event("invalid"));
    return result.isAllValid;
  }

  reportValidity(): boolean {
    const result = this.#validation.checkValiditySync({ showError: true });
    if (!result.isAllValid) this.dispatchEvent(new Event("invalid"));
    return result.isAllValid;
  }
}

if (!customElements.get("jb-range-input")) {
  customElements.define("jb-range-input", JBRangeInputWebComponent);
}
