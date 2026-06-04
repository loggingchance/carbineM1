export type RuntimeMode = "hosted" | "official" | "demo";

const rawHostedFvsApiUrl = import.meta.env.VITE_CARBINE_FVS_API_URL as string | undefined;

export const hostedFvsApiUrl = rawHostedFvsApiUrl?.trim().replace(/\/+$/, "") ?? "";
export const hasHostedFvsApi = hostedFvsApiUrl.length > 0;

export function runtimeModeFromStored(value: unknown): RuntimeMode | undefined {
  return value === "hosted" || value === "official" || value === "demo" ? value : undefined;
}
