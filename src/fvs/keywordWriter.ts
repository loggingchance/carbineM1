import type { CarbineRunRequest } from "../domain/fvsRunRequest";
import { scenarioDisplayName, type ScenarioDefinition } from "../domain/scenarioSchema";
import type { TreeRecord } from "../domain/inventorySchema";

const neSpeciesCodes: Record<string, string> = {
  "RED MAPLE": "RM",
  "AMERICAN BEECH": "AB",
  "YELLOW BIRCH": "YB",
  "EASTERN HEMLOCK": "EH",
  "SUGAR MAPLE": "SM",
  "RED SPRUCE": "RS",
  "BLACK CHERRY": "BC",
  "EASTERN WHITE PINE": "WP",
  "WHITE PINE": "WP",
  "WHITE ASH": "WA",
  "PAPER BIRCH": "PB",
  "NORTHERN RED OAK": "RO",
  "RED OAK": "RO",
  RM: "RM",
  AB: "AB",
  YB: "YB",
  EH: "EH",
  SM: "SM",
  RS: "RS",
  BC: "BC",
  WP: "WP",
  WA: "WA",
  PB: "PB",
  RO: "RO"
};

export function writeKeywordPreview(request: CarbineRunRequest, scenario: ScenarioDefinition): string {
  const name = scenarioDisplayName(scenario);
  const cycleLength = request.project.cycleLengthYears ?? 5;
  const cycles = fvsCycleCountForCarbonReport(request.project.projectionYears, cycleLength);
  const lines = [
    `* CARBINE generated keyword preview`,
    `* Project: ${request.project.projectName}`,
    `* Stand: ${request.project.standName}`,
    `* Variant: ${request.fvs.variant}`,
    `* Scenario: ${name}`,
    `* WARNING: Review against official FVS examples before real execution.`,
    `INVYEAR ${request.project.inventoryYear}`,
    `NUMCYCLE ${cycles}`,
    `TIMEINT 0 ${cycleLength}`,
    `SITECODE ${request.project.siteSpeciesCode ?? 13} ${request.project.siteIndex ?? 56}`,
    `* Carbon reporting keywords are intentionally not finalized in this preview.`
  ];

  if (scenario.type === "thin" || scenario.type === "harvest") {
    lines.push(`* Treatment requested in years: ${scenario.treatmentYears.join(", ")}`);
    if (scenario.simpleControls?.percentBasalAreaRemoval) {
      lines.push(`* Percent basal area removal: ${scenario.simpleControls.percentBasalAreaRemoval}`);
    }
  }

  if (scenario.customFvsKeywordText) {
    lines.push("* Custom advanced keyword snippet follows.");
    lines.push(scenario.customFvsKeywordText);
  }

  return `${lines.join("\n")}\n`;
}

export function writeInventoryPreview(request: CarbineRunRequest): string {
  const header = "stand_id,plot_id,tree_id,species,dbh_in,trees_per_acre,height_ft,crown_ratio,status,notes";
  const rows = request.inventory.map((record) =>
    [
      record.standId,
      record.plotId ?? "",
      record.treeId ?? "",
      record.speciesCode,
      record.dbhIn,
      record.treesPerAcre,
      record.heightFt ?? "",
      record.crownRatio ?? "",
      record.status,
      record.notes ?? ""
    ].join(",")
  );
  return `${[header, ...rows].join("\n")}\n`;
}

