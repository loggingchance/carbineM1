import { describe, expect, it } from "vitest";
import { localFvsConnectorUrl, runtimeModeFromStored } from "../config/runtime";

describe("runtime config", () => {
  it("defaults FVS execution to the user-local connector", () => {
    expect(localFvsConnectorUrl).toBe("http://127.0.0.1:8787");
  });

  it("ignores stored hosted/cloud runtime values", () => {
    expect(runtimeModeFromStored("hosted")).toBeUndefined();
  });
});
