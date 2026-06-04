import { normalizeImportToken } from "./fieldSynonyms";

const statusMap: Record<string, "live" | "dead" | "cut" | "exclude"> = {
  live: "live",
  alive: "live",
  l: "live",
  a: "live",
  "1": "live",
  standing_live: "live",
  dead: "dead",
  d: "dead",
  standing_dead: "dead",
  snag: "dead",
  mortality: "dead",
  cut: "cut",
  harvested: "cut",
  remove: "cut",
  removed: "cut",
  marked_cut: "cut",
  exclude: "exclude",
  non_tree: "exclude",
  shrub: "exclude",
  invalid: "exclude",
  x: "exclude"
};

export function mapStatus(value: string | undefined, defaultBlankToLive: boolean): { status: "live" | "dead" | "cut" | "exclude"; warning?: string } {
  if (!value?.trim()) {
    return defaultBlankToLive
      ? { status: "live", warning: "Blank status treated as live." }
      : { status: "exclude", warning: "Blank status excluded pending review." };
  }
  const mapped = statusMap[normalizeImportToken(value)];
  if (mapped) return { status: mapped };
  return { status: "live", warning: `Status "${value}" needs review; treated as live.` };
}
