import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { resolve, relative, isAbsolute } from "node:path";
import { bytes, digest, type Source } from "./task-state.js";
export function projectSnapshot(cwd: string) {
  const git = (args: string[]) =>
    execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      timeout: 3000,
      maxBuffer: 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  let revision = "unversioned",
    paths: string[];
  try {
    paths = git(["ls-files", "-co", "--exclude-standard", "-z"])
      .split("\0")
      .filter(Boolean);
    try {
      revision = git(["rev-parse", "HEAD"]).trim();
    } catch {
      revision = "unborn";
    }
  } catch {
    paths = readdirSync(cwd);
  }
  paths = [...new Set(paths)].sort();
  if (paths.length > 1024)
    throw new Error("Project inventory exceeds 1024-path budget");
  let total = 0;
  const records: string[] = [];
  const sources: Source[] = [];
  for (const path of paths) {
    const absolute = resolve(cwd, path),
      rel = relative(cwd, absolute);
    if (rel.startsWith("..") || isAbsolute(rel))
      throw new Error("Project path outside workspace");
    let stat;
    try {
      stat = lstatSync(absolute);
    } catch {
      records.push(`${path}:missing`);
      continue;
    }
    if (stat.isSymbolicLink()) {
      records.push(`${path}:symlink:unverified`);
      continue;
    }
    if (!stat.isFile()) continue;
    total += stat.size;
    if (total > 8 * 1024 * 1024)
      throw new Error("Project snapshot exceeds 8 MiB read budget");
    const data = readFileSync(absolute),
      hash = digest(data.toString("base64"));
    records.push(`${path}:${hash}`);
    // Only bounded text is admitted; binaries and large files remain discoverable by exact path/hash.
    const text =
      `Path: ${path}\nRevision: ${revision}\nSHA256(base64): ${hash}\n` +
      (data.length <= 8192 && !data.includes(0)
        ? data.toString("utf8")
        : "[Content omitted; read original before relying on it]");
    sources.push({
      id: `project:${path}`,
      role: "project-observation",
      text,
      hash: digest(text),
      timestamp: new Date(stat.mtimeMs).toISOString(),
    });
  }
  if (bytes(sources) > 32768)
    throw new Error("Current project evidence exceeds 32 KiB budget");
  return {
    revision,
    fingerprint: digest(JSON.stringify({ revision, records })),
    sources,
    observedAt: new Date().toISOString(),
    verification:
      "Read-only snapshot; historical test passes are not verification of the current checkout. No tests or side effects executed.",
  };
}
