import { describe, expect, it } from "vitest";
import { ensureDependency, runCommand } from "@widemcp/shared";

/** Short public clip; requires outbound network. Often blocked from GitHub Actions IPs. */
const YT_DLP_TEST_VIDEO = "https://www.youtube.com/watch?v=jNQXAC9IVRw";

describe("get_media_info integration", () => {
  it("reports yt-dlp --version when installed (CI-safe)", async () => {
    const dep = ensureDependency("yt-dlp");
    if (!dep.ok) return;

    const res = await runCommand("yt-dlp", ["--version"], {
      timeoutMs: 30_000,
      maxStdoutBytes: 256 * 1024,
      maxStderrBytes: 256 * 1024,
    });

    expect(res.ok).toBe(true);
    // yt-dlp often prints only a version line (e.g. "2026.03.17"), not the word "yt-dlp".
    expect(`${res.stdout}${res.stderr}`).toMatch(/\d+\.\d+/);
  });

  // YouTube frequently returns non-zero from datacenter IPs (403, login wall, geo). Skip on CI; run locally or with RUN_YTDLP_NETWORK_TEST=true.
  it.skipIf(process.env.CI === "true" && process.env.RUN_YTDLP_NETWORK_TEST !== "true")(
    "runs yt-dlp --dump-json on a public YouTube URL",
    async () => {
      const dep = ensureDependency("yt-dlp");
      if (!dep.ok) return;

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
    },
    180_000,
  );
});
