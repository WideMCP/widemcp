import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Echo tool — Hello World
 * Input: { message: string }
 * Output: "Echo: <message>"
 * Example: { message: "hello" } -> "Echo: hello"
 */
export function registerEchoTools(server: McpServer): void {
  server.tool(
    "echo",
    "Echoes back any message you send. Used for testing the server connection.",
    { message: z.string().describe("Message to echo back") },
    async ({ message }) => ({
      content: [{ type: "text", text: `Echo: ${message}` }],
    }),
  );
}

