export interface ParsedTable {
  sourceFormat: "csv" | "tsv" | "txt" | "clipboard";
  delimiter: string;
  headers: string[];
  rows: Record<string, string>[];
  parseWarnings: string[];
}

export function parseDelimitedTable(text: string, sourceFormat: ParsedTable["sourceFormat"] = "clipboard"): ParsedTable {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) {
    return { sourceFormat, delimiter: ",", headers: [], rows: [], parseWarnings: ["No table text was provided."] };
  }

  const lines = normalized.split("\n").filter((line) => line.trim());
  const delimiter = detectDelimiter(lines.slice(0, 10));
  const headers = splitDelimitedLine(lines[0], delimiter).map((header) => header.trim());
  const parseWarnings: string[] = [];
  const rows = lines.slice(1).map((line, rowIndex) => {
    const values = splitDelimitedLine(line, delimiter);
    if (values.length !== headers.length) {
      parseWarnings.push(`Row ${rowIndex + 2} has ${values.length} cells; expected ${headers.length}.`);
    }
    return Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""]));
  });

  return { sourceFormat, delimiter, headers, rows, parseWarnings };
}

function detectDelimiter(lines: string[]): string {
  const candidates = [",", "\t", ";", "|"];
  const scores = candidates.map((delimiter) => ({
    delimiter,
    score: lines.reduce((sum, line) => sum + splitDelimitedLine(line, delimiter).length, 0)
  }));
  return scores.sort((a, b) => b.score - a.score)[0]?.delimiter ?? ",";
}

export function splitDelimitedLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
}
