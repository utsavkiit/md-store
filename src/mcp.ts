import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import * as store from "./store.js";

type Shape = Record<string, z.ZodTypeAny>;

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "md-store",
    version: "1.0.0",
  });

  const writeSchema: Shape = {
    name: z.string().describe("Filename (with or without .md extension)"),
    content: z.string().describe("Markdown content to write"),
  };
  server.registerTool(
    "write_md",
    { description: "Write or overwrite a markdown file in the local store", inputSchema: writeSchema },
    async (args) => {
      const { name, content } = args as { name: string; content: string };
      const saved = await store.writeFile(name, content);
      return { content: [{ type: "text", text: `Saved as ${saved}` }] };
    }
  );

  const readSchema: Shape = {
    name: z.string().describe("Filename (with or without .md extension)"),
  };
  server.registerTool(
    "read_md",
    { description: "Read a markdown file from the local store", inputSchema: readSchema },
    async (args) => {
      const { name } = args as { name: string };
      const text = await store.readFile(name);
      return { content: [{ type: "text", text }] };
    }
  );

  server.registerTool(
    "list_md",
    { description: "List all markdown files in the local store" },
    async () => {
      const files = await store.listFiles();
      if (files.length === 0) {
        return { content: [{ type: "text", text: "No files stored yet." }] };
      }
      const lines = files.map((f) => `${f.name} — ${f.size} bytes — ${f.modified}`);
      return { content: [{ type: "text", text: lines.join("\n") }] };
    }
  );

  const deleteSchema: Shape = {
    name: z.string().describe("Filename (with or without .md extension)"),
  };
  server.registerTool(
    "delete_md",
    { description: "Delete a markdown file from the local store", inputSchema: deleteSchema },
    async (args) => {
      const { name } = args as { name: string };
      await store.deleteFile(name);
      return { content: [{ type: "text", text: `Deleted ${name}` }] };
    }
  );

  return server;
}
