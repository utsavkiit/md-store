import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./mcp.js";
import { createHttpServer, PORT } from "./http.js";

const mode = process.argv[2];

if (mode === "--mcp") {
  // Stdio mode for Claude Code / MCP clients
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  server.connect(transport).then(() => {
    process.stderr.write("md-store MCP server running (stdio)\n");
  });
} else {
  // HTTP + MCP-over-SSE mode (default)
  const app = createHttpServer();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`md-store HTTP server running at http://localhost:${PORT}`);
    console.log(`Web viewer: http://localhost:${PORT}`);
    console.log(`REST API:   http://localhost:${PORT}/files`);
  });
}
