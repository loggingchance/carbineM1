export const CARBINE_CARBON_DISPLAY_UNIT_LABEL = "tonnes C/ac";
export const CARBINE_CARBON_DISPLAY_UNIT_LONG = "metric tonnes of carbon per acre";
export const CARBINE_CARBON_SOURCE_UNIT_LONG = "US short tons of carbon per acre";

const SHORT_TON_TO_METRIC_TONNE = 0.90718474;

export function shortTonsCarbonPerAcreToTonnesCarbonPerAcre(value: number): number {
  return value * SHORT_TON_TO_METRIC_TONNE;
}

export function displayCarbonValue(value: number | undefined): number | undefined {
  return value === undefined ? undefined : shortTonsCarbonPerAcreToTonnesCarbonPerAcre(value);
}

export function formatCarbonNumber(value: number | undefined, digits = 1): string {
  const converted = displayCarbonValue(value);
  return converted === undefined ? "" : converted.toFixed(digits);
}

export function formatCarbonWithUnit(value: number | undefined, digits = 1): string {
  const converted = displayCarbonValue(value);
  return converted === undefined ? "" : `${converted.toFixed(digits)} ${CARBINE_CARBON_DISPLAY_UNIT_LABEL}`;
}

export function formatCarbonSignedDelta(value: number | undefined, baseline: number | undefined, digits = 1): string {
  if (value === undefined || baseline === undefined) return "";
  const delta = shortTonsCarbonPerAcreToTonnesCarbonPerAcre(value - baseline);
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(digits)}`;
}

export function formatCarbonSignedNumber(value: number | undefined, digits = 1): string {
  if (value === undefined) return "";
  const converted = shortTonsCarbonPerAcreToTonnesCarbonPerAcre(value);
  return `${converted >= 0 ? "+" : ""}${converted.toFixed(digits)}`;
}
