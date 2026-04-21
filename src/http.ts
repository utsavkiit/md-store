import express, { Request, Response } from "express";
import { marked } from "marked";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "./mcp.js";
import * as store from "./store.js";

export const PORT = 3377;

export function createHttpServer(): express.Application {
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use(express.text({ type: "*/*", limit: "10mb" }));

  // List files as JSON
  app.get("/files", async (_req: Request, res: Response) => {
    const files = await store.listFiles();
    res.json(files);
  });

  // Read raw markdown
  app.get("/files/:name", async (req: Request, res: Response) => {
    try {
      const content = await store.readFile(req.params.name);
      res.type("text/plain").send(content);
    } catch {
      res.status(404).json({ error: "File not found" });
    }
  });

  // Write a file
  app.post("/files/:name", async (req: Request, res: Response) => {
    const content = typeof req.body === "string" ? req.body : "";
    const saved = await store.writeFile(req.params.name, content);
    res.status(201).json({ saved });
  });

  // Delete a file
  app.delete("/files/:name", async (req: Request, res: Response) => {
    try {
      await store.deleteFile(req.params.name);
      res.json({ deleted: req.params.name });
    } catch {
      res.status(404).json({ error: "File not found" });
    }
  });

  // MCP over HTTP — for Hermes and other HTTP MCP clients
  app.all("/mcp", async (req: Request, res: Response) => {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    const server = createMcpServer();
    await server.connect(transport);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    await transport.handleRequest(req, res, body);
  });

  // Web viewer — file list page
  app.get("/", async (_req: Request, res: Response) => {
    const files = await store.listFiles();
    const rows = files
      .map(
        (f) =>
          `<tr>
            <td><a href="/view/${encodeURIComponent(f.name)}">${f.name}</a></td>
            <td>${(f.size / 1024).toFixed(1)} KB</td>
            <td>${new Date(f.modified).toLocaleString()}</td>
          </tr>`
      )
      .join("");

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MD Store</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #222; }
    h1 { font-size: 1.5rem; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; border-bottom: 2px solid #ddd; padding: 0.5rem 0; }
    td { padding: 0.4rem 0; border-bottom: 1px solid #eee; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .empty { color: #888; margin-top: 2rem; }
  </style>
</head>
<body>
  <h1>MD Store</h1>
  ${
    files.length === 0
      ? `<p class="empty">No files yet. Write one via MCP or POST /files/:name</p>`
      : `<table>
      <thead><tr><th>File</th><th>Size</th><th>Modified</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`
  }
</body>
</html>`);
  });

  // Web viewer — rendered markdown page
  app.get("/view/:name", async (req: Request, res: Response) => {
    try {
      const content = await store.readFile(req.params.name);
      const html = await marked(content);
      res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${req.params.name}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #222; line-height: 1.6; }
    a.back { color: #0066cc; text-decoration: none; font-size: 0.9rem; }
    a.back:hover { text-decoration: underline; }
    h1,h2,h3 { margin-top: 1.5rem; }
    pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    code { background: #f5f5f5; padding: 0.1em 0.3em; border-radius: 3px; font-size: 0.9em; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 3px solid #ddd; margin: 0; padding-left: 1rem; color: #555; }
    img { max-width: 100%; }
  </style>
</head>
<body>
  <p><a class="back" href="/">← All files</a></p>
  ${html}
</body>
</html>`);
    } catch {
      res.status(404).send("File not found");
    }
  });

  return app;
}
