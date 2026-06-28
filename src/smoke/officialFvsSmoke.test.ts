import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { baselineScenario } from "../domain/scenarioSchema";
import { parseInventoryCsv } from "../domain/validation";
import { FvsOfficialSourceAdapter } from "../fvs/FvsOfficialSourceAdapter";

describe("official FVS smoke path", () => {
  it("runs the sample inventory through the local official FVS bridge and parses carbon", async () => {
    const csv = await readFile("src/tests/fixtures/ne-simple-stand/inventory.csv", "utf8");
    const parsed = parseInventoryCsv(csv);
    expect(parsed.validation.ok).toBe(true);
    expect(parsed.records.length).toBeGreaterThan(0);

    const adapter = new FvsOfficialSourceAdapter();
    const runtime = await adapter.getRuntimeInfo();
    expect(runtime.isRealFvs, runtime.notes.join(" ")).toBe(true);

    const request = {
      project: {
        projectName: "CARBINE smoke test",
        standName: "NE smoke stand",
        areaAcres: 1,
        inventoryYear: 2026,
        projectionYears: 30,
        cycleLengthYears: 5,
        forestLocationCode: 922,
        siteSpeciesCode: 13,
        siteIndex: 56,
        inventoryDesign: "expanded_tpa",
        location: { state: "VT", county: "Windsor" }
      },
      fvs: {
        variant: "NE",
        extensions: {
          carbon: true,
          fireAndFuels: true
        }
      },
      inventory: parsed.records,
      scenarios: [baselineScenario(2026)]
    };

    const validation = await adapter.validateRequest(request);
    expect(validation.ok, validation.messages.map((message) => message.message).join(" ")).toBe(true);

    const results = await adapter.runScenarioSet(request);
    expect(results.isRealFvs).toBe(true);
    expect(results.adapterName).toBe("Official FVS source");
    expect(results.series).toHaveLength(1);
    expect(results.series[0].points.length).toBeGreaterThan(0);
    expect(results.series[0].points.some((point) => point.selectedPoolTotalCarbonTons !== undefined)).toBe(true);
    expect(results.series[0].parserWarnings.join(" ")).toContain("stand carbon report parsed");
    expect(results.runArtifacts?.[0].rawOutputs && Object.keys(results.runArtifacts[0].rawOutputs)).toContain("input.out");
  }, 90_000);
});
