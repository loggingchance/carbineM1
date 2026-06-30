import { useRef, useState } from "react";
import { Upload, FileDown, FileCheck2 } from "lucide-react";
import type { TreeRecord, StandProject } from "../domain/inventorySchema";
import { inventoryColumnHelp, summarizeInventory } from "../domain/inventorySchema";
import { parseInventoryCsv, type ValidationMessage } from "../domain/validation";
import { InventoryImportWizard } from "./InventoryImportWizard";

export function InventoryUpload({
  project,
  inventory,
  onProjectChange,
  onInventoryChange
}: {
  project: StandProject;
  inventory: TreeRecord[];
  onProjectChange: (project: StandProject) => void;
  onInventoryChange: (inventory: TreeRecord[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [messages, setMessages] = useState<ValidationMessage[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const summary = summarizeInventory(inventory);
  const blankTemplateCsv = [
    "stand_id,species_code,dbh_in,trees_per_acre,plot_id,tree_id,height_ft,crown_ratio,status,notes"
  ].join("\n");

  function downloadCsv(filename: string, text: string) {
    const blob = new Blob([text.endsWith("\n") ? text : `${text}\n`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function loadSample() {
    const csv = await fetch("./sample-data/ne-simple-stand.csv").then((response) => response.text());
    const metadata = await fetch("./sample-data/ne-simple-stand.json").then((response) => response.json());
    const parsed = parseInventoryCsv(csv);
    onInventoryChange(parsed.records);
    onProjectChange({ ...project, ...metadata });
    setFileName("ne-simple-stand.csv");
    setMessages(parsed.validation.messages.length > 0 ? parsed.validation.messages : [{ severity: "info", message: "Sample inventory loaded." }]);
  }

  async function downloadSampleCsv() {
    const csv = await fetch("./sample-data/ne-simple-stand.csv").then((response) => response.text());
    downloadCsv("carbine-example-inventory.csv", csv);
  }

  async function readFile(file: File) {
    const text = await file.text();
    const parsed = parseInventoryCsv(text);
    onInventoryChange(parsed.records);
    setFileName(file.name);
    setMessages(
      parsed.validation.messages.length > 0
        ? parsed.validation.messages
        : [{ severity: "info", message: `${file.name} loaded with ${parsed.records.length} tree records.` }]
    );
  }

  return (
    <>
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Inventory</p>
          <h2>Start with a stand inventory</h2>
        </div>
        <div className="button-row">
          <button type="button" className="secondary" onClick={() => downloadCsv("carbine-blank-inventory-template.csv", blankTemplateCsv)}>
            <FileDown size={18} /> Download formatted CSV template
          </button>
          <button type="button" className="secondary" onClick={downloadSampleCsv}>
            <FileDown size={18} /> Download example CSV
          </button>
          <button type="button" className="secondary" onClick={loadSample}>
            <FileDown size={18} /> Load sample
          </button>
        </div>
      </div>

      <div className="grid two">
        <label>
          Project name
          <input value={project.projectName} onChange={(event) => onProjectChange({ ...project, projectName: event.target.value })} />
        </label>
        <label>
          Stand name
          <input value={project.standName} onChange={(event) => onProjectChange({ ...project, standName: event.target.value })} />
        </label>
        <label>
          State
          <input value={project.state} onChange={(event) => onProjectChange({ ...project, state: event.target.value.toUpperCase() })} />
        </label>
        <label>
          Area acres
          <input type="number" value={project.areaAcres} onChange={(event) => onProjectChange({ ...project, areaAcres: Number(event.target.value) })} />
        </label>
        <label>
          Inventory year
          <input type="number" value={project.inventoryYear} onChange={(event) => onProjectChange({ ...project, inventoryYear: Number(event.target.value) })} />
        </label>
        <label>
          Projection years
          <select value={project.projectionYears} onChange={(event) => onProjectChange({ ...project, projectionYears: Number(event.target.value) })}>
            {[10, 20, 30].map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>
        </label>
        <div className="field-note">
          <strong>Cycle length:</strong> {project.cycleLengthYears ?? 5} years
        </div>
        <label>
          Site index
          <input
            type="number"
            value={project.siteIndex ?? 56}
            onChange={(event) => onProjectChange({ ...project, siteIndex: Number(event.target.value) })}
          />
        </label>
        <label>
          Site index species code
          <input
            type="number"
            value={project.siteSpeciesCode ?? 13}
            onChange={(event) => onProjectChange({ ...project, siteSpeciesCode: Number(event.target.value) })}
          />
        </label>
        <label>
          FVS forest/location code
          <input
            type="number"
            value={project.forestLocationCode ?? 922}
            onChange={(event) => onProjectChange({ ...project, forestLocationCode: Number(event.target.value) })}
          />
        </label>
        <div className="field-note">
          <strong>Default SI in use:</strong> {project.siteIndex ?? 56} for species code {project.siteSpeciesCode ?? 13}. Change this before running if your stand uses a different FVS site index.
        </div>
        <div className="field-note">
          <strong>FVS location:</strong> {project.forestLocationCode ?? 922}. This feeds the STDINFO forest/location code and should match the selected regional variant.
        </div>
        <div className="field-note wide-note">
          <strong>Inventory design:</strong> expanded trees per acre. CARBINE currently expects each tree row to include its own TPA value, writes that expansion into the FVS tree file, and uses a fixed DESIGN line for the stand run. Raw prism, fixed-area plot, and other cruise designs should be converted to tree-level TPA before upload.
        </div>
      </div>
      <p className="quiet">
        CARBINE is designed for short-term forest carbon scenario exploration. Results help compare management choices and carbon trajectories; they do not replace a calibrated FVS analysis or a full silvicultural prescription.
      </p>
      <p className="quiet">
        The formatted CSV template puts the most important columns first. species_code, dbh_in, and trees_per_acre are required; stand_id is recommended but CARBINE can fill it in when missing.
      </p>

      <div
        className="dropzone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files[0];
          if (file) void readFile(file);
        }}
      >
        <Upload size={22} />
        <span>{fileName ? "Inventory file selected" : "Upload inventory CSV"}</span>
        {fileName && (
          <strong className="file-pill">
            <FileCheck2 size={16} /> {fileName}
          </strong>
        )}
        <button type="button" className="secondary" onClick={() => fileInputRef.current?.click()}>
          Choose CSV
        </button>
        <button type="button" className="secondary" onClick={() => setShowWizard((current) => !current)}>
          Import Wizard
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void readFile(file);
            event.currentTarget.value = "";
          }}
        />
      </div>

      <Summary summary={summary} />
      <ValidationList
        messages={
          messages.length > 0
            ? messages
            : [{ severity: "info", message: inventoryColumnHelp }]
        }
      />
    </section>
    {showWizard && (
      <InventoryImportWizard
        project={project}
        onInventoryReady={(records, message) => {
          onInventoryChange(records);
          setFileName("carbine-cleaned-inventory.csv");
          setMessages([{ severity: "info", message }]);
          setShowWizard(false);
        }}
      />
    )}
    </>
  );
}

function Summary({ summary }: { summary: ReturnType<typeof summarizeInventory> }) {
  return (
    <div className="summary-grid">
      <strong>{summary.recordCount}<span>records</span></strong>
      <strong>{summary.speciesCount}<span>species</span></strong>
      <strong>{summary.totalTreesPerAcre.toFixed(1)}<span>TPA</span></strong>
      <strong>{summary.basalAreaFt2PerAcre.toFixed(1)}<span>ft2/ac BA</span></strong>
    </div>
  );
}

function ValidationList({ messages }: { messages: ValidationMessage[] }) {
  return (
    <ul className="messages">
      {messages.map((message, index) => (
        <li key={`${message.message}-${index}`} className={message.severity}>{message.message}</li>
      ))}
    </ul>
  );
}
