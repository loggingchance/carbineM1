export const defaultCycleLengthYears = 5;

export function generateCycleOffsets(projectionYears: number, cycleLengthYears = defaultCycleLengthYears): number[] {
  const safeProjection = Math.max(cycleLengthYears, projectionYears);
  const offsets: number[] = [];
  for (let offset = 0; offset <= safeProjection; offset += cycleLengthYears) {
    offsets.push(offset);
  }
  return offsets;
}

export function generateCycleYears(inventoryYear: number, projectionYears: number, cycleLengthYears = defaultCycleLengthYears): number[] {
  return generateCycleOffsets(projectionYears, cycleLengthYears).map((offset) => inventoryYear + offset);
}

export function generateTreatmentYearOptions(
  inventoryYear: number,
  projectionYears: number,
  cycleLengthYears = defaultCycleLengthYears
): Array<{ year: number; offset: number; label: string }> {
  return generateCycleOffsets(projectionYears, cycleLengthYears)
    .filter((offset) => offset < projectionYears)
    .map((offset) => ({
      offset,
      year: inventoryYear + offset,
      label: offset === 0 ? "Immediately / current year" : `Year ${offset}`
    }));
}

export function snapTreatmentYear(
  inventoryYear: number,
  projectionYears: number,
  year: number,
  cycleLengthYears = defaultCycleLengthYears
): number {
  const options = generateTreatmentYearOptions(inventoryYear, projectionYears, cycleLengthYears);
  return options.find((option) => option.year >= year)?.year ?? options[options.length - 1]?.year ?? inventoryYear;
}
