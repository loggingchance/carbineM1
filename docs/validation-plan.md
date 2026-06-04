# Validation Plan

## Inventory Validation

- Missing required columns produce errors.
- Non-numeric DBH produces an error with row context.
- Zero or negative trees per acre produces an error.
- Unusually large DBH produces a warning.
- Missing heights produce a warning when common.

## FVS File Generation

- Keyword writer output must be tested against reviewed fixtures before real execution.
- UI components must not assemble raw FVS keyword syntax.
- Scenario validation must block inverted DBH ranges and zero-removal treatment scenarios before FVS is invoked.
- Scenario validation must warn on very heavy removals and missing no-treatment baselines.

## Parser Validation

- Parser tests must use raw FVS output fixtures.
- Parsed values must be compared value by value against expected JSON.
- FVS summary rows with removals must use after-treatment residual basal area and residual volume for Results/Report comparison tables.
- Carbon rows must be parsed from official `FMIN` / `CARBREPT` stand carbon reports when present.

## Parity Validation

- Run one official or manually reviewed sample case in native FVS.
- Run the same case through CARBINE.
- Compare raw outputs where feasible and parsed carbon tables exactly.
- Surface any known difference in the report warning panel.
