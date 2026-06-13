import { describe, expect, it } from "vitest";
import { parseFvsSummaryOutput, parseSimpleCarbonCsv } from "../fvs/outputParser";
import { addInitialYearConsistencyWarnings } from "../fvs/FvsOfficialSourceAdapter";

describe("parseSimpleCarbonCsv", () => {
  it("parses simple carbon fixture rows", () => {
    const parsed = parseSimpleCarbonCsv(
      "year,live_tree_carbon_tons,selected_pool_total_carbon_tons\n2026,10,14\n2036,12,17",
      "baseline",
      "No treatment"
    );
    expect(parsed.points).toHaveLength(2);
    expect(parsed.points[1].selectedPoolTotalCarbonTons).toBe(17);
    expect(parsed.excludedPools).toContain("soil_carbon");
  });
});

describe("official FVS run-set guardrails", () => {
  it("warns when inventory-year carbon differs before a treatment year", async () => {
    const series = [
      {
        scenarioId: "baseline",
        scenarioName: "No treatment",
        units: "tons_carbon" as const,
        points: [{ year: 2026, selectedPoolTotalCarbonTons: 15.6, liveTreeCarbonTons: 4.7 }],
        includedPools: [],
        excludedPools: [],
        fvsSourceFiles: [],
        parserWarnings: []
      },
      {
        scenarioId: "thin-2036",
        scenarioName: "Thin 25% BA in 2036",
        units: "tons_carbon" as const,
        points: [{ year: 2026, selectedPoolTotalCarbonTons: 13.5, liveTreeCarbonTons: 1.0 }],
        includedPools: [],
        excludedPools: [],
        fvsSourceFiles: [],
        parserWarnings: []
      }
    ];

    addInitialYearConsistencyWarnings(
      {
        project: {
          projectName: "Test",
          standName: "Stand",
          areaAcres: 1,
          inventoryYear: 2026,
          projectionYears: 30,
          cycleLengthYears: 5,
          location: { state: "VT" }
        },
        fvs: { variant: "NE", extensions: { carbon: true } },
        inventory: [],
        scenarios: [
          { id: "baseline", name: "No treatment", type: "baseline", startYear: 2026, treatmentYears: [] },
          { id: "thin-2036", name: "Treatment scenario", type: "thin", startYear: 2026, treatmentYears: [2036] }
        ]
      },
      series
    );

    expect(series[1].parserWarnings[0]).toContain("Inventory-year carbon differs");
  });
});

describe("parseFvsSummaryOutput", () => {
  it("parses official FVS summary rows", () => {
    const parsed = parseFvsSummaryOutput(
      "2026  60     0   0    0   0  61 11.6     5     5     3    17     0     0     0     0     0   0    0   0  61 11.6      10    0     0     0.1 999 55",
      "baseline",
      "No treatment",
      ["input.sum"]
    );
    expect(parsed.points).toHaveLength(1);
    expect(parsed.points[0].totalVolumeCuFt).toBe(5);
    expect(parsed.parserWarnings[0]).toContain("Official FVS executable ran");
  });

  it("parses official FVS stand carbon report rows and merges summary values", () => {
    const parsed = parseFvsSummaryOutput(
      [
        "                         STAND CARBON REPORT (BASED ON STOCKABLE AREA)",
        "YEAR    Total    Merch     Live     Dead     Dead      DDW    Floor  Shb/Hrb   Carbon   Carbon  from Fire",
        "2026      9.0      4.0      2.0     -1.0      1.0      0.5      3.0      0.2     15.7      0.1      0.0",
        "2026  60     0   0    0   0  61 11.6     5     5     3    17     0     0     0     0     0   0    0   0  61 11.6      10    0     0     0.1 999 55"
      ].join("\n"),
      "baseline",
      "No treatment",
      ["input.out", "input.sum"]
    );
    expect(parsed.points).toHaveLength(1);
    expect(parsed.points[0].selectedPoolTotalCarbonTons).toBe(15.7);
    expect(parsed.points[0].liveTreeCarbonTons).toBe(11);
    expect(parsed.points[0].totalVolumeCuFt).toBe(5);
    expect(parsed.parserWarnings[0]).toContain("stand carbon report parsed");
  });

  it("keeps final summary years when FVS carbon output stops before the last summary row", () => {
    const parsed = parseFvsSummaryOutput(
      [
        "                         STAND CARBON REPORT (BASED ON STOCKABLE AREA)",
        "YEAR    Total    Merch     Live     Dead     Dead      DDW    Floor  Shb/Hrb   Carbon   Carbon  from Fire",
        "2026      9.0      4.0      2.0      0.0      1.0      0.5      3.0      0.2     15.7      0.1      0.0",
        "2026  60     0   0    0   0  61 11.6     5     5     3    17     0     0     0     0     0   0    0   0  61 11.6      10    0     0     0.1 999 55",
        "2036  70     0   0    0   0  65 12.5     8     7     4    20     0     0     0     0     0   0    0   0  65 12.5       0    0     0     0.2 999 55"
      ].join("\n"),
      "baseline",
      "No treatment",
      ["input.out", "input.sum"]
    );

    expect(parsed.points).toHaveLength(2);
    expect(parsed.points[1].year).toBe(2036);
    expect(parsed.points[1].totalVolumeCuFt).toBe(8);
    expect(parsed.points[1].selectedPoolTotalCarbonTons).toBeUndefined();
  });

  it("deduplicates summary rows that appear in both input.out and input.sum", () => {
    const summaryRow =
      "2036  70     0   0    0   0  65 12.5     8     7     4    20     0     0     0     0     0   0    0   0  65 12.5       0    0     0     0.2 999 55";
    const parsed = parseFvsSummaryOutput(
      [summaryRow, summaryRow].join("\n"),
      "baseline",
      "No treatment",
      ["input.out", "input.sum"]
    );

    expect(parsed.points).toHaveLength(1);
    expect(parsed.points[0].year).toBe(2036);
  });

  it("uses after-treatment residual summary values when FVS reports removals", () => {
    const parsed = parseFvsSummaryOutput(
      "2046  80   126 180  266 272  79 16.2  5702  5622  4613 28728    20  1034  1023   885  5484 147  218 224  80 16.0      10   69     7    70.3 801 11",
      "thin-2046",
      "Thin 25% BA in 2046",
      ["input.sum"]
    );

    expect(parsed.points[0].treesPerAcre).toBe(106);
    expect(parsed.points[0].basalAreaFt2PerAcre).toBe(147);
    expect(parsed.points[0].totalVolumeCuFt).toBe(4668);
    expect(parsed.points[0].merchantableVolumeCuFt).toBe(4599);
    expect(parsed.points[0].notes?.[0]).toContain("after-treatment residual values");
  });
});
