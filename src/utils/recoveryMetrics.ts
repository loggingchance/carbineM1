import type { CarbonResultSeries } from "../domain/carbonResults";
import type { CarbonPoolKey } from "./carbonPools";
import { getCarbonPoolValue } from "./carbonPools";

export interface RecoveryMetrics {
  treatmentYear: number;
  preTreatmentCarbon?: number;
  postTreatmentCarbon?: number;
  immediateChange?: number;
  lowestPostTreatmentCarbon?: number;
  endCarbon?: number;
  endDifferenceVsNoAction?: number;
  recoveryYear?: number;
  preTreatmentApproximated: boolean;
}

export function calculateRecoveryMetrics(
  baselineSeries: CarbonResultSeries | undefined,
  treatmentSeries: CarbonResultSeries,
  treatmentYear: number,
  selectedPool: CarbonPoolKey
): RecoveryMetrics {
  const points = [...treatmentSeries.points].sort((a, b) => a.year - b.year);
  const baselineByYear = new Map((baselineSeries?.points ?? []).map((point) => [point.year, point]));
  const treatmentPoint = points.find((point) => point.year >= treatmentYear);
  const priorPoint = [...points].reverse().find((point) => point.year < treatmentYear);
  const sameYearBaseline = baselineByYear.get(treatmentPoint?.year ?? treatmentYear);
  const baselineAtTreatment = baselineByYear.get(treatmentYear);

  const preTreatmentCarbon =
    getCarbonPoolValue(baselineAtTreatment, selectedPool) ??
    getCarbonPoolValue(sameYearBaseline, selectedPool) ??
    getCarbonPoolValue(priorPoint, selectedPool);
  const postTreatmentCarbon = getCarbonPoolValue(treatmentPoint, selectedPool);
  const postTreatmentPoints = points.filter((point) => point.year >= treatmentYear);
  const postValues = postTreatmentPoints
    .map((point) => getCarbonPoolValue(point, selectedPool))
    .filter((value): value is number => value !== undefined);
  const endPoint = [...points].reverse().find((point) => getCarbonPoolValue(point, selectedPool) !== undefined);
  const endCarbon = getCarbonPoolValue(endPoint, selectedPool);
  const baselineEndCarbon = getCarbonPoolValue(endPoint ? baselineByYear.get(endPoint.year) : undefined, selectedPool);
  const recoveryPoint =
    preTreatmentCarbon === undefined
      ? undefined
      : postTreatmentPoints.find((point) => {
          const value = getCarbonPoolValue(point, selectedPool);
          return value !== undefined && value >= preTreatmentCarbon;
        });

  return {
    treatmentYear,
    preTreatmentCarbon,
    postTreatmentCarbon,
    immediateChange:
      preTreatmentCarbon !== undefined && postTreatmentCarbon !== undefined ? postTreatmentCarbon - preTreatmentCarbon : undefined,
    lowestPostTreatmentCarbon: postValues.length ? Math.min(...postValues) : undefined,
    endCarbon,
    endDifferenceVsNoAction:
      endCarbon !== undefined && baselineEndCarbon !== undefined ? endCarbon - baselineEndCarbon : undefined,
    recoveryYear: recoveryPoint?.year,
    preTreatmentApproximated: baselineAtTreatment === undefined
  };
}
