import fs from "fs/promises";
import path from "path";
import os from "os";

const STORE_DIR = path.join(os.homedir(), "md-store", "files");

function resolvePath(name: string): string {
  const safe = path.basename(name).replace(/[^a-zA-Z0-9._\- ]/g, "_");
  const filename = safe.endsWith(".md") ? safe : `${safe}.md`;
  return path.join(STORE_DIR, filename);
}

export async function writeFile(name: string, content: string): Promise<string> {
  const filePath = resolvePath(name);
  await fs.writeFile(filePath, content, "utf8");
  return path.basename(filePath);
}

export async function readFile(name: string): Promise<string> {
  const filePath = resolvePath(name);
  return fs.readFile(filePath, "utf8");
}

export async function listFiles(): Promise<Array<{ name: string; size: number; modified: string }>> {
  const entries = await fs.readdir(STORE_DIR, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((e) => e.isFile() && e.name.endsWith(".md"))
      .map(async (e) => {
        const stat = await fs.stat(path.join(STORE_DIR, e.name));
        return {
          name: e.name,
          size: stat.size,
          modified: stat.mtime.toISOString(),
        };
      })
  );
  return files.sort((a, b) => b.modified.localeCompare(a.modified));
}

export async function deleteFile(name: string): Promise<void> {
  const filePath = resolvePath(name);
  await fs.unlink(filePath);
}

export async function fileExists(name: string): Promise<boolean> {
  try {
    await fs.access(resolvePath(name));
    return true;
  } catch {
    return false;
  }
}
