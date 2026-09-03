import { defineWebComponent, JBBaseComponent, enToFaDigits, parseBooleanAttribute, parseNumberAttribute } from "jb-core";
import { renderHTML, renderRange } from "./render.js";
import { RangeInteractionController } from "./interaction-controller.js";
import type { RangeElements } from "./utils.js";
import CSS from "./jb-range-input.css";
import VariablesCSS from "./variables.css";
import { getRequiredMessage, i18n } from "jb-core/i18n";
import { registerDefaultVariables } from "jb-core/theme";
import type { JBFormInputStandards } from "jb-form";
import { ValidationHelper, type ValidationItem, type ValidationResult, type WithValidation, type ShowValidationErrorParameters } from "jb-validation";
import type { RangeInputMode, RangeInputValue } from "./types.js";
import { normalizeStep, snapValueToStep } from "./math.js";
export * from "./types.js";
export class JBRangeInputWebComponent extends JBBaseComponent implements WithValidation<RangeInputValue>, JBFormInputStandards<RangeInputValue> {
  static formAssociated = true;
  static get observedAttributes(): string[] {
    return [
      "label",
      "min",
      "max",
      "step",
      "tick-step",
      "minor-tick-step",
      "show-tick-labels",
      "show-persian-number",
      "disable-balloon-rotation",
      "mode",
      "value",
      "start-point",
      "disabled",
      "required",
      "message",
      "error",
    ];
  }

  #min = 0;
  #max = 10;
  #step = 1;
  #tickStep = 1;
  #minorTickStep: number | null = null;
  #showTickLabels = false;
  #showPersianNumber = i18n.locale.numberingSystem === "arabext";
  #hasShowPersianNumberOverride = false;
  #unsubscribeLocaleChange: VoidFunction | null = null;
  #disableBalloonRotation = false;
  #tickLabelFormatter: (value: number) => string = value => String(value);
  #mode: RangeInputMode = "single";
  #value: RangeInputValue = 0;
  #initialValue: RangeInputValue = 0;
  #startPoint = 0;
  #hasStartPoint = false;
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

  get label(): string {
    return this.getAttribute("label") ?? "";
  }

