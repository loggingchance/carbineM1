import type { CarbineRunRequest } from "../domain/fvsRunRequest";
import { scenarioDisplayName, type ScenarioDefinition } from "../domain/scenarioSchema";
import type { TreeRecord } from "../domain/inventorySchema";

export interface MicroFvsRunPayload {
  stand_init: MicroFvsStandInit;
  tree_init: {
    trees: MicroFvsTreeInitRecord[] | null;
  };
  template_params: {
    num_cycles: number;
    cycle_length: number;
  };
  treatments?: string[];
  disturbances?: string[];
  stand_stock_params: {
    add_stand_stock: boolean;
  };
}

export interface MicroFvsStandInit {
  stand_id: string;
  variant: string;
  inv_year: number;
  basal_area_factor: number;
  inv_plot_size: number;
  brk_dbh: number;
  location: number;
  latitude?: number;
  longitude?: number;
  num_plots?: number;
  site_species?: number;
  site_index?: number;
}

export interface MicroFvsTreeInitRecord {
  stand_id: string;
  plot_id?: number;
  tree_id?: number | string;
  tree_count: number;
  species: string;
  diameter: number;
  history: number;
  ht?: number;
  crratio?: number;
}

export function buildMicroFvsRunPayload(request: CarbineRunRequest, scenario: ScenarioDefinition): MicroFvsRunPayload {
  assertMicroFvsScenarioSupported(scenario);

  const cycleLength = request.project.cycleLengthYears ?? 5;
  return {
    stand_init: buildMicroFvsStandInit(request),
    tree_init: {
      trees: request.inventory.length > 0 ? request.inventory.map((record, index) => buildMicroFvsTreeRecord(record, index)) : null
    },
    template_params: {
      num_cycles: fvsCycleCountForProjection(request.project.projectionYears, cycleLength),
      cycle_length: cycleLength
    },
    stand_stock_params: {
      add_stand_stock: true
    }
  };
}

export function buildMicroFvsStandInit(request: CarbineRunRequest): MicroFvsStandInit {
  const standId = firstStandId(request);
  const plotCount = new Set(request.inventory.map((record, index) => record.plotId?.trim() || `row-${index + 1}`)).size;

  return removeUndefined({
    stand_id: standId,
    variant: request.fvs.variant.trim().toUpperCase(),
    inv_year: request.project.inventoryYear,
    basal_area_factor: -15,
    inv_plot_size: 0,
    brk_dbh: 0,
    location: request.project.forestLocationCode,
    latitude: request.project.location.latitude,
    longitude: request.project.location.longitude,
    num_plots: plotCount || undefined,
    site_species: request.project.siteSpeciesCode,
    site_index: request.project.siteIndex
  });
}

export function buildMicroFvsTreeRecord(record: TreeRecord, index: number): MicroFvsTreeInitRecord {
  return removeUndefined({
    stand_id: record.standId || `stand-${index + 1}`,
    plot_id: numericPlotId(record.plotId, index),
    tree_id: record.treeId?.trim() || index + 1,
    tree_count: record.treesPerAcre,
    species: normalizeSpeciesCode(record.speciesCode),
    diameter: record.dbhIn,
    history: record.status === "live" || record.status === "leave" ? 1 : 6,
    ht: record.heightFt,
    crratio: normalizeCrownRatio(record.crownRatio)
  });
}

export function assertMicroFvsScenarioSupported(scenario: ScenarioDefinition): void {
  if (scenario.type === "baseline") return;
  throw new Error(
    `MicroFVS payload mapping supports baseline runs only. Scenario "${scenarioDisplayName(scenario)}" needs explicit treatment mapping before it can be sent to MicroFVS.`
  );
}

function firstStandId(request: CarbineRunRequest): string {
  return request.inventory[0]?.standId || request.project.standName || request.project.projectName || "carbine-stand";
}

function numericPlotId(plotId: string | undefined, index: number): number {
  if (!plotId?.trim()) return index + 1;
  const numeric = Number(plotId);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : index + 1;
}

function normalizeCrownRatio(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  const percent = value > 1 ? value : value * 100;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

function normalizeSpeciesCode(value: string): string {
  const normalized = value.trim().toUpperCase();
  return neSpeciesCodes[normalized] ?? normalized.slice(0, 2);
}

function fvsCycleCountForProjection(projectionYears: number, cycleLengthYears: number): number {
  return Math.max(2, Math.ceil(projectionYears / cycleLengthYears) + 1);
}

function removeUndefined<T extends Record<string, unknown>>(record: T): T {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)) as T;
}

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
