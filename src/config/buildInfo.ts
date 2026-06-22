const rawBuildId = import.meta.env.VITE_CARBINE_BUILD_ID?.trim();

export const carbineBuildId = rawBuildId ? rawBuildId.slice(0, 12) : "local-development";