  set label(value: string) {
    if (value) this.setAttribute("label", value);
    else this.removeAttribute("label");
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
    this.toggleAttribute("disabled", this.#disabled);
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
    this.toggleAttribute("required", this.#required);
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

  get showPersianNumber(): boolean {
    return this.#showPersianNumber;
  }

  set showPersianNumber(value: boolean) {
    this.#hasShowPersianNumberOverride = true;
    this.#setShowPersianNumber(Boolean(value));
  }

  #setShowPersianNumber(value: boolean): void {
    this.#showPersianNumber = value;
    this.#render(this.getBoundingClientRect().width);
  }

  #formatValue(value: number | string): string {
    const stringValue = String(value);
    return this.#showPersianNumber ? enToFaDigits(stringValue) : stringValue;
  }

  get disableBalloonRotation(): boolean {
    return this.#disableBalloonRotation;
  }

  set disableBalloonRotation(value: boolean) {
    this.#disableBalloonRotation = Boolean(value);
    this.toggleAttribute("disable-balloon-rotation", this.#disableBalloonRotation);
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
    this.#value = this.#hasValue ? this.#normalizeValue(this.#value) : this.#parseValueAttribute(null);
    this.#isReflectingMode = true;
    try {
      this.#reflectAttribute("mode", this.#mode);
    } finally {
      this.#isReflectingMode = false;
    }
    if (this.#hasValue || this.#hasConnected) this.#reflectValueAttribute();
    this.#updateFormValue();
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

  get startPoint(): number {
    return this.#startPoint;
  }

  set startPoint(value: number) {
    this.#hasStartPoint = true;
    this.#startPoint = this.#normalizeStartPoint(value);
    this.#reflectAttribute("start-point", String(this.#startPoint));
    this.#render(this.getBoundingClientRect().width);
  }

  #elements: RangeElements;
  #resizeObserver: ResizeObserver;
  #eventAbortController: AbortController | null = null;

  constructor() {
    super();
    if (typeof this.attachInternals === "function") this.#internals = this.attachInternals();
    this.#elements = this.#initializeDOM();
    this.#resizeObserver = new ResizeObserver(() => {
      this.#render(this.getBoundingClientRect().width);
    });
  }

  #initializeDOM(): RangeElements {
    const shadowRoot = this.attachShadow({ mode: "open" });
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

  #registerEventListeners(): void {
    this.#eventAbortController?.abort();
    this.#eventAbortController = new AbortController();
    const { signal } = this.#eventAbortController;
    const interactionController = new RangeInteractionController(this.#elements, {
      getMin: () => this.#min,
      getMax: () => this.#max,
      getStep: () => this.#step,
      getDisabled: () => this.#disabled,
      getBalloonRotationDisabled: () => this.#disableBalloonRotation,
      formatValue: value => this.#formatValue(value),
      onInput: (handleIndex, value) => this.#updateValueFromHandle(handleIndex, value),
      onChange: () => {
        this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
        if (!this.isAutoValidationDisabled) this.#validation.checkValidity({ showError: true });
      },
      onCancel: () => this.#render(this.getBoundingClientRect().width),
    });
    interactionController.register(signal);
    this.#elements.label.addEventListener("click", () => this.#focusFirstHandle(), { signal });
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
      this.#showTickLabels = parseBooleanAttribute(this.getAttribute("show-tick-labels"));
      if (this.hasAttribute("show-persian-number")) {
        this.#hasShowPersianNumberOverride = true;
        this.#showPersianNumber = parseBooleanAttribute(this.getAttribute("show-persian-number"), i18n.locale.numberingSystem === "arabext");
      }
      this.#disableBalloonRotation = parseBooleanAttribute(this.getAttribute("disable-balloon-rotation"));
      this.#mode = this.getAttribute("mode") === "range" ? "range" : "single";
      this.#hasValue = this.hasAttribute("value");
      this.#value = this.#parseValueAttribute(this.getAttribute("value"));
      this.#hasStartPoint = this.hasAttribute("start-point");
      this.#startPoint = this.#parseStartPointAttribute(this.getAttribute("start-point"));
      if (!this.#isDirty) this.#initialValue = this.#cloneValue(this.#value);
      this.disabled = parseBooleanAttribute(this.getAttribute("disabled"));
      this.required = parseBooleanAttribute(this.getAttribute("required"));
      this.#setLabel(this.label);
      this.#setMessage(this.message, false);
    }
    this.#resizeObserver.observe(this);
    this.#resizeObserver.observe(this.#elements.tickHeightProbe);
    this.#resizeObserver.observe(this.#elements.minorTickHeightProbe);
    this.#resizeObserver.observe(this.#elements.handleSizeProbe);
    this.#unsubscribeLocaleChange?.();
    if (!this.#hasShowPersianNumberOverride) this.#setShowPersianNumber(i18n.locale.numberingSystem === "arabext");
    this.#unsubscribeLocaleChange = i18n.subscribe(() => {
      if (!this.#hasShowPersianNumberOverride) this.#setShowPersianNumber(i18n.locale.numberingSystem === "arabext");
    });
    this.#render(this.getBoundingClientRect().width);
    this.#updateFormValue();
  }

