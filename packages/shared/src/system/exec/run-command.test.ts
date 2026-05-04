import { describe, expect, it } from "vitest";
import { runCommand } from "./run-command.js";

describe("runCommand", () => {
  it("returns ok when the child exits 0", async () => {
    const res = await runCommand(process.execPath, ["-e", "console.log('hi')"], {
      timeoutMs: 5000,
      maxStdoutBytes: 1024,
      maxStderrBytes: 1024,
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.stdout.trim()).toBe("hi");
      expect(res.exitCode).toBe(0);
    }
  });

  it("fails when stdout exceeds maxStdoutBytes", async () => {
    const res = await runCommand(
      process.execPath,
      ["-e", "console.log('x'.repeat(500))"],
      {
        timeoutMs: 5000,
        maxStdoutBytes: 100,
        maxStderrBytes: 1024,
      },
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain("stdout exceeded limit");
    }
  });
});
