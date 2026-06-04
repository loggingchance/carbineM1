import { spawnSync } from "node:child_process";

const result = spawnSync("node", ["scripts/build-fvs-all-native.mjs"], {
  env: { ...process.env, FVS_VARIANTS: "FVSne" },
  encoding: "utf8",
  stdio: "inherit"
});

process.exit(result.status ?? 1);
