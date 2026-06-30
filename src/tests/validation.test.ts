import { describe, expect, it } from "vitest";
import { parseInventoryCsv } from "../domain/validation";

describe("parseInventoryCsv", () => {
  it("accepts a valid inventory", () => {
    const parsed = parseInventoryCsv("stand_id,species_code,dbh_in,trees_per_acre\nS1,SM,12.5,3.2");
    expect(parsed.validation.ok).toBe(true);
    expect(parsed.records).toHaveLength(1);
    expect(parsed.records[0].speciesCode).toBe("SM");
  });

  it("reports missing required columns", () => {
    const parsed = parseInventoryCsv("stand_id,species_code,dbh_in\nS1,SM,12.5");
    expect(parsed.validation.ok).toBe(false);
    expect(parsed.validation.messages.some((message) => message.field === "trees_per_acre")).toBe(true);
  });

  it("reports non-numeric dbh", () => {
    const parsed = parseInventoryCsv("stand_id,species_code,dbh_in,trees_per_acre\nS1,SM,large,3.2");
    expect(parsed.validation.ok).toBe(false);
    expect(parsed.validation.messages[0].message).toContain("DBH must be a number");
  });

  it("maps common species names when they appear in the species_code column", () => {
    const parsed = parseInventoryCsv("stand_id,species_code,dbh_in,trees_per_acre\nS1,RED MAPLE,12.5,3.2");
    expect(parsed.validation.ok).toBe(true);
    expect(parsed.records[0].speciesCode).toBe("RM");
  });

  it("accepts inventory files without a stand_id column", () => {
    const parsed = parseInventoryCsv("species_code,dbh_in,trees_per_acre\nSM,12.5,3.2");
    expect(parsed.validation.ok).toBe(true);
    expect(parsed.records).toHaveLength(1);
    expect(parsed.records[0].standId).toBe("Imported stand");
    expect(parsed.validation.messages.some((message) => message.field === "stand_id")).toBe(true);
  });
});
