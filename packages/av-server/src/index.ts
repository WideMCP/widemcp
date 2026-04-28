import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "widemcp-av",
  version: "0.1.0",
  description: "WideMCP Audio/Video MCP Server",
});

// server.tool() is marked deprecated in SDK 1.29.0 in favour of registerTool()
// but registerTool() is not yet available in this version.
// Monitor SDK releases and migrate when registerTool() ships.
// Track: https://github.com/modelcontextprotocol/typescript-sdk

/**
 * Echo tool — Hello World
 * Input: { message: string }
 * Output: "Echo: <message>"
 * Example: { message: "hello" } -> "Echo: hello"
 */
server.tool(
  "echo",
  "Echoes back any message you send. Used for testing the server connection.",
  { message: z.string().describe("Message to echo back") },
  async ({ message }) => ({
    content: [{ type: "text", text: `Echo: ${message}` }],
  }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("WideMCP AV Server running...");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});