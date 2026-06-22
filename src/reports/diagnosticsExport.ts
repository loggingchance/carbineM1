import type { CarbineScenarioResults } from "../domain/carbonResults";
import type { CarbineRunRequest } from "../domain/fvsRunRequest";
import { carbineBuildId } from "../config/buildInfo";

export function buildDiagnosticsExport(
  request: CarbineRunRequest,
  results: CarbineScenarioResults | undefined,
  generatedPreview: string,
  currentRequest?: CarbineRunRequest
): string {
  const currentScenarioCount = currentRequest?.scenarios.length ?? request.scenarios.length;
  const requestMatchesCurrent = !currentRequest || requestsHaveSameScenarioSet(request, currentRequest);
  const resultScenarioIds = new Set(results?.series.map((series) => series.scenarioId) ?? []);
  const missingResultScenarioIds = request.scenarios
    .map((scenario) => scenario.id)
    .filter((scenarioId) => !resultScenarioIds.has(scenarioId));
  const extraResultScenarioIds = [...resultScenarioIds].filter(
    (scenarioId) => !request.scenarios.some((scenario) => scenario.id === scenarioId)
  );
  const resultsCoverRequest = missingResultScenarioIds.length === 0 && extraResultScenarioIds.length === 0;
  return JSON.stringify(
    {
      format: "carbine-diagnostics",
      version: 1,
      buildId: carbineBuildId,
      exportedAt: new Date().toISOString(),
      summary: {
        buildId: carbineBuildId,
        variant: request.fvs.variant,
        scenarioCount: request.scenarios.length,
        currentScenarioCount,
        requestMatchesCurrent,
        resultsCoverRequest,
        missingResultScenarioIds,
        extraResultScenarioIds,
        inventoryRecordCount: request.inventory.length,
        adapterName: results?.adapterName ?? null,
        isRealFvs: results?.isRealFvs ?? null,
        resultSeriesCount: results?.series.length ?? 0,
        runArtifactCount: results?.runArtifacts?.length ?? 0,
        treatmentEffects: results ? buildTreatmentEffectSummary(results) : []
      },
      request,
      currentRequest: requestMatchesCurrent ? undefined : currentRequest,
      generatedPreview,
      results,
      runArtifacts: results?.runArtifacts ?? []
    },
    null,
    2
  );
}

function requestsHaveSameScenarioSet(a: CarbineRunRequest, b: CarbineRunRequest): boolean {
  if (a.scenarios.length !== b.scenarios.length) return false;
  return a.scenarios.every((scenario, index) => {
    const other = b.scenarios[index];
    return (
      other !== undefined &&
      scenario.id === other.id &&
      scenario.name === other.name &&
      scenario.type === other.type &&
      JSON.stringify(scenario.treatmentYears) === JSON.stringify(other.treatmentYears) &&
      scenario.simpleControls?.percentBasalAreaRemoval === other.simpleControls?.percentBasalAreaRemoval &&
      scenario.simpleControls?.minDbhIn === other.simpleControls?.minDbhIn &&
      scenario.simpleControls?.maxDbhIn === other.simpleControls?.maxDbhIn
    );
  });
}

function buildTreatmentEffectSummary(results: CarbineScenarioResults) {
  const baseline = results.series.find((series) => series.scenarioId === "baseline")
    ?? results.series.find((series) => series.scenarioName.toLowerCase() === "no treatment")
    ?? results.series[0];
  const baselineByYear = new Map(baseline?.points.map((point) => [point.year, point]) ?? []);

  return results.series
    .filter((series) => series.scenarioId !== baseline?.scenarioId)
    .map((series) => {
      const removedPoints = series.points.filter((point) => (point.harvestedCarbonTons ?? 0) > 0);
      const finalCarbonPoint = [...series.points].reverse().find((point) => point.selectedPoolTotalCarbonTons !== undefined);
      const finalBaseline = finalCarbonPoint ? baselineByYear.get(finalCarbonPoint.year) : undefined;
      return {
        scenarioId: series.scenarioId,
        scenarioName: series.scenarioName,
        removedCarbonByYear: removedPoints.map((point) => ({
          year: point.year,
          removedCarbonTons: point.harvestedCarbonTons
        })),
        finalCarbonYear: finalCarbonPoint?.year,
        finalSelectedPoolTotalCarbonTons: finalCarbonPoint?.selectedPoolTotalCarbonTons,
        finalSelectedPoolDeltaVsBaselineTons:
          finalCarbonPoint?.selectedPoolTotalCarbonTons !== undefined && finalBaseline?.selectedPoolTotalCarbonTons !== undefined
            ? finalCarbonPoint.selectedPoolTotalCarbonTons - finalBaseline.selectedPoolTotalCarbonTons
            : undefined,
        finalLiveTreeCarbonTons: finalCarbonPoint?.liveTreeCarbonTons,
        finalLiveTreeCarbonDeltaVsBaselineTons:
          finalCarbonPoint?.liveTreeCarbonTons !== undefined && finalBaseline?.liveTreeCarbonTons !== undefined
            ? finalCarbonPoint.liveTreeCarbonTons - finalBaseline.liveTreeCarbonTons
            : undefined
      };
    });
}
