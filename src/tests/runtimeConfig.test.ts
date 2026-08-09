import { describe, expect, it } from "vitest";
import { hasMicroFvsApi, localFvsConnectorUrl, microFvsApiUrl, microFvsProjectUrl } from "../config/runtime";

describe("runtime config", () => {
  it("defaults FVS execution to the user-local connector", () => {
    expect(localFvsConnectorUrl).toBe("http://127.0.0.1:8787");
  });

  it("does not invent a public MicroFVS API endpoint", () => {
    expect(microFvsApiUrl).toBe("");
    expect(hasMicroFvsApi).toBe(false);
    expect(microFvsProjectUrl).toBe("https://github.com/Vibrant-Planet-Open-Science/microfvs");
  });
});
