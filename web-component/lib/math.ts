const MAX_DECIMAL_PLACES = 12;

function getDecimalPlaces(value: number): number {
  const [, fraction = "", exponent = "0"] = value.toString().match(/^[+-]?(?:\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i) ?? [];
  return Math.min(MAX_DECIMAL_PLACES, Math.max(0, fraction.length - Number(exponent)));
}

export function normalizeStep(value: number, fallback = 1): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function roundForSteps(value: number, ...steps: number[]): number {
  const precision = Math.max(getDecimalPlaces(value), ...steps.map(getDecimalPlaces));
  return Number(value.toFixed(precision));
}

export function snapValueToStep(value: number, min: number, max: number, step: number): number {
  const normalizedStep = normalizeStep(step);
  const maxStepIndex = Math.max(0, Math.floor((max - min) / normalizedStep + 1e-10));
  const stepIndex = Math.min(maxStepIndex, Math.max(0, Math.round((value - min) / normalizedStep)));
  return roundForSteps(min + stepIndex * normalizedStep, min, max, normalizedStep);
}
