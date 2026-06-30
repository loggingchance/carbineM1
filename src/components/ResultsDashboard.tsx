import { useState, type CSSProperties } from "react";
import { BarChart3 } from "lucide-react";
import type { CarbineScenarioResults } from "../domain/carbonResults";
import {
  carbonPoolHelp,
  carbonPoolLabels,
  carbonPoolOptions,
  getCarbonPoolValue,
  type CarbonPoolKey
} from "../utils/carbonPools";
import {
  CARBINE_CARBON_DISPLAY_UNIT_LABEL,
  CARBINE_CARBON_DISPLAY_UNIT_LONG,
  CARBINE_CARBON_SOURCE_UNIT_LONG,
  displayCarbonValue,
  formatCarbonNumber,
  formatCarbonSignedDelta,
  formatCarbonSignedNumber,
  formatCarbonWithUnit
} from "../utils/carbonUnits";
import { calculateRecoveryMetrics } from "../utils/recoveryMetrics";

export function ResultsDashboard({
  results,
  onGoToRun,
  onGoToAdvanced
}: {
  results?: CarbineScenarioResults;
  onGoToRun: () => void;
  onGoToAdvanced: () => void;
}) {
  const [carbonPoolShown, setCarbonPoolShown] = useState<CarbonPoolKey>("total");

  if (!results) {
    return (
      <section className="panel empty">
        <BarChart3 size={28} />
        <h2>No results yet</h2>
        <button type="button" className="primary" onClick={onGoToRun}>Go to Run</button>
      </section>
    );
  }

  const hasParsedRows = results.series.some((series) => series.points.length > 0);
  if (!hasParsedRows) {
    return (
      <section className="panel empty">
        <BarChart3 size={28} />
        <div>
          <p className="eyebrow">Results</p>
          <h2>No parsed carbon rows yet</h2>
        </div>
        <p className="quiet">
          CARBINE reached the run step, but it did not produce parsed rows. Check Advanced for the raw FVS output and run log.
        </p>
        <div className="button-row">
          <button type="button" className="primary" onClick={onGoToAdvanced}>View Raw FVS Output</button>
          <button type="button" className="secondary" onClick={onGoToRun}>Back to Run</button>
        </div>
      </section>
    );
  }

  const maxValue = Math.max(
    1,
    ...results.series.flatMap((series) => series.points.map((point) => displayCarbonValue(getCarbonPoolValue(point, carbonPoolShown)) ?? 0))
  );
  const chartMaximum = niceChartMaximum(maxValue * 1.1);
  const chartTicks = [chartMaximum, chartMaximum * 0.75, chartMaximum * 0.5, chartMaximum * 0.25, 0];
  const summaries = results.series.map((series) => {
    const carbonPoints = series.points.filter((point) => getCarbonPoolValue(point, carbonPoolShown) !== undefined);
    const firstPoint = carbonPoints[0] ?? series.points[0];
    const finalPoint = carbonPoints[carbonPoints.length - 1] ?? series.points[series.points.length - 1];
    const removedCarbon = series.points.reduce((total, point) => total + (point.harvestedCarbonTons ?? 0), 0);
    const firstRemovalYear = series.points.find((point) => (point.harvestedCarbonTons ?? 0) > 0)?.year;
    return { series, firstPoint, finalPoint, removedCarbon, firstRemovalYear };
  });
  const baselineSeries = results.series.find((series) => series.scenarioId === "baseline")
    ?? results.series.find((series) => series.scenarioName.toLowerCase() === "no treatment")
    ?? results.series[0];
  const baselineByYear = new Map(baselineSeries.points.map((point) => [point.year, point]));
  const comparisonRows = results.series
    .filter((series) => series.scenarioId !== baselineSeries.scenarioId)
    .flatMap((series) =>
      series.points
        .map((point) => ({ series, point, baseline: baselineByYear.get(point.year) }))
        .filter(({ baseline }) => baseline !== undefined)
    );
  const recoveryRows = results.series
    .filter((series) => series.scenarioId !== baselineSeries.scenarioId)
    .map((series) => {
      const treatmentYear =
        series.points.find((point) => (point.harvestedCarbonTons ?? 0) > 0)?.year ??
        series.points[1]?.year ??
        series.points[0]?.year ??
        0;
      return {
        series,
        metrics: calculateRecoveryMetrics(baselineSeries, series, treatmentYear, carbonPoolShown)
      };
    });

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Results</p>
          <h2>{results.series.some((series) => series.points.some((point) => point.selectedPoolTotalCarbonTons !== undefined)) ? "Carbon scenario comparison" : "Official FVS summary"}</h2>
        </div>
        <strong className={results.isRealFvs ? "real-badge" : "demo-badge"}>{results.isRealFvs ? "Real FVS runtime" : "Demo output"}</strong>
      </div>
      <div className="result-controls">
        <label>
          Carbon pool shown
          <select value={carbonPoolShown} onChange={(event) => setCarbonPoolShown(event.target.value as CarbonPoolKey)}>
            {carbonPoolOptions.map((option) => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
        </label>
        <p className="quiet">{carbonPoolHelp}</p>
      </div>
      <p className="quiet"><strong>Carbon units:</strong> displayed as {CARBINE_CARBON_DISPLAY_UNIT_LONG}. FVS source output is {CARBINE_CARBON_SOURCE_UNIT_LONG}.</p>
      <div className="chart" aria-label={`${carbonPoolLabels[carbonPoolShown]} comparison chart`}>
        <div className="chart-y-label">Carbon stock ({CARBINE_CARBON_DISPLAY_UNIT_LABEL})</div>
        {results.series.map((series, seriesIndex) => {
          const seriesColor = scenarioColors[seriesIndex % scenarioColors.length];
          const finalPointIndex = series.points.length - 1;
          return (
            <div
              className="chart-series"
              key={series.scenarioId}
              style={{ borderTopColor: seriesColor, "--point-count": series.points.length } as CSSProperties}
            >
              <div className="chart-series-heading">
                <span className="chart-swatch" style={{ backgroundColor: seriesColor }} aria-hidden="true" />
                <strong>{series.scenarioName}</strong>
              </div>
              <div className="chart-plot">
                <div className="chart-plot-body">
                  {chartTicks.map((tick) => (
                    <div className="chart-gridline" key={tick} style={{ bottom: `${(tick / chartMaximum) * 100}%` }}>
                      <span>{formatNumber(tick, 0)}</span>
                    </div>
                  ))}
                  <div className="chart-bars">
                    {series.points.map((point, pointIndex) => {
                      const value = displayCarbonValue(getCarbonPoolValue(point, carbonPoolShown));
                      const barHeight = value === undefined ? 0 : (value / chartMaximum) * 100;
                      return (
                        <div className="chart-bar-column" key={`${series.scenarioId}-${point.year}`}>
                          {pointIndex === finalPointIndex && value !== undefined && (
                            <span className="chart-end-value" style={{ bottom: `${barHeight}%` }}>{formatNumber(value, 1)}</span>
                          )}
                          <span
                            className="chart-bar"
                            role="img"
                            aria-label={`${series.scenarioName}, ${point.year}: ${formatNumber(value, 1)} ${CARBINE_CARBON_DISPLAY_UNIT_LABEL}`}
                            title={`${point.year}: ${formatNumber(value, 1)} ${CARBINE_CARBON_DISPLAY_UNIT_LABEL}`}
                            style={{ height: `${barHeight}%`, backgroundColor: seriesColor }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="chart-years">
                  {series.points.map((point) => <small key={`${series.scenarioId}-${point.year}-label`}>{point.year}</small>)}
                </div>
              </div>
            </div>
          );
        })}
        <div className="chart-x-label">Projection year</div>
      </div>
      <div className="result-summary-grid" aria-label="Scenario result summary">
        {summaries.map(({ series, firstPoint, finalPoint, removedCarbon, firstRemovalYear }) => (
          <article className="result-summary-card" key={series.scenarioId}>
            <h3>{series.scenarioName}</h3>
            <dl>
              <div>
                <dt>Carbon pool shown</dt>
                <dd>{formatCarbon(getCarbonPoolValue(finalPoint, carbonPoolShown))}</dd>
              </div>
              <div>
                <dt>Live tree carbon</dt>
                <dd>{formatCarbon(finalPoint?.liveTreeCarbonTons)}</dd>
              </div>
              <div>
                <dt>Removed carbon</dt>
                <dd>{formatCarbon(removedCarbon)}{firstRemovalYear ? ` in ${firstRemovalYear}` : ""}</dd>
              </div>
              <div>
                <dt>BA change</dt>
                <dd>{formatDelta(firstPoint?.basalAreaFt2PerAcre, finalPoint?.basalAreaFt2PerAcre, 0)} ft2/ac</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      {recoveryRows.length > 0 && (
        <div className="results-section">
          <h3>Treatment and recovery summary</h3>
          <p className="quiet">
            Pre-treatment carbon is approximated from the matching no-treatment output or the prior projection step when FVS does not report separate before/after values at the treatment year.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Treatment year</th>
                  <th>Pre-treatment carbon</th>
                  <th>Post-treatment carbon</th>
                  <th>Immediate change</th>
                  <th>Lowest post-treatment carbon</th>
                  <th>End-of-run carbon</th>
                  <th>End difference vs no action</th>
                  <th>Recovery year</th>
                </tr>
              </thead>
              <tbody>
                {recoveryRows.map(({ series, metrics }) => (
                  <tr key={`${series.scenarioId}-recovery`}>
                    <td>{series.scenarioName}</td>
                    <td>{metrics.treatmentYear}</td>
                    <td>{formatCarbonNumber(metrics.preTreatmentCarbon, 1)}</td>
                    <td>{formatCarbonNumber(metrics.postTreatmentCarbon, 1)}</td>
                    <td>{formatCarbonSignedNumber(metrics.immediateChange, 1)}</td>
                    <td>{formatCarbonNumber(metrics.lowestPostTreatmentCarbon, 1)}</td>
                    <td>{formatCarbonNumber(metrics.endCarbon, 1)}</td>
                    <td>{formatCarbonSignedNumber(metrics.endDifferenceVsNoAction, 1)}</td>
                    <td>{metrics.recoveryYear ?? "Not recovered within projection period"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {comparisonRows.length > 0 && (
        <div className="results-section">
          <h3>Treatment effects vs no treatment</h3>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Year</th>
                  <th>Carbon pool shown</th>
                  <th>Change vs baseline</th>
                  <th>Live tree carbon</th>
                  <th>Change vs baseline</th>
                  <th>Removed carbon</th>
                  <th>BA change</th>
                  <th>Volume change</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(({ series, point, baseline }) => (
                  <tr key={`${series.scenarioId}-${point.year}-baseline-delta`}>
                    <td>{series.scenarioName}</td>
                    <td>{point.year}</td>
                    <td>{formatCarbonNumber(getCarbonPoolValue(point, carbonPoolShown), 1)}</td>
                    <td>{formatCarbonSignedDelta(getCarbonPoolValue(point, carbonPoolShown), getCarbonPoolValue(baseline, carbonPoolShown), 1)}</td>
                    <td>{formatCarbonNumber(point.liveTreeCarbonTons, 1)}</td>
                    <td>{formatCarbonSignedDelta(point.liveTreeCarbonTons, baseline?.liveTreeCarbonTons, 1)}</td>
                    <td>{formatCarbonNumber(point.harvestedCarbonTons, 1)}</td>
                    <td>{formatSignedDelta(point.basalAreaFt2PerAcre, baseline?.basalAreaFt2PerAcre, 0)}</td>
                    <td>{formatSignedDelta(point.totalVolumeCuFt, baseline?.totalVolumeCuFt, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Year</th>
              <th>Carbon pool shown</th>
              <th>Live tree carbon</th>
              <th>Removed carbon</th>
              <th>Total volume</th>
              <th>Merchantable volume</th>
              <th>Basal area</th>
              <th>Trees/ac</th>
            </tr>
          </thead>
          <tbody>
            {results.series.flatMap((series) =>
              series.points.map((point) => (
                <tr key={`${series.scenarioId}-${point.year}`}>
                  <td>{series.scenarioName}</td>
                  <td>{point.year}</td>
                  <td>{formatCarbonNumber(getCarbonPoolValue(point, carbonPoolShown), 1)}</td>
                  <td>{formatCarbonNumber(point.liveTreeCarbonTons, 1)}</td>
                  <td>{formatCarbonNumber(point.harvestedCarbonTons, 1)}</td>
                  <td>{formatNumber(point.totalVolumeCuFt, 0)}</td>
                  <td>{formatNumber(point.merchantableVolumeCuFt, 0)}</td>
                  <td>{formatNumber(point.basalAreaFt2PerAcre, 0)}</td>
                  <td>{formatNumber(point.treesPerAcre, 0)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatNumber(value: number | undefined, digits: number): string {
  return value === undefined ? "" : value.toFixed(digits);
}

function formatCarbon(value: number | undefined): string {
  return formatCarbonWithUnit(value);
}

function formatDelta(start: number | undefined, end: number | undefined, digits: number): string {
  if (start === undefined || end === undefined) return "";
  const delta = end - start;
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(digits)}`;
}

function formatSignedDelta(value: number | undefined, baseline: number | undefined, digits: number): string {
  if (value === undefined || baseline === undefined) return "";
  const delta = value - baseline;
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(digits)}`;
}

const scenarioColors = ["#1f5a44", "#c6a348", "#5c6f82", "#8a5a44", "#6f7f4b"];

function niceChartMaximum(value: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const rounded = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return rounded * magnitude;
}
