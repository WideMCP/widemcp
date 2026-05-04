import { describe, expect, it } from "vitest";
import { ensureDependency, runCommand } from "@widemcp/shared";

describe("get_media_info integration", () => {
  it("runs yt-dlp --dump-json on a URL (skips if missing)", async () => {
    const dep = ensureDependency("yt-dlp");
    if (!dep.ok) return;

    const res = await runCommand("yt-dlp", ["--dump-json", "--no-playlist", "https://example.com"]);

    expect(res.exitCode).toBeTypeOf("number");
    expect(res.stdout).toBeTypeOf("string");
    expect(res.stderr).toBeTypeOf("string");
  }, 180_000);
});