  disconnectedCallback(): void {
    this.#eventAbortController?.abort();
    this.#eventAbortController = null;
    this.#unsubscribeLocaleChange?.();
    this.#unsubscribeLocaleChange = null;
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
      this.#showTickLabels = parseBooleanAttribute(newValue);
    }
    if (name === "show-persian-number") {
      this.#hasShowPersianNumberOverride = newValue !== null;
      this.#setShowPersianNumber(parseBooleanAttribute(newValue, i18n.locale.numberingSystem === "arabext"));
    }
    if (name === "disable-balloon-rotation") {
      this.#disableBalloonRotation = parseBooleanAttribute(newValue);
    }
    if (name === "mode") {
      if (!this.#isReflectingMode) {
        this.#mode = newValue === "range" ? "range" : "single";
        this.#value = this.#parseValueAttribute(this.getAttribute("value"));
        if (!this.#isDirty) this.#initialValue = this.#cloneValue(this.#value);
        this.#reflectValueAttribute();
        this.#updateFormValue();
      }
    }
    if (name === "value") {
      if (!this.#isReflectingValue) this.#hasValue = newValue !== null;
      if (newValue === null) this.#clearValue();
      else this.#value = this.#parseValueAttribute(newValue);
      if (!this.#isDirty) this.#initialValue = this.#cloneValue(this.#value);
      if (newValue !== null) this.#updateFormValue();
    }
    if (name === "start-point") {
      this.#hasStartPoint = newValue !== null;
      this.#startPoint = this.#parseStartPointAttribute(newValue);
    }
    if (name === "disabled") {
      this.disabled = parseBooleanAttribute(newValue);
    }
    if (name === "required") {
      this.required = parseBooleanAttribute(newValue);
    }
    if (name === "label") {
      this.#setLabel(newValue ?? "");
    }
    if (name === "message" && !this.#elements.messageBox.classList.contains("error")) {
      this.#setMessage(newValue ?? "", false);
    }
    if (name === "error") {
      this.#validation.checkValiditySync({ showError: this.#internals?.states?.has("invalid") ?? false });
    }
    if (name === "min" || name === "max" || name === "step") {
      this.#value = this.#normalizeValue(this.#value);
      this.#startPoint = this.#hasStartPoint ? this.#normalizeStartPoint(this.#startPoint) : this.#getSingleDefaultValue();
      this.#reflectValueAttribute();
      this.#updateFormValue();
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

  #getSingleDefaultValue(): number {
    const defaultValue = this.#min < 0 && this.#max >= 0 ? 0 : this.#min;
    return snapValueToStep(defaultValue, this.#min, this.#max, this.#step);
  }

  #normalizeStartPoint(value: number): number {
    return snapValueToStep(this.#normalizeNumber(value, this.#getSingleDefaultValue()), this.#min, this.#max, this.#step);
  }

  #parseStartPointAttribute(value: string | null): number {
    return this.#normalizeStartPoint(parseNumberAttribute(value, this.#getSingleDefaultValue()));
  }

  #parseValueAttribute(value: string | null): RangeInputValue {
    if (this.#mode === "range") {
      // A range-mode input without an explicit value spans the complete range by default.
      if (!value?.trim()) return this.#normalizeValue([this.#min, this.#max]);
      const [start, end] = value?.split(",") ?? [];
      if (end === undefined) {
        return this.#normalizeValue(parseNumberAttribute(start ?? null, this.#min));
      }
      return this.#normalizeValue([parseNumberAttribute(start ?? null, this.#min), parseNumberAttribute(end ?? null, this.#max)]);
    }
    // In single mode, prefer zero when it is inside a negative-to-positive range;
    // otherwise the default is the minimum value.
    const defaultValue = this.#getSingleDefaultValue();
    const singleValue = value?.includes(",") ? value.split(",")[1] : value;
    return this.#normalizeValue(parseNumberAttribute(singleValue ?? null, defaultValue));
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
    this.#updateFormValue();
    this.#render(this.getBoundingClientRect().width);
  }

  #cloneValue(value: RangeInputValue): RangeInputValue {
    return Array.isArray(value) ? ([...value] as [number, number]) : value;
  }

  #updateFormValue(): void {
    const value = Array.isArray(this.#value) ? this.#value.join(",") : String(this.#value);
    this.#internals?.setFormValue(value);
  }

  #clearValue(): void {
    this.#hasValue = false;
    this.#value = this.#parseValueAttribute(null);
    this.#updateFormValue();
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
    renderRange(
      this.#elements,
      this.min,
      this.max,
      this.step,
      this.tickStep,
      this.minorTickStep,
      this.showTickLabels,
      value => this.#formatValue(this.tickLabelFormatter(value)),
      value => this.#formatValue(value),
      this.#value,
      this.#startPoint,
      width,
    );
    for (const handle of this.#elements.handles.children) {
      handle.setAttribute("tabindex", this.#disabled ? "-1" : "0");
    }
    this.#syncMessageAccessibility();
  }

  #setLabel(label: string): void {
    this.#elements.label.textContent = label;
    if (this.#internals) this.#internals.ariaLabel = label || null;
    this.#elements.svg.setAttribute("aria-labelledby", label ? this.#elements.label.id : "range-title");
  }

  #focusFirstHandle(): void {
    (this.#elements.handles.firstElementChild as SVGCircleElement | null)?.focus();
  }

  reset(): void {
    this.#isDirty = false;
    this.#setValue(this.#initialValue);
    this.#validation.reset();
    this.#internals?.setValidity({});
  }

  formResetCallback(): void {
    this.reset();
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
        message: getRequiredMessage(i18n, this.label || null),
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
  get validity() {
    return this.#internals?.validity;
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

defineWebComponent("jb-range-input", JBRangeInputWebComponent);

declare global {
  interface HTMLElementTagNameMap {
    "jb-range-input": JBRangeInputWebComponent;
  }
}
