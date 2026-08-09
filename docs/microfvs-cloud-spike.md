# MicroFVS Cloud Spike

CARBINE should keep `Local FVS` as the preferred path for regular users because it moves compute cost to the user's own machine. MicroFVS is still valuable, but it fits best as the next Carbine Cloud FVS backend rather than as a replacement for the local connector.

## What MicroFVS Provides

The Vibrant Planet Open Science `microfvs` project exposes FVS through a FastAPI service. The public contract includes:

- `GET /healthcheck`
- `GET /version`
- `GET /template`
- `POST /keyfile`
- `POST /run`
- `GET /treatments`
- `GET /openapi.json`

The `POST /run` endpoint accepts structured `stand_init`, `tree_init`, template, treatment, disturbance, and stand-stock parameters. It returns a structured FVS result with the raw outfile and scraped database output tables.

That is better for a cloud service than CARBINE's current raw-file bridge because CARBINE could eventually consume standardized JSON instead of parsing only text output.

## Why It Is Not Drop-In

CARBINE's current connector and hosted API contract is:

```text
GET /health
POST /run
```

The CARBINE `/run` payload sends already-rendered FVS keyword and tree files:

```json
{
  "variant": "NE",
  "scenarioId": "baseline",
  "keywordFile": "FVS keyword text",
  "treeFile": "FVS tree data text"
}
```

MicroFVS expects typed stand and tree records instead. It can generate keyfiles from templates, but CARBINE needs a translation layer before MicroFVS can run the same scenarios.

## Recommended Architecture

Keep three runtime choices:

1. `Local FVS`: the user's installed USDA FVS plus the Carbine FVS Connector.
2. `Carbine Cloud FVS`: a hosted backend retained as fallback.
3. `Demo`: no FVS runtime, used only for testing the interface.

For the next cloud backend iteration, put a CARBINE compatibility adapter in front of MicroFVS:

```text
CARBINE browser
      |
      v
CARBINE Cloud compatibility API
      |
      v
MicroFVS FastAPI service
      |
      v
Official FVS executables
```

The compatibility API should expose CARBINE's existing `/health` and `/run` contract so the frontend does not need another runtime mode. Internally it should:

- Map CARBINE `CarbineRunRequest` inventory rows to MicroFVS `stand_init` and `tree_init`.
- Map CARBINE treatment scenarios to MicroFVS treatment/disturbance inputs or custom keyfile template sections.
- Run MicroFVS `POST /run`.
- Convert the MicroFVS result to CARBINE's existing raw-output shape while CARBINE still uses its parser.
- Later, convert MicroFVS scraped tables directly to `CarbonResultSeries` and reduce text parsing.

The first CARBINE-side mapper is in `src/fvs/microfvsMapper.ts`. It intentionally supports baseline payload generation only and fails closed for treatment scenarios until those controls are mapped and validated against MicroFVS output.

## fvs2py Position

`fvs2py` is useful for a Python-native backend that calls FVS shared libraries directly. It is not a browser/local-user workflow by itself. Treat it as a future backend engine candidate if MicroFVS is too restrictive or if CARBINE needs deeper in-memory control than MicroFVS exposes.

## Probe Tool

Use this to verify a running MicroFVS service:

```text
npm.cmd run microfvs:probe -- http://127.0.0.1:8080/microfvs
```

The probe checks health, version, template, treatment list, and OpenAPI metadata. It intentionally fails fast when the endpoint is not reachable so deployment checks do not silently pass against the wrong service.

## Primary Sources

- MicroFVS: https://github.com/Vibrant-Planet-Open-Science/microfvs
- fvs2py: https://github.com/Vibrant-Planet-Open-Science/fvs2py
- USDA FVS Complete Package: https://www.fs.usda.gov/fvs/software/complete.php
