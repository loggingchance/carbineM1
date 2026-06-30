import type { CarbineScenarioResults } from "../domain/carbonResults";
import { displayCarbonValue } from "../utils/carbonUnits";

export function resultsToCsv(results: CarbineScenarioResults): string {
  const header = [
    "scenario_id",
    "scenario_name",
    "year",
    "live_tree_carbon_tonnes_per_acre",
    "standing_dead_carbon_tonnes_per_acre",
    "down_dead_wood_carbon_tonnes_per_acre",
    "biomass_carbon_tonnes_per_acre",
    "harvested_carbon_tonnes_per_acre",
    "selected_pool_total_carbon_tonnes_per_acre",
    "live_tree_carbon_short_tons_per_acre",
    "standing_dead_carbon_short_tons_per_acre",
    "down_dead_wood_carbon_short_tons_per_acre",
    "biomass_carbon_short_tons_per_acre",
    "harvested_carbon_short_tons_per_acre",
    "selected_pool_total_carbon_short_tons_per_acre",
    "total_volume_cuft",
    "merchantable_volume_cuft",
    "basal_area_ft2_per_acre",
    "trees_per_acre"
  ];

  const rows = results.series.flatMap((series) =>
    series.points.map((point) =>
      [
        series.scenarioId,
        series.scenarioName,
        point.year,
        displayCarbonValue(point.liveTreeCarbonTons) ?? "",
        displayCarbonValue(point.standingDeadCarbonTons) ?? "",
        displayCarbonValue(point.downDeadWoodCarbonTons) ?? "",
        displayCarbonValue(point.biomassCarbonTons) ?? "",
        displayCarbonValue(point.harvestedCarbonTons) ?? "",
        displayCarbonValue(point.selectedPoolTotalCarbonTons) ?? "",
        point.liveTreeCarbonTons ?? "",
        point.standingDeadCarbonTons ?? "",
        point.downDeadWoodCarbonTons ?? "",
        point.biomassCarbonTons ?? "",
        point.harvestedCarbonTons ?? "",
        point.selectedPoolTotalCarbonTons ?? "",
        point.totalVolumeCuFt ?? "",
        point.merchantableVolumeCuFt ?? "",
        point.basalAreaFt2PerAcre ?? "",
        point.treesPerAcre ?? ""
      ].map(csvCell).join(",")
    )
  );

  return `${[header.join(","), ...rows].join("\n")}\n`;
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
