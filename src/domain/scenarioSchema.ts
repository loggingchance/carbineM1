export type ScenarioType = "baseline" | "thin" | "harvest" | "custom";

export interface ScenarioDefinition {
  id: string;
  name: string;
  description?: string;
  type: ScenarioType;
  startYear: number;
  treatmentYears: number[];
  simpleControls?: {
    residualBasalAreaFt2Ac?: number;
    percentBasalAreaRemoval?: number;
    residualTreesPerAcre?: number;
    minDbhIn?: number;
    maxDbhIn?: number;
    speciesGroups?: string[];
  };
  customFvsKeywordText?: string;
}

export const baselineScenario = (inventoryYear: number): ScenarioDefinition => ({
  id: "baseline",
  name: "No treatment",
  description: "Baseline projection with no user-defined treatment.",
  type: "baseline",
  startYear: inventoryYear,
  treatmentYears: []
});

export const lightThinScenario = (inventoryYear: number): ScenarioDefinition => ({
  id: "thin-2035",
  name: "Light thinning",
  description: "Development scenario for UI testing. FVS keyword mapping requires review.",
  type: "thin",
  startYear: inventoryYear,
  treatmentYears: [inventoryYear + 10],
  simpleControls: {
    percentBasalAreaRemoval: 20,
    minDbhIn: 6
  }
});

export function treatmentYearOptions(inventoryYear: number, projectionYears: number): number[] {
  const cycleLength = 10;
  const lastYear = inventoryYear + Math.max(cycleLength, projectionYears);
  const years: number[] = [];
  for (let year = inventoryYear + cycleLength; year <= lastYear; year += cycleLength) {
    years.push(year);
  }
  return years;
}

export function snapTreatmentYear(inventoryYear: number, projectionYears: number, year: number): number {
  const options = treatmentYearOptions(inventoryYear, projectionYears);
  return options.find((option) => option >= year) ?? options[options.length - 1];
}

export function generatedScenarioName(scenario: ScenarioDefinition): string {
  if (scenario.type === "baseline") return "No treatment";
  return scenarioDisplayName({ ...scenario, name: "Treatment scenario" });
}

export function scenarioDisplayName(scenario: ScenarioDefinition): string {
  const name = scenario.name.trim();
  if (name && !isGenericScenarioName(name)) return name;
  if (scenario.type === "baseline") return "No treatment";

  const treatment = describeTreatment(scenario);
  if (scenario.type === "harvest") return `Harvest ${treatment}`;
  if (scenario.type === "custom") return `Custom FVS ${formatYears(scenario.treatmentYears)}`;
  return `Thin ${treatment}`;
}

function isGenericScenarioName(name: string): boolean {
  return ["treatment scenario", "scenario", "new scenario"].includes(name.toLowerCase());
}

function describeTreatment(scenario: ScenarioDefinition): string {
  const percent = scenario.simpleControls?.percentBasalAreaRemoval;
  const years = formatYears(scenario.treatmentYears);
  const dbh = formatDbhRange(scenario);
  const removal = percent ? `${percent}% BA` : "treatment";
  return [removal, years, dbh].filter(Boolean).join(" ");
}

function formatYears(years: number[]): string {
  if (years.length === 0) return "";
  if (years.length === 1) return `in ${years[0]}`;
  return `in ${years.join(", ")}`;
}

function formatDbhRange(scenario: ScenarioDefinition): string {
  const min = scenario.simpleControls?.minDbhIn;
  const max = scenario.simpleControls?.maxDbhIn;
  if (min !== undefined && max !== undefined) return `DBH ${min}-${max} in`;
  if (min !== undefined) return `DBH >= ${min} in`;
  if (max !== undefined) return `DBH <= ${max} in`;
  return "";
}
