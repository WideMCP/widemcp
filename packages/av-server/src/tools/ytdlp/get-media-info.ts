import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ensureDependency, runCommand } from "@widemcp/shared";

const getMediaInfoInputSchema = {
  url: z.string().url().describe("Media URL to inspect (video or audio page URL)"),
  noPlaylist: z
    .boolean()
    .optional()
    .describe("If true, avoid expanding playlists (recommended). Defaults to true."),
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

function parseYtDlpJson(stdout: string): unknown {
  const trimmed = stdout.trim();
  if (trimmed.length === 0) throw new Error("yt-dlp returned empty output");

  const lastLine = trimmed.split("\n").reverse().find((l) => l.trim().length > 0);
  if (!lastLine) throw new Error("yt-dlp output could not be parsed");

  return JSON.parse(lastLine);
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

export function registerGetMediaInfoTools(server: McpServer): void {
  server.tool(
    "get_media_info",
    "Returns basic metadata for a media URL using yt-dlp (title, duration, uploader, extractor).",
    getMediaInfoInputSchema,
    async (input: GetMediaInfoInput) => {
      try {
        const dep = ensureDependency("yt-dlp", "brew install yt-dlp");
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

        const result = await runCommand("yt-dlp", args, { timeoutMs: 120_000 });
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

        return {
          content: [
            { type: "text" as const, text: summarize(info) },
            {
              type: "text" as const,
              text: `\nRaw JSON:\n${JSON.stringify(info.raw, null, 2)}`,
            },
          ],
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
};

