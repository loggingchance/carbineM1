const rawApiUrl = process.argv[2] ?? process.env.CARBINE_MICROFVS_API_URL ?? process.env.VITE_CARBINE_MICROFVS_API_URL ?? "";
const apiUrl = rawApiUrl.replace(/\/+$/, "");

if (!apiUrl) {
  console.error("Provide a MicroFVS API URL, for example:");
  console.error("npm.cmd run microfvs:probe -- http://127.0.0.1:8080/microfvs");
  process.exit(1);
}

const paths = ["/healthcheck", "/version", "/template", "/treatments", "/openapi.json"];
const results = [];

for (const path of paths) {
  results.push(await probe(path));
}

console.log(`MicroFVS API: ${apiUrl}`);
for (const result of results) {
  console.log(`${result.ok ? "PASS" : "FAIL"} ${result.path} - ${result.summary}`);
}

const openApi = results.find((result) => result.path === "/openapi.json");
if (openApi?.json?.paths) {
  const exposedPaths = Object.keys(openApi.json.paths);
  console.log(`Endpoints: ${exposedPaths.join(", ")}`);
}

const ready =
  results.find((result) => result.path === "/healthcheck")?.ok &&
  results.find((result) => result.path === "/openapi.json")?.ok;

process.exit(ready ? 0 : 1);

async function probe(path) {
  try {
    const response = await fetch(`${apiUrl}${path}`);
    const contentType = response.headers.get("content-type") ?? "";
    const text = await response.text();
    const json = contentType.includes("application/json") ? tryParseJson(text) : undefined;

    return {
      path,
      ok: response.ok,
      json,
      summary: summarize(response, text, json)
    };
  } catch (error) {
    return {
      path,
      ok: false,
      summary: error instanceof Error ? error.message : String(error)
    };
  }
}

function summarize(response, text, json) {
  if (!response.ok) return `HTTP ${response.status}`;
  if (json && typeof json === "object") {
    if ("status" in json) return `status=${json.status}`;
    if ("template" in json && "template_params" in json) return "default keyfile template available";
    if ("USFS Treatments" in json && Array.isArray(json["USFS Treatments"])) return `${json["USFS Treatments"].length} treatment code(s)`;
    if ("paths" in json) return `${Object.keys(json.paths).length} documented endpoint(s)`;
    return `${Object.keys(json).length} JSON field(s)`;
  }
  return text ? text.replace(/\s+/g, " ").slice(0, 120) : `HTTP ${response.status}`;
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
