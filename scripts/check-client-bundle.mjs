import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const staticDirectory = join(process.cwd(), ".next", "static");
const entries = await readdir(staticDirectory, { recursive: true, withFileTypes: true });
const files = entries.filter((entry) => entry.isFile() && /\.(js|map|json)$/.test(entry.name));

for (const entry of files) {
  const content = await readFile(join(entry.parentPath, entry.name), "utf8");
  if (content.includes("LAW_API_OC")) {
    throw new Error(`Server-only environment variable name leaked into client artifact: ${entry.name}`);
  }
}

process.stdout.write(`Checked ${files.length} client artifact(s); no LAW_API_OC reference found.\n`);
