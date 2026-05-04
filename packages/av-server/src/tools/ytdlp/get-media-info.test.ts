import { describe, expect, it } from "vitest";
import { __test__ } from "./get-media-info.js";

describe("get_media_info helpers", () => {
  it("parses yt-dlp JSON from stdout", () => {
    const raw = __test__.parseYtDlpJson('{"title":"t","duration":123}\n');
    const info = __test__.normalizeYtDlpInfo(raw);
    expect(info.title).toBe("t");
    expect(info.durationSeconds).toBe(123);
  });

  it("parses JSON when yt-dlp prints noise after the object line", () => {
    const stdout = 'progress noise\n{"title":"ok","duration":2}\ntrailing non-json\n';
    const raw = __test__.parseYtDlpJson(stdout);
    const info = __test__.normalizeYtDlpInfo(raw);
    expect(info.title).toBe("ok");
    expect(info.durationSeconds).toBe(2);
  });

  it("parses JSON when the last line is not JSON but an earlier line is", () => {
    const stdout = '{"title":"from-middle","duration":3}\n[download] done\n';
    const raw = __test__.parseYtDlpJson(stdout);
    expect((raw as { title?: string }).title).toBe("from-middle");
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

  it("formatRawJsonAppend omits raw by default message", () => {
    const text = __test__.formatRawJsonAppend({ title: "t", raw: { a: 1 } }, false);
    expect(text).toContain("Raw JSON omitted");
    expect(text).not.toContain('"a"');
  });

  it("formatRawJsonAppend includes truncated JSON when requested", () => {
    const big = { x: "y".repeat(300_000) };
    const text = __test__.formatRawJsonAppend({ title: "t", raw: big }, true);
    expect(text).toContain("Raw JSON:");
    expect(text).toContain("truncated");
  });
});
