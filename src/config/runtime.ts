export type RuntimeMode = "official" | "demo";

const rawLocalFvsConnectorUrl = import.meta.env.VITE_CARBINE_LOCAL_FVS_URL as string | undefined;
const rawBuildId = import.meta.env.VITE_CARBINE_BUILD_ID as string | undefined;

export const localFvsConnectorUrl = normalizeUrl(rawLocalFvsConnectorUrl) || "http://127.0.0.1:8787";
export const carbineBuildLabel = rawBuildId?.trim() ? rawBuildId.trim().slice(0, 7) : "local";

export function runtimeModeFromStored(value: unknown): RuntimeMode | undefined {
  return value === "official" || value === "demo" ? value : undefined;
}

function normalizeUrl(value: string | undefined): string {
  return value?.trim().replace(/\/+$/, "") ?? "";
}
