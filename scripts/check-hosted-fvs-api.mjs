const apiUrl = (process.argv[2] ?? process.env.VITE_CARBINE_FVS_API_URL ?? process.env.CARBINE_FVS_API_URL ?? "").replace(/\/+$/, "");

if (!apiUrl) {
  console.error("Provide the hosted API URL, for example:");
  console.error("npm.cmd run hosted:health -- https://carbine-api.example.com");
  process.exit(1);
}

try {
  const response = await fetch(`${apiUrl}/health`);
  const text = await response.text();
  let health;
  try {
    health = JSON.parse(text);
  } catch {
    throw new Error(`Health response was not JSON: ${text.slice(0, 500)}`);
  }

  const variants = Array.isArray(health.variants) ? health.variants : [];
  console.log(`CARBINE hosted FVS API: ${apiUrl}`);
  console.log(`Reachable: ${response.ok ? "yes" : "no"}`);
  console.log(`Ready: ${health.ok ? "yes" : "no"}`);
  console.log(`Variants: ${variants.length > 0 ? variants.join(", ") : "none reported"}`);
  if (health.error) console.log(`Error: ${health.error}`);

  process.exit(response.ok && health.ok ? 0 : 1);
} catch (error) {
  console.error(`CARBINE hosted FVS API is not reachable: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
