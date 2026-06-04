import { BarChart3 } from "lucide-react";
import type { CarbineScenarioResults } from "../domain/carbonResults";

export function ResultsDashboard({
  results,
  onGoToRun,
  onGoToAdvanced
}: {
  results?: CarbineScenarioResults;
  onGoToRun: () => void;
  onGoToAdvanced: () => void;
}) {
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
    ...results.series.flatMap((series) => series.points.map((point) => point.selectedPoolTotalCarbonTons ?? 0))
  );
  const summaries = results.series.map((series) => {
    const carbonPoints = series.points.filter((point) => point.selectedPoolTotalCarbonTons !== undefined);
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

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Results</p>
          <h2>{results.series.some((series) => series.points.some((point) => point.selectedPoolTotalCarbonTons !== undefined)) ? "Carbon scenario comparison" : "Official FVS summary"}</h2>
        </div>
        <strong className={results.isRealFvs ? "real-badge" : "demo-badge"}>{results.isRealFvs ? "Real FVS runtime" : "Demo output"}</strong>
      </div>
      <div className="chart" aria-label="Selected pool carbon chart">
        {results.series.map((series) => (
          <div className="chart-row" key={series.scenarioId}>
            <span>{series.scenarioName}</span>
            <div>
              {series.points.map((point) => (
                <i
                  key={`${series.scenarioId}-${point.year}`}
                  title={`${point.year}: ${point.selectedPoolTotalCarbonTons} tons C`}
                  style={{ height: `${Math.max(6, ((point.selectedPoolTotalCarbonTons ?? 0) / maxValue) * 100)}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="result-summary-grid" aria-label="Scenario result summary">
        {summaries.map(({ series, firstPoint, finalPoint, removedCarbon, firstRemovalYear }) => (
          <article className="result-summary-card" key={series.scenarioId}>
            <h3>{series.scenarioName}</h3>
            <dl>
              <div>
                <dt>Selected pool</dt>
                <dd>{formatCarbon(finalPoint?.selectedPoolTotalCarbonTons)}</dd>
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
      {comparisonRows.length > 0 && (
        <div className="results-section">
          <h3>Treatment effects vs no treatment</h3>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Year</th>
                  <th>Selected pool total</th>
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
                    <td>{formatNumber(point.selectedPoolTotalCarbonTons, 1)}</td>
                    <td>{formatSignedDelta(point.selectedPoolTotalCarbonTons, baseline?.selectedPoolTotalCarbonTons, 1)}</td>
                    <td>{formatNumber(point.liveTreeCarbonTons, 1)}</td>
                    <td>{formatSignedDelta(point.liveTreeCarbonTons, baseline?.liveTreeCarbonTons, 1)}</td>
                    <td>{formatNumber(point.harvestedCarbonTons, 1)}</td>
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
              <th>Selected pool total</th>
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
                  <td>{formatNumber(point.selectedPoolTotalCarbonTons, 1)}</td>
                  <td>{formatNumber(point.liveTreeCarbonTons, 1)}</td>
                  <td>{formatNumber(point.harvestedCarbonTons, 1)}</td>
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
  return value === undefined ? "" : `${value.toFixed(1)} tons C`;
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
