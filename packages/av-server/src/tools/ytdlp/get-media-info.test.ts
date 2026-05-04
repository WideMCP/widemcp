import { describe, expect, it } from "vitest";
import { __test__ } from "./get-media-info.js";

describe("get_media_info helpers", () => {
  it("parses yt-dlp JSON from stdout", () => {
    const raw = __test__.parseYtDlpJson('{"title":"t","duration":123}\n');
    const info = __test__.normalizeYtDlpInfo(raw);
    expect(info.title).toBe("t");
    expect(info.durationSeconds).toBe(123);
  });

  it("summarizes metadata into human-readable text", () => {
    const text = __test__.summarize({
      title: "Hello",
      uploader: "Me",
      durationSeconds: 1,
      extractor: "x",
      webpageUrl: "https://example.com",
      raw: {},
    });
    expect(text).toContain("Title: Hello");
    expect(text).toContain("Duration (s): 1");
  });
});

