import { describe, expect, it } from "vitest";
import { ensureDependency, runCommand } from "@widemcp/shared";

/** Short public clip; requires outbound network (may fail if YouTube blocks the runner). */
const YT_DLP_TEST_VIDEO = "https://www.youtube.com/watch?v=jNQXAC9IVRw";

describe("get_media_info integration", () => {
  it("runs yt-dlp --dump-json successfully when yt-dlp is installed", async () => {
    const dep = ensureDependency("yt-dlp");
    if (!dep.ok) {
      // Local dev without yt-dlp — skip (CI installs yt-dlp before tests).
      return;
    }

    const res = await runCommand(
      "yt-dlp",
      ["--dump-json", "--no-playlist", YT_DLP_TEST_VIDEO],
      {
        timeoutMs: 180_000,
        maxStdoutBytes: 20 * 1024 * 1024,
        maxStderrBytes: 20 * 1024 * 1024,
      },
    );

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.stdout).toContain('"title"');
      expect(res.stdout).toContain("_type");
    }
  }, 180_000);
});
