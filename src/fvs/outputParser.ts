import type { CarbonResultSeries } from "../domain/carbonResults";

export function parseSimpleCarbonCsv(csv: string, scenarioId: string, scenarioName: string): CarbonResultSeries {
  const lines = csv.trim().split(/\r?\n/);
  const headers = lines[0]?.split(",").map((header) => header.trim()) ?? [];
  const warnings: string[] = [];

  for (const required of ["year", "live_tree_carbon_tons", "selected_pool_total_carbon_tons"]) {
    if (!headers.includes(required)) {
      warnings.push(`Expected carbon output column "${required}" was not found.`);
    }
  }

  const points = lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = Object.fromEntries(headers.map((header, index) => [header, Number(values[index])]));
    return {
      year: row.year,
      liveTreeCarbonTons: row.live_tree_carbon_tons,
      standingDeadCarbonTons: row.standing_dead_carbon_tons,
      downDeadWoodCarbonTons: row.down_dead_wood_carbon_tons,
      biomassCarbonTons: row.biomass_carbon_tons,
      harvestedCarbonTons: row.harvested_carbon_tons,
      selectedPoolTotalCarbonTons: row.selected_pool_total_carbon_tons
    };
  });

  return {
    scenarioId,
    scenarioName,
    units: "tons_carbon",
    points,
    includedPools: ["live_tree", "standing_dead", "down_dead_wood", "biomass", "harvested"],
    excludedPools: ["soil_carbon"],
    fvsSourceFiles: ["demo-carbon-output.csv"],
    parserWarnings: warnings
  };
}

export function parseFvsSummaryOutput(text: string, scenarioId: string, scenarioName: string, sourceFiles: string[] = []): CarbonResultSeries {
  const summaryPoints = text
    .split(/\r?\n/)
    .map((line) => parseSummaryLine(line))
    .filter((point): point is NonNullable<ReturnType<typeof parseSummaryLine>> => Boolean(point));
  const carbonPoints = uniquePointsByYear(parseStandCarbonReport(text));
  const points = mergeCarbonAndSummaryPoints(carbonPoints, summaryPoints);
  const hasCarbon = carbonPoints.length > 0;

  return {
    scenarioId,
    scenarioName,
    units: "tons_carbon",
    points,
    includedPools: hasCarbon
      ? ["aboveground_live", "belowground_live", "standing_dead", "down_dead_wood", "forest_floor", "shrub_herb", "removed_carbon"]
      : ["official_fvs_summary_volume"],
    excludedPools: hasCarbon ? ["soil_carbon"] : ["soil_carbon", "unverified_carbon_tables"],
    fvsSourceFiles: sourceFiles,
    parserWarnings: hasCarbon
      ? ["Official FVS stand carbon report parsed from FMIN/CARBREPT output. Review FVS carbon settings and units before relying on results."]
      : ["Official FVS executable ran and CARBINE parsed FVS summary volume rows. Carbon-specific output was not found, so carbon fields remain blank."]
  };
}

function parseStandCarbonReport(text: string) {
  const points = [];
  let inCarbonReport = false;

  for (const line of text.split(/\r?\n/)) {
    if (line.includes("STAND CARBON REPORT")) {
      inCarbonReport = true;
      continue;
    }
    if (!inCarbonReport) continue;

    const fields = line.trim().split(/\s+/);
    if (fields.length !== 12 && fields.length !== 13) continue;
    const numeric = fields.map(Number);
    if (!numeric.every(Number.isFinite)) continue;

    const [
      year,
      abovegroundLiveTotal,
      abovegroundLiveMerchantable,
      belowgroundLive,
      belowgroundDead,
      standingDead,
      downDeadWood,
      forestFloor,
      shrubHerb,
      totalStandCarbon,
      removedCarbon,
      fireReleasedCarbon
    ] = numeric.length === 13 ? numeric.slice(1) : numeric;

    points.push({
      year,
      liveTreeCarbonTons: abovegroundLiveTotal + belowgroundLive,
      standingDeadCarbonTons: standingDead,
      downDeadWoodCarbonTons: downDeadWood,
      biomassCarbonTons: abovegroundLiveTotal,
      harvestedCarbonTons: removedCarbon,
      selectedPoolTotalCarbonTons: totalStandCarbon,
      notes: [
        `FVS carbon report row. Merch live carbon ${abovegroundLiveMerchantable.toFixed(1)}, belowground dead ${belowgroundDead.toFixed(1)}, forest floor ${forestFloor.toFixed(1)}, shrub/herb ${shrubHerb.toFixed(1)}, fire released ${fireReleasedCarbon.toFixed(1)}.`
      ]
    });
  }

  return points;
}

