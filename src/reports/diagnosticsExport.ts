import type { CarbineScenarioResults } from "../domain/carbonResults";
import type { CarbineRunRequest } from "../domain/fvsRunRequest";

export function buildDiagnosticsExport(
  request: CarbineRunRequest,
  results: CarbineScenarioResults | undefined,
  generatedPreview: string,
  currentRequest?: CarbineRunRequest
): string {
  const currentScenarioCount = currentRequest?.scenarios.length ?? request.scenarios.length;
  const requestMatchesCurrent = !currentRequest || currentScenarioCount === request.scenarios.length;
  return JSON.stringify(
    {
      format: "carbine-diagnostics",
      version: 1,
      exportedAt: new Date().toISOString(),
      summary: {
        variant: request.fvs.variant,
        scenarioCount: request.scenarios.length,
        currentScenarioCount,
        requestMatchesCurrent,
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
