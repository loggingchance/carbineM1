import type { TreeRecord } from "./inventorySchema";
import { requiredInventoryColumns } from "./inventorySchema";

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationMessage {
  severity: ValidationSeverity;
  message: string;
  row?: number;
  field?: string;
}

export interface ValidationResult {
  ok: boolean;
  messages: ValidationMessage[];
}

const allowedStatus = new Set(["live", "dead", "cut", "leave", ""]);

export function parseInventoryCsv(csv: string): { records: TreeRecord[]; validation: ValidationResult } {
  const lines = csv
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { records: [], validation: result([{ severity: "error", message: "The inventory file is empty." }]) };
  }

  const rawHeaders = splitCsvLine(lines[0]).map((header) => normalizeHeader(header));
  const headers = rawHeaders.map((header) => canonicalHeader(header));
  const messages: ValidationMessage[] = [];

  for (const column of requiredInventoryColumns) {
    if (!headers.includes(column)) {
      messages.push({
        severity: "error",
        field: column,
        message: `Your inventory file is missing ${column}. Download the template or rename this column.`
      });
    }
  }

  if (messages.some((message) => message.severity === "error")) {
    return { records: [], validation: result(messages) };
  }

  const records: TreeRecord[] = [];
  lines.slice(1).forEach((line, index) => {
    const rowNumber = index + 2;
    const values = splitCsvLine(line);
    const row = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex]?.trim() ?? ""]));

    const dbhIn = parsePositiveNumber(row.dbh_in);
    const treesPerAcre = parsePositiveNumber(row.trees_per_acre);
    const heightFt = parseOptionalPositiveNumber(row.height_ft);
    const crownRatio = parseOptionalPositiveNumber(row.crown_ratio);
    const status = (row.status || "live").toLowerCase();

    if (!row.species_code) {
      messages.push({ severity: "error", row: rowNumber, field: "species_code", message: "species_code is required." });
    }
    if (dbhIn === null) {
      messages.push({ severity: "error", row: rowNumber, field: "dbh_in", message: `DBH must be a number in inches. Row ${rowNumber} has "${row.dbh_in}".` });
    } else if (dbhIn > 60) {
      messages.push({ severity: "warning", row: rowNumber, field: "dbh_in", message: `DBH of ${dbhIn} inches is unusual. Keep it if correct.` });
    }
    if (treesPerAcre === null) {
      messages.push({ severity: "error", row: rowNumber, field: "trees_per_acre", message: "trees_per_acre must be greater than zero." });
    }
    if (!allowedStatus.has(status)) {
      messages.push({ severity: "warning", row: rowNumber, field: "status", message: `Status "${row.status}" is not one of live, dead, cut, or leave. It will be treated as live.` });
    }

    if (dbhIn !== null && treesPerAcre !== null && row.species_code) {
      records.push({
        standId: row.stand_id || "Imported stand",
        plotId: row.plot_id || undefined,
        treeId: row.tree_id || undefined,
        speciesCode: canonicalSpeciesCode(row.species_code),
        dbhIn,
        heightFt: heightFt ?? undefined,
        treesPerAcre,
        status: allowedStatus.has(status) && status ? (status as TreeRecord["status"]) : "live",
        crownRatio: crownRatio ?? undefined,
        treeClass: row.tree_class || undefined,
        notes: row.notes || undefined
      });
    }
  });

  if (records.length > 0 && !headers.includes("stand_id")) {
    messages.push({
      severity: "info",
      field: "stand_id",
      message: "No stand_id column was found, so CARBINE used Imported stand as the stand label."
    });
  }

  if (records.length > 0 && records.filter((record) => record.heightFt === undefined).length / records.length > 0.5) {
    messages.push({
      severity: "warning",
      field: "height_ft",
      message: "Height is missing for many trees. FVS may estimate or proceed depending on variant and settings."
    });
  }

  return { records, validation: result(messages) };
}

function result(messages: ValidationMessage[]): ValidationResult {
  return {
    ok: !messages.some((message) => message.severity === "error"),
    messages
  };
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function canonicalHeader(header: string): string {
  const aliases: Record<string, string> = {
    stand: "stand_id",
    standid: "stand_id",
    stand_name: "stand_id",
    standname: "stand_id",
    species: "species_code",
    sp: "species_code",
    spcd: "species_code",
    spp: "species_code",
    tree_species: "species_code",
    fvs_species: "species_code",
    dbh: "dbh_in",
    diameter: "dbh_in",
    diameter_in: "dbh_in",
    dia: "dbh_in",
    dbh_inches: "dbh_in",
    tpa: "trees_per_acre",
    trees_acre: "trees_per_acre",
    treesperacre: "trees_per_acre",
    expansion_factor: "trees_per_acre",
    exp_factor: "trees_per_acre",
    tree_factor: "trees_per_acre",
    ht: "height_ft",
    height: "height_ft",
    total_height: "height_ft",
    total_height_ft: "height_ft",
    height_feet: "height_ft",
    cr: "crown_ratio",
    crown: "crown_ratio",
    live_dead: "status",
    condition: "status"
  };

  return aliases[header] ?? header;
}

function parsePositiveNumber(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseOptionalPositiveNumber(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function canonicalSpeciesCode(value: string): string {
  const normalized = normalizeHeader(value);
  const speciesAliases: Record<string, string> = {
    red_maple: "RM",
    acer_rubrum: "RM",
    american_beech: "AB",
    beech: "AB",
    fagus_grandifolia: "AB",
    yellow_birch: "YB",
    betula_alleghaniensis: "YB",
    eastern_hemlock: "EH",
    hemlock: "EH",
    tsuga_canadensis: "EH",
    sugar_maple: "SM",
    acer_saccharum: "SM",
    red_spruce: "RS",
    picea_rubens: "RS",
    black_cherry: "BC",
    prunus_serotina: "BC",
    white_pine: "WP",
    eastern_white_pine: "WP",
    pinus_strobus: "WP",
    red_oak: "RO",
    northern_red_oak: "RO",
    quercus_rubra: "RO",
    white_ash: "WA",
    fraxinus_americana: "WA",
    balsam_fir: "BF",
    paper_birch: "PB",
    betula_papyrifera: "PB"
  };

  return speciesAliases[normalized] ?? value.trim().toUpperCase();
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
}
