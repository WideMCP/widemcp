import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ensureDependency, runCommand } from "@widemcp/shared";

const YT_DLP_INSTALL = "https://github.com/yt-dlp/yt-dlp#installation";

/** Max characters of stringified raw JSON when `include_raw` is true (avoids huge MCP payloads). */
const MAX_RAW_JSON_CHARS = 200_000;

const getMediaInfoInputSchema = {
  url: z
    .string()
    .url()
    .describe(
      "Media URL for yt-dlp (https audio/video pages, playlists when allowed, or file:// local paths). " +
        "Whatever you pass is forwarded to yt-dlp as-is—only use URLs you intend to read.",
    ),
  noPlaylist: z
    .boolean()
    .optional()
    .describe("If true, avoid expanding playlists (recommended). Defaults to true."),
  include_raw: z
    .boolean()
    .optional()
    .describe(
      "If true, append raw yt-dlp JSON (truncated if very large). Defaults to false to keep responses small.",
    ),
};

type GetMediaInfoInput = z.infer<z.ZodObject<typeof getMediaInfoInputSchema>>;

type GetMediaInfoResult = {
  title?: string;
  durationSeconds?: number;
  webpageUrl?: string;
  extractor?: string;
  uploader?: string;
  raw: unknown;
};

function summarize(info: GetMediaInfoResult): string {
  const lines: string[] = [];
  lines.push(`Title: ${info.title ?? "(unknown)"}`);
  lines.push(`Uploader: ${info.uploader ?? "(unknown)"}`);
  lines.push(`Duration (s): ${info.durationSeconds ?? "(unknown)"}`);
  lines.push(`Extractor: ${info.extractor ?? "(unknown)"}`);
  lines.push(`Webpage URL: ${info.webpageUrl ?? "(unknown)"}`);
  return lines.join("\n");
}

/**
 * yt-dlp may print progress or warnings on stdout before/after the JSON line.
 * Scan non-empty lines from the bottom and parse the first line that looks like JSON.
 */
function parseYtDlpJson(stdout: string): unknown {
  const lines = stdout
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) throw new Error("yt-dlp returned empty output");

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (!line.startsWith("{") && !line.startsWith("[")) continue;
    try {
      return JSON.parse(line) as unknown;
    } catch {
      continue;
    }
  }

  throw new Error("yt-dlp output could not be parsed as JSON");
}

function normalizeYtDlpInfo(raw: unknown): GetMediaInfoResult {
  const obj = raw as Record<string, unknown>;

  const duration = obj["duration"];
  const durationSeconds =
    typeof duration === "number" && Number.isFinite(duration) ? duration : undefined;

  return {
    title: typeof obj["title"] === "string" ? obj["title"] : undefined,
    uploader: typeof obj["uploader"] === "string" ? obj["uploader"] : undefined,
    extractor: typeof obj["extractor"] === "string" ? obj["extractor"] : undefined,
    webpageUrl: typeof obj["webpage_url"] === "string" ? obj["webpage_url"] : undefined,
    durationSeconds,
    raw,
  };
}

function formatRawJsonAppend(info: GetMediaInfoResult, includeRaw: boolean): string | null {
  if (!includeRaw) {
    return "\n\nRaw JSON omitted (set include_raw to true for a truncated raw dump).";
  }
  let text = JSON.stringify(info.raw, null, 2);
  if (text.length > MAX_RAW_JSON_CHARS) {
    text = `${text.slice(0, MAX_RAW_JSON_CHARS)}\n\n… truncated after ${MAX_RAW_JSON_CHARS} characters`;
  }
  return `\n\nRaw JSON:\n${text}`;
}

export function registerGetMediaInfoTools(server: McpServer): void {
  server.tool(
    "get_media_info",
    "Returns basic metadata for a media URL using yt-dlp (title, duration, uploader, extractor). " +
      "Supports remote https URLs and local file:// paths—both are passed to yt-dlp; only pass URLs you trust.",
    getMediaInfoInputSchema,
    async (input: GetMediaInfoInput) => {
      try {
        const dep = ensureDependency("yt-dlp", YT_DLP_INSTALL);
        if (!dep.ok) {
          return {
            content: [
              {
                type: "text" as const,
                text: `${dep.error}${dep.installHint ? `\nInstall: ${dep.installHint}` : ""}`,
              },
            ],
            isError: true,
          };
        }

        const noPlaylist = input.noPlaylist ?? true;
        const args = ["--dump-json", ...(noPlaylist ? ["--no-playlist"] : []), input.url];

        const result = await runCommand("yt-dlp", args, {
          timeoutMs: 120_000,
          maxStdoutBytes: 15 * 1024 * 1024,
          maxStderrBytes: 15 * 1024 * 1024,
        });
        if (!result.ok) {
          return {
            content: [
              {
                type: "text" as const,
                text: [
                  "Error: yt-dlp failed",
                  `Reason: ${result.error}`,
                  result.stderr.trim().length > 0 ? `Stderr:\n${result.stderr.trim()}` : "",
                ]
                  .filter(Boolean)
                  .join("\n\n"),
              },
            ],
            isError: true,
          };
        }

        const raw = parseYtDlpJson(result.stdout);
        const info = normalizeYtDlpInfo(raw);
        const includeRaw = input.include_raw ?? false;
        const rawAppend = formatRawJsonAppend(info, includeRaw);

        return {
          content: [{ type: "text" as const, text: summarize(info) + rawAppend }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}

export const __test__ = {
  parseYtDlpJson,
  normalizeYtDlpInfo,
  summarize,
  formatRawJsonAppend,
};
