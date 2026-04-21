# md-store

A local markdown file server for Mac mini. LLMs can read and write `.md` files via MCP tools or a REST API. Files are viewable in the browser and accessible over Tailscale from any device.

## Features

- **MCP server** — `write_md`, `read_md`, `list_md`, `delete_md` tools for Claude Code, Hermes, and any MCP client
- **REST API** — curl-friendly HTTP endpoints at `/files`
- **Web viewer** — rendered markdown at `http://localhost:3377`
- **Network access** — binds to `0.0.0.0`, accessible over local WiFi or Tailscale
- **Auto-start** — runs persistently via launchd on Mac mini

## Setup

```bash
npm install
npm run build
```

### Run manually

```bash
# HTTP server + web viewer (default)
node dist/index.js

# MCP stdio mode (for Claude Code)
node dist/index.js --mcp
```

### Run persistently (launchd)

```bash
cp com.utsav.md-store.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.utsav.md-store.plist
```

Files are stored in `~/md-store/files/`.

## MCP Integration

### Claude Code

Add to `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "md-store": {
      "type": "stdio",
      "command": "/opt/homebrew/bin/node",
      "args": ["/path/to/md-store/dist/index.js", "--mcp"]
    }
  }
}
```

### Hermes (Docker)

Add to `/opt/data/config.yaml` inside the container:

```yaml
mcp_servers:
  md-store:
    url: http://host.docker.internal:3377/mcp
```

## REST API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/files` | List all files (JSON) |
| `GET` | `/files/:name` | Read raw markdown |
| `POST` | `/files/:name` | Write a file (body = markdown) |
| `DELETE` | `/files/:name` | Delete a file |
| `GET` | `/` | Web viewer — file list |
| `GET` | `/view/:name` | Web viewer — rendered markdown |
| `POST` | `/mcp` | MCP over StreamableHTTP |

### Examples

```bash
# Write a file
curl -X POST http://localhost:3377/files/notes -d "# My Notes"

# Read it back
curl http://localhost:3377/files/notes.md

# List all files
curl http://localhost:3377/files
```

## Phone Access

With [Tailscale](https://tailscale.com) installed on both Mac mini and iPhone:

```
http://<tailscale-ip>:3377
```

Run `tailscale ip -4` on the Mac mini to get your Tailscale IP.