export function writeOfficialKeywordFile(request: CarbineRunRequest, scenario: ScenarioDefinition): string {
  const name = scenarioDisplayName(scenario);
  const cycleLength = request.project.cycleLengthYears ?? 5;
  const cycles = fvsCycleCountForCarbonReport(request.project.projectionYears, cycleLength);
  const lines = [
    "SCREEN",
    "NOAUTOES",
    "STATS",
    "STDIDENT",
    fixedText(request.project.standName || request.project.projectName, 8, 72),
    `* Scenario: ${name}`,
    "DESIGN        -15.0       0.0",
    "STDINFO        922.0                60.0     315.0      30.0      20.0",
    `SITECODE    ${numberField(request.project.siteSpeciesCode ?? 13, 8, 0)}${numberField(request.project.siteIndex ?? 56, 10, 0)}`,
    `INVYEAR       ${request.project.inventoryYear.toFixed(1)}`,
    `NUMCYCLE        ${cycles.toFixed(1)}`,
    `TIMEINT         0.0       ${cycleLength.toFixed(1)}`,
    "TREEFMT",
    "(I4,I8,F8.4,I2,A8,F8.2,F8.2,F8.2,F8.2,F8.2,I4,6I4,I4,I4,5I4,F8.0)",
    "",
    "TREEDATA",
    "ECHOSUM",
    "FMIN",
    "CARBCALC         0         0",
    "CARBREPT",
    "END",
    "COMPUTE          0",
    "liveC = AABVCRB",
    "merchC = AMERCRB",
    "remC = RABVCRB",
    "END"
  ];

  if ((scenario.type === "thin" || scenario.type === "harvest") && scenario.simpleControls?.percentBasalAreaRemoval) {
    const treatmentYear = scenario.treatmentYears[0] ?? request.project.inventoryYear + cycleLength;
    const removalFraction = Math.max(0, Math.min(1, scenario.simpleControls.percentBasalAreaRemoval / 100));
    const minDbh = scenario.simpleControls.minDbhIn ?? 0;
    const maxDbh = scenario.simpleControls.maxDbhIn ?? 999;
    lines.push(
      `THINDBH      ${treatmentYear.toFixed(1)}      ${minDbh.toFixed(1).padStart(4)}     ${maxDbh.toFixed(1).padStart(5)}      ${removalFraction.toFixed(2)}`
    );
  }

  if (scenario.customFvsKeywordText?.trim()) {
    lines.push("* Custom advanced keyword snippet follows.", scenario.customFvsKeywordText.trim());
  }

  lines.push("PROCESS", "STOP");
  return `${lines.join("\n")}\n`;
}

export function writeOfficialTreeFile(request: CarbineRunRequest): string {
  const plotNumbers = buildPlotNumberMap(request.inventory);
  const rows = request.inventory.map((record, index) => {
    const plotKey = record.plotId?.trim() || `row-${index + 1}`;
    return writeTreeRecord(record, index + 1, plotNumbers.get(plotKey) ?? index + 1);
  });
  return `${[...rows, "-999"].join("\n")}\n`;
}

function writeTreeRecord(record: TreeRecord, index: number, plotNumber: number): string {
  const species = normalizeSpeciesCode(record.speciesCode);
  const crownRatioSource = record.crownRatio === undefined ? 35 : record.crownRatio > 1 ? record.crownRatio : record.crownRatio * 100;
  const crownRatio = Math.max(1, Math.min(99, Math.round(crownRatioSource)));
  const expansion = record.treesPerAcre;
  return [
    intField(plotNumber, 4),
    intField(Number(record.treeId) || index, 8),
    numberField(expansion, 8, 4),
    intField(record.status === "live" || record.status === "leave" ? 1 : 6, 2),
    textField(species, 8),
    numberField(record.dbhIn, 8, 2),
    numberField(0, 8, 2),
    numberField(record.heightFt ?? 0, 8, 2),
    numberField(0, 8, 2),
    numberField(0, 8, 2),
    intField(crownRatio, 4),
    intField(0, 4),
    intField(0, 4),
    intField(0, 4),
    intField(0, 4),
    intField(0, 4),
    intField(0, 4),
    intField(1, 4),
    intField(0, 4),
    intField(0, 4),
    intField(0, 4),
    intField(0, 4),
    intField(0, 4),
    numberField(0, 8, 0)
  ].join("");
}

function buildPlotNumberMap(records: TreeRecord[]): Map<string, number> {
  const map = new Map<string, number>();
  records.forEach((record, index) => {
    const key = record.plotId?.trim() || `row-${index + 1}`;
    if (!map.has(key)) map.set(key, map.size + 1);
  });
  return map;
}

function normalizeSpeciesCode(value: string): string {
  const normalized = value.trim().toUpperCase();
  return neSpeciesCodes[normalized] ?? normalized.slice(0, 2);
}

function fixedText(value: string, firstColumn: number, width: number): string {
  return `${" ".repeat(Math.max(0, firstColumn - 1))}${value.slice(0, width)}`;
}

function textField(value: string, width: number): string {
  return value.slice(0, width).padEnd(width, " ");
}

function intField(value: number, width: number): string {
  return Math.round(value).toString().padStart(width, " ");
}

function numberField(value: number, width: number, decimals: number): string {
  return value.toFixed(decimals).padStart(width, " ");
}

function fvsCycleCountForCarbonReport(projectionYears: number, cycleLengthYears: number): number {
  return Math.max(2, Math.ceil(projectionYears / cycleLengthYears) + 1);
}
