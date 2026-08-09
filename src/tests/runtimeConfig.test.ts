import { describe, expect, it } from "vitest";
import { microFvsApiUrl } from "../config/runtime";

describe("runtime config", () => {
  it("defaults the MicroFVS service field to the CARBINE cloud path", () => {
    expect(microFvsApiUrl).toBe("https://carbine-api.forestenterprise.org/microfvs");
  });
});
