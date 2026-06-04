import type { TreeRecord } from "../../domain/inventorySchema";
import type { ParsedTable } from "./parseDelimited";
import type { ConfirmedMappings } from "./detectFields";
import { requiredImportFields, standardInventoryFields } from "./fieldSynonyms";
import { mapSpecies } from "./speciesMap";
import { mapStatus } from "./statusMap";

export interface UnitSettings {
  dbh: "in" | "cm";
  height: "ft" | "m";
  crownRatio: "decimal" | "percent";
  blankStatusAsLive: boolean;
}

export interface NormalizedImport {
  rows: TreeRecord[];
  csvRows: Record<string, string | number>[];
  rejectedRows: Array<Record<string, string>>;
  errors: string[];
  warnings: string[];
  assumptions: string[];
  summary: {
    sourceRows: number;
    acceptedRows: number;
    excludedRows: number;
    speciesCount: number;
    totalTpa: number;
    basalAreaSqftPerAc: number;
    heightCompletenessPct: number;
  };
}

export function normalizeImportRows(
  parsed: ParsedTable,
  mappings: ConfirmedMappings,
  units: UnitSettings,
  standFallback: string
): NormalizedImport {
  const errors: string[] = [];
  const warnings: string[] = [...parsed.parseWarnings];
  const assumptions: string[] = [];
  const rows: TreeRecord[] = [];
  const csvRows: NormalizedImport["csvRows"] = [];
  const rejectedRows: Array<Record<string, string>> = [];

  for (const field of requiredImportFields) {
    if (!mappings[field]) errors.push(`Required field "${field}" is not mapped.`);
  }
  if (errors.length > 0) {
    return emptyResult(parsed.rows.length, errors, warnings, assumptions);
  }

  if (units.dbh === "cm") assumptions.push("DBH converted from centimeters to inches.");
  if (units.height === "m") assumptions.push("Height converted from meters to feet.");
  if (units.crownRatio === "percent") assumptions.push("Crown ratio converted from percent to decimal.");
  if (units.blankStatusAsLive) assumptions.push("Blank status values treated as live.");

  parsed.rows.forEach((sourceRow, index) => {
    const rowNumber = index + 2;
    const get = (field: keyof ConfirmedMappings) => {
      const sourceField = mappings[field];
      return sourceField ? sourceRow[sourceField]?.trim() ?? "" : "";
    };
    const dbh = parseNumber(get("dbh_in"));
    const tpa = parseNumber(get("trees_per_acre"));
    const statusResult = mapStatus(get("status"), units.blankStatusAsLive);
    const speciesResult = mapSpecies(get("species"));
    const rowWarnings: string[] = [];

    if (statusResult.warning) rowWarnings.push(`Row ${rowNumber}: ${statusResult.warning}`);
    if (speciesResult.warning) rowWarnings.push(`Row ${rowNumber}: ${speciesResult.warning}`);
    if (dbh === undefined || dbh <= 0) {
      rejectedRows.push({ ...sourceRow, issue: "DBH must be numeric and greater than zero." });
      return;
    }
    if (tpa === undefined || tpa <= 0) {
      rejectedRows.push({ ...sourceRow, issue: "trees_per_acre must be numeric and greater than zero." });
      return;
    }
    if (statusResult.status === "exclude") {
      rejectedRows.push({ ...sourceRow, issue: "Row excluded by status mapping." });
      return;
    }

    const dbhIn = units.dbh === "cm" ? dbh / 2.54 : dbh;
    const rawHeight = parseNumber(get("height_ft"));
    const heightFt = rawHeight === undefined ? undefined : units.height === "m" ? rawHeight * 3.28084 : rawHeight;
    const rawCrown = parseNumber(get("crown_ratio"));
    const crownRatio = rawCrown === undefined ? undefined : units.crownRatio === "percent" ? rawCrown / 100 : rawCrown;
    const notes = [get("notes"), ...rowWarnings.map((warning) => warning.replace(`Row ${rowNumber}: `, ""))].filter(Boolean).join("; ");
    const tree: TreeRecord = {
      standId: get("stand_id") || standFallback || "Imported stand",
      plotId: get("plot_id") || undefined,
      treeId: get("tree_id") || String(index + 1),
      speciesCode: speciesResult.species,
      dbhIn,
      heightFt,
      treesPerAcre: tpa,
      crownRatio,
      status: statusResult.status,
      notes: notes || undefined
    };

    rows.push(tree);
    csvRows.push({
      stand_id: tree.standId,
      plot_id: tree.plotId ?? "",
      tree_id: tree.treeId ?? "",
      species: tree.speciesCode,
      dbh_in: round(tree.dbhIn, 3),
      trees_per_acre: round(tree.treesPerAcre, 4),
      height_ft: tree.heightFt === undefined ? "" : round(tree.heightFt, 2),
      crown_ratio: tree.crownRatio === undefined ? "" : round(tree.crownRatio, 3),
      status: tree.status,
      notes: tree.notes ?? ""
    });
    warnings.push(...rowWarnings);
  });

  const liveAndDead = rows.filter((row) => row.status === "live" || row.status === "dead");
  const basalAreaSqftPerAc = liveAndDead.reduce((sum, row) => sum + 0.005454154 * row.dbhIn * row.dbhIn * row.treesPerAcre, 0);
  return {
    rows,
    csvRows,
    rejectedRows,
    errors,
    warnings,
    assumptions,
    summary: {
      sourceRows: parsed.rows.length,
      acceptedRows: rows.length,
      excludedRows: rejectedRows.length,
      speciesCount: new Set(rows.map((row) => row.speciesCode)).size,
      totalTpa: rows.reduce((sum, row) => sum + row.treesPerAcre, 0),
      basalAreaSqftPerAc,
      heightCompletenessPct: rows.length ? (rows.filter((row) => row.heightFt !== undefined).length / rows.length) * 100 : 0
    }
  };
}

export function exportCarbineCsv(rows: NormalizedImport["csvRows"]): string {
  return [
    standardInventoryFields.join(","),
    ...rows.map((row) => standardInventoryFields.map((field) => escapeCsv(row[field] ?? "")).join(","))
  ].join("\n");
}

export function exportImportAudit(parsed: ParsedTable, mappings: ConfirmedMappings, units: UnitSettings, normalized: NormalizedImport): string {
  return JSON.stringify(
    {
      importDateLocal: new Date().toLocaleDateString(),
      sourceFormat: parsed.sourceFormat,
      delimiter: parsed.delimiter === "\t" ? "tab" : parsed.delimiter,
      fieldMappings: mappings,
      unitConversions: units,
      rowCounts: {
        sourceRows: normalized.summary.sourceRows,
        acceptedRows: normalized.summary.acceptedRows,
        excludedRows: normalized.summary.excludedRows
      },
      warnings: normalized.warnings,
      assumptions: normalized.assumptions
    },
    null,
    2
  );
}

function emptyResult(sourceRows: number, errors: string[], warnings: string[], assumptions: string[]): NormalizedImport {
  return {
    rows: [],
    csvRows: [],
    rejectedRows: [],
    errors,
    warnings,
    assumptions,
    summary: {
      sourceRows,
      acceptedRows: 0,
      excludedRows: 0,
      speciesCount: 0,
      totalTpa: 0,
      basalAreaSqftPerAc: 0,
      heightCompletenessPct: 0
    }
  };
}

function parseNumber(value: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function round(value: number, digits: number): number {
  return Number(value.toFixed(digits));
}

function escapeCsv(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
