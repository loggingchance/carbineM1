export type RuntimeMode = "hosted" | "official" | "demo";

const rawHostedFvsApiUrl = import.meta.env.VITE_CARBINE_FVS_API_URL as string | undefined;
const rawLocalFvsConnectorUrl = import.meta.env.VITE_CARBINE_LOCAL_FVS_URL as string | undefined;
const rawMicroFvsApiUrl = import.meta.env.VITE_CARBINE_MICROFVS_API_URL as string | undefined;

export const hostedFvsApiUrl = normalizeUrl(rawHostedFvsApiUrl);
export const hasHostedFvsApi = hostedFvsApiUrl.length > 0;
export const localFvsConnectorUrl = normalizeUrl(rawLocalFvsConnectorUrl) || "http://127.0.0.1:8787";
export const microFvsApiUrl = normalizeUrl(rawMicroFvsApiUrl) || "https://carbine-api.forestenterprise.org/microfvs";

export function runtimeModeFromStored(value: unknown): RuntimeMode | undefined {
  return value === "hosted" || value === "official" || value === "demo" ? value : undefined;
}

function normalizeUrl(value: string | undefined): string {
  return value?.trim().replace(/\/+$/, "") ?? "";
}