function mergeCarbonAndSummaryPoints(
  carbonPoints: ReturnType<typeof parseStandCarbonReport>,
  summaryPoints: Array<NonNullable<ReturnType<typeof parseSummaryLine>>>
) {
  const uniqueSummaryPoints = uniquePointsByYear(summaryPoints);
  if (carbonPoints.length === 0) return uniqueSummaryPoints;
  const merged = carbonPoints.map((carbonPoint) => {
    const summaryPoint = uniqueSummaryPoints.find((point) => point.year === carbonPoint.year);
    return summaryPoint ? { ...summaryPoint, ...carbonPoint, notes: [...(summaryPoint.notes ?? []), ...(carbonPoint.notes ?? [])] } : carbonPoint;
  });
  const carbonYears = new Set(carbonPoints.map((point) => point.year));
  return [...merged, ...uniqueSummaryPoints.filter((point) => !carbonYears.has(point.year))].sort((left, right) => left.year - right.year);
}

function uniquePointsByYear<T extends { year: number }>(points: T[]): T[] {
  const byYear = new Map<number, T>();
  for (const point of points) {
    if (!byYear.has(point.year)) byYear.set(point.year, point);
  }
  return [...byYear.values()];
}

function parseSummaryLine(line: string) {
  if (!/^\d{4}\s+/.test(line)) return undefined;
  const fields = line.trim().split(/\s+/);
  if (fields.length < 28) return undefined;

  const year = Number(fields[0]);
  const age = Number(fields[1]);
  const treesPerAcre = Number(fields[2]);
  const basalAreaFt2PerAcre = Number(fields[3]);
  const totalVolumeCuFt = Number(fields[8]);
  const merchantableVolumeCuFt = Number(fields[9]);
  const removedTreesPerAcre = Number(fields[12]);
  const removedTotalVolumeCuFt = Number(fields[13]);
  const removedMerchantableVolumeCuFt = Number(fields[14]);
  const afterTreatmentBasalAreaFt2PerAcre = Number(fields[17]);
  if (![year, age, totalVolumeCuFt].every(Number.isFinite)) return undefined;
  const hasRemovals = Number.isFinite(removedTreesPerAcre) && removedTreesPerAcre > 0;

  return {
    year,
    age,
    treesPerAcre: hasRemovals ? treesPerAcre - removedTreesPerAcre : treesPerAcre,
    basalAreaFt2PerAcre: hasRemovals && Number.isFinite(afterTreatmentBasalAreaFt2PerAcre)
      ? afterTreatmentBasalAreaFt2PerAcre
      : basalAreaFt2PerAcre,
    totalVolumeCuFt: hasRemovals && Number.isFinite(removedTotalVolumeCuFt)
      ? totalVolumeCuFt - removedTotalVolumeCuFt
      : totalVolumeCuFt,
    merchantableVolumeCuFt: hasRemovals && Number.isFinite(removedMerchantableVolumeCuFt)
      ? merchantableVolumeCuFt - removedMerchantableVolumeCuFt
      : merchantableVolumeCuFt,
    notes: [
      hasRemovals
        ? "Official FVS summary row; volume and basal area use after-treatment residual values."
        : "Official FVS summary row; not a parsed carbon table."
    ]
  };
}
