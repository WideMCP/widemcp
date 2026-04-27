import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "widemcp-av",
  version: "0.1.0",
  description: "WideMCP Audio/Video MCP Server"
});

/**
 * Echo tool — Hello World
 * Input: { message: string }
 * Output: "Echo: <message>"
 * Example: { message: "hello" } -> "Echo: hello"
 */
server.tool(
  "echo",
  { message: z.string().describe("Message to echo back") },
  async ({ message }) => ({
    content: [{ type: "text", text: `Echo: ${message}` }]
  })
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