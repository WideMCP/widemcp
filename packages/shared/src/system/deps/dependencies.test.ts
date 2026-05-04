import { describe, expect, it } from "vitest";
import { ensureDependency } from "./dependencies.js";

describe("ensureDependency", () => {
  it("returns ok:false for a clearly missing command", () => {
    const res = ensureDependency("widemcp__definitely_missing__command");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain("Missing dependency");
    }
  });
});

