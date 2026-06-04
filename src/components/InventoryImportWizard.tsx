import { FileDown, FileUp, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { StandProject, TreeRecord } from "../domain/inventorySchema";
import { detectFieldMappings, suggestionsToMappings, type ConfirmedMappings } from "../lib/import/detectFields";
import { requiredImportFields, standardInventoryFields, type StandardInventoryField } from "../lib/import/fieldSynonyms";
import { exportCarbineCsv, exportImportAudit, normalizeImportRows, type UnitSettings } from "../lib/import/importWizard";
import { parseDelimitedTable, type ParsedTable } from "../lib/import/parseDelimited";

const defaultUnits: UnitSettings = {
  dbh: "in",
  height: "ft",
  crownRatio: "decimal",
  blankStatusAsLive: true
};

export function InventoryImportWizard({
  project,
  onInventoryReady
}: {
  project: StandProject;
  onInventoryReady: (records: TreeRecord[], message: string) => void;
}) {
  const [parsed, setParsed] = useState<ParsedTable | undefined>();
  const [sourceName, setSourceName] = useState("pasted table");
  const [mappings, setMappings] = useState<ConfirmedMappings>({});
  const [units, setUnits] = useState<UnitSettings>(defaultUnits);
  const normalized = useMemo(
    () => (parsed ? normalizeImportRows(parsed, mappings, units, project.standName || project.projectName) : undefined),
    [parsed, mappings, units, project.projectName, project.standName]
  );
  const cleanedCsv = normalized ? exportCarbineCsv(normalized.csvRows) : "";
  const auditJson = parsed && normalized ? exportImportAudit(parsed, mappings, units, normalized) : "";

  async function loadFile(file: File) {
    const text = await file.text();
    const sourceFormat = file.name.toLowerCase().endsWith(".tsv") ? "tsv" : file.name.toLowerCase().endsWith(".txt") ? "txt" : "csv";
    loadText(text, file.name, sourceFormat);
  }

  function loadText(text: string, name = "pasted table", sourceFormat: ParsedTable["sourceFormat"] = "clipboard") {
    const nextParsed = parseDelimitedTable(text, sourceFormat);
    setParsed(nextParsed);
    setSourceName(name);
    setMappings(suggestionsToMappings(detectFieldMappings(nextParsed.headers)));
  }

  function updateMapping(field: StandardInventoryField, sourceField: string) {
    setMappings((current) => ({ ...current, [field]: sourceField || undefined }));
  }

  function download(name: string, body: string, type: string) {
    const blob = new Blob([body], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="panel import-wizard">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Import Wizard</p>
          <h2>Turn field data into a model-ready inventory CSV</h2>
        </div>
        <strong className="real-badge">Local browser import</strong>
      </div>

      <div className="import-steps">
        <span>Upload</span>
        <span>Preview</span>
        <span>Map Fields</span>
        <span>Units</span>
        <span>Validate</span>
        <span>Export</span>
      </div>

      <div className="grid two">
        <label className="dropzone compact-dropzone">
          <FileUp size={22} />
          Upload CSV, TSV, or TXT
          <input
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void loadFile(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
        <label>
          Paste rows from Excel or a field system
          <textarea
            rows={5}
            placeholder={"SPP\\tDIA\\tTPA\\tHT\\nSM\\t12.4\\t6.5\\t68"}
            onBlur={(event) => {
              if (event.currentTarget.value.trim()) loadText(event.currentTarget.value);
            }}
          />
        </label>
      </div>

      {parsed && (
        <>
          <div className="import-summary">
            <strong>{sourceName}<span>source</span></strong>
            <strong>{parsed.rows.length}<span>rows</span></strong>
            <strong>{parsed.headers.length}<span>columns</span></strong>
            <strong>{parsed.delimiter === "\t" ? "tab" : parsed.delimiter}<span>delimiter</span></strong>
          </div>

          <h3>Preview</h3>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>{parsed.headers.map((header) => <th key={header}>{header}</th>)}</tr>
              </thead>
              <tbody>
                {parsed.rows.slice(0, 8).map((row, index) => (
                  <tr key={index}>
                    {parsed.headers.map((header) => <td key={header}>{row[header]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>Map Fields</h3>
          <div className="mapping-grid">
            {standardInventoryFields.map((field) => (
              <label key={field}>
                {field} {requiredImportFields.includes(field) && <span className="status-pill required">Required</span>}
                <select value={mappings[field] ?? ""} onChange={(event) => updateMapping(field, event.target.value)}>
                  <option value="">Not mapped</option>
                  {parsed.headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <h3>Confirm Units</h3>
          <div className="grid two">
            <label>
              DBH unit
              <select value={units.dbh} onChange={(event) => setUnits((current) => ({ ...current, dbh: event.target.value as UnitSettings["dbh"] }))}>
                <option value="in">inches</option>
                <option value="cm">centimeters</option>
              </select>
            </label>
            <label>
              Height unit
              <select value={units.height} onChange={(event) => setUnits((current) => ({ ...current, height: event.target.value as UnitSettings["height"] }))}>
                <option value="ft">feet</option>
                <option value="m">meters</option>
              </select>
            </label>
            <label>
              Crown ratio unit
              <select value={units.crownRatio} onChange={(event) => setUnits((current) => ({ ...current, crownRatio: event.target.value as UnitSettings["crownRatio"] }))}>
                <option value="decimal">decimal, 0 to 1</option>
                <option value="percent">percent, 1 to 100</option>
              </select>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={units.blankStatusAsLive}
                onChange={(event) => setUnits((current) => ({ ...current, blankStatusAsLive: event.target.checked }))}
              />
              Treat blank status values as live
            </label>
          </div>

          {normalized && (
            <>
              <h3>Validate and Export</h3>
              <div className="import-summary">
                <strong>{normalized.summary.acceptedRows}<span>accepted</span></strong>
                <strong>{normalized.summary.excludedRows}<span>excluded</span></strong>
                <strong>{normalized.summary.totalTpa.toFixed(1)}<span>TPA</span></strong>
                <strong>{normalized.summary.basalAreaSqftPerAc.toFixed(1)}<span>ft2/ac BA</span></strong>
              </div>
              <ul className="messages">
                {[...normalized.errors.map((message) => ({ severity: "error", message })), ...normalized.warnings.slice(0, 8).map((message) => ({ severity: "warning", message }))].map((item, index) => (
                  <li key={`${item.message}-${index}`} className={item.severity}>{item.message}</li>
                ))}
                {normalized.errors.length === 0 && normalized.warnings.length === 0 && <li className="info">No import errors or warnings.</li>}
              </ul>
              <div className="sticky-actions">
                <button
                  type="button"
                  className="primary"
                  disabled={normalized.errors.length > 0 || normalized.rows.length === 0}
                  onClick={() => onInventoryReady(normalized.rows, `Import wizard loaded ${normalized.rows.length} cleaned tree records.`)}
                >
                  <Wand2 size={18} /> Load cleaned inventory
                </button>
                <button type="button" className="secondary" disabled={!cleanedCsv} onClick={() => download("carbine-cleaned-inventory.csv", cleanedCsv, "text/csv")}>
                  <FileDown size={18} /> Clean CSV
                </button>
                <button type="button" className="secondary" disabled={!auditJson} onClick={() => download("carbine-import-audit.json", auditJson, "application/json")}>
                  <FileDown size={18} /> Audit JSON
                </button>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
