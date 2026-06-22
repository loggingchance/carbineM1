import type { CarbonResultPoint } from "../domain/carbonResults";

export type CarbonPoolKey =
  | "total"
  | "live_tree"
  | "standing_dead"
  | "down_dead_wood"
  | "aboveground_total"
  | "harvested";

export const carbonPoolLabels: Record<CarbonPoolKey, string> = {
  live_tree: "Live tree carbon",
  standing_dead: "Standing dead carbon",
  down_dead_wood: "Down dead wood carbon",
  aboveground_total: "Total aboveground carbon",
  harvested: "Harvested/removal carbon",
  total: "Total estimated carbon"
};

export const carbonPoolHelp =
  "A carbon pool is a category where forest carbon is stored or tracked, such as live trees, standing dead trees, down wood, or harvested material.";

export const carbonPoolOptions: Array<{ key: CarbonPoolKey; label: string }> = [
  { key: "total", label: carbonPoolLabels.total },
  { key: "live_tree", label: carbonPoolLabels.live_tree },
  { key: "standing_dead", label: carbonPoolLabels.standing_dead },
  { key: "down_dead_wood", label: carbonPoolLabels.down_dead_wood },
  { key: "aboveground_total", label: carbonPoolLabels.aboveground_total },
  { key: "harvested", label: carbonPoolLabels.harvested }
];

export function getCarbonPoolValue(point: CarbonResultPoint | undefined, pool: CarbonPoolKey): number | undefined {
  if (!point) return undefined;
  if (pool === "live_tree") return point.liveTreeCarbonTons;
  if (pool === "standing_dead") return point.standingDeadCarbonTons;
  if (pool === "down_dead_wood") return point.downDeadWoodCarbonTons;
  if (pool === "harvested") return point.harvestedCarbonTons;
  if (pool === "aboveground_total") {
    const live = point.liveTreeCarbonTons;
    const standing = point.standingDeadCarbonTons ?? 0;
    if (live === undefined) return undefined;
    return live + standing;
  }
  return point.selectedPoolTotalCarbonTons;
}
