import { describe, expect, it } from "vitest";
import { detectFieldMappings, suggestionsToMappings } from "../lib/import/detectFields";
import { exportCarbineCsv, normalizeImportRows } from "../lib/import/importWizard";
import { parseDelimitedTable } from "../lib/import/parseDelimited";

describe("Inventory Import Wizard utilities", () => {
  it("detects fields and exports the standard CARBINE schema", () => {
    const parsed = parseDelimitedTable("SPP,DIA,TPA,HT,STATUS\nSM,12.4,6.5,68,L", "csv");
    const mappings = suggestionsToMappings(detectFieldMappings(parsed.headers));
    const normalized = normalizeImportRows(
      parsed,
      mappings,
      { dbh: "in", height: "ft", crownRatio: "decimal", blankStatusAsLive: true },
      "Stand A"
    );
    const csv = exportCarbineCsv(normalized.csvRows);

    expect(mappings.species).toBe("SPP");
    expect(mappings.dbh_in).toBe("DIA");
    expect(normalized.rows).toHaveLength(1);
    expect(normalized.rows[0].speciesCode).toBe("SUGAR MAPLE");
    expect(csv.split("\n")[0]).toBe("stand_id,plot_id,tree_id,species,dbh_in,trees_per_acre,height_ft,crown_ratio,status,notes");
  });

  it("detects tab-delimited input and converts metric units", () => {
    const parsed = parseDelimitedTable("species\tdbh_cm\ttrees_per_acre\theight_m\tstatus\nred maple\t25.4\t2\t10\tlive", "tsv");
    const normalized = normalizeImportRows(
      parsed,
      { species: "species", dbh_in: "dbh_cm", trees_per_acre: "trees_per_acre", height_ft: "height_m", status: "status" },
      { dbh: "cm", height: "m", crownRatio: "decimal", blankStatusAsLive: true },
      "Stand A"
    );

    expect(parsed.delimiter).toBe("\t");
    expect(normalized.rows[0].dbhIn).toBe(10);
    expect(normalized.rows[0].heightFt).toBeCloseTo(32.8084);
  });

  it("blocks rows without an expansion factor", () => {
    const parsed = parseDelimitedTable("species,dbh,status\nSM,12,live", "csv");
    const normalized = normalizeImportRows(
      parsed,
      { species: "species", dbh_in: "dbh", status: "status" },
      { dbh: "in", height: "ft", crownRatio: "decimal", blankStatusAsLive: true },
      "Stand A"
    );

    expect(normalized.errors).toContain('Required field "trees_per_acre" is not mapped.');
    expect(normalized.rows).toHaveLength(0);
  });
});
