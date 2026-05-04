import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerEchoTools } from "./tools/core/echo.js";
import { registerGetMediaInfoTools } from "./tools/ytdlp/get-media-info.js";

const server = new McpServer({
  name: "widemcp-av",
  version: "0.1.0",
  description: "WideMCP Audio/Video MCP Server",
});

registerEchoTools(server);
registerGetMediaInfoTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("WideMCP AV Server running...");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});