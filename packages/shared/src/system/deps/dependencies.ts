import { accessSync, constants } from "node:fs";
import { delimiter, join } from "node:path";

/**
 * Executable name candidates for a logical command (cross-platform).
 */
function executableCandidates(command: string): string[] {
  if (process.platform === "win32") {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const name of [command, `${command}.exe`, `${command}.cmd`, `${command}.bat`]) {
      if (!seen.has(name)) {
        seen.add(name);
        list.push(name);
      }
    }
    return list;
  }
  return [command];
}

function isExecutableFile(filePath: string): boolean {
  try {
    if (process.platform === "win32") {
      accessSync(filePath, constants.F_OK);
      return true;
    }
    accessSync(filePath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns true if the given executable is available on PATH.
 *
 * This intentionally does not invoke a shell (no `which`, no `command -v`).
 * On Windows, `.exe` / `.cmd` / `.bat` suffixes are tried; paths use `path.join`.
 */
export function isCommandAvailable(command: string): boolean {
  if (command.length === 0) return false;

  const rawPath = process.env.PATH ?? "";
  if (rawPath.length === 0) return false;

  const pathEntries = rawPath.split(delimiter).filter(Boolean);
  for (const entry of pathEntries) {
    for (const name of executableCandidates(command)) {
      const fullPath = join(entry, name);
      if (isExecutableFile(fullPath)) return true;
    }
  }

  return false;
}

export type EnsureDependencyResult =
  | { ok: true }
  | { ok: false; error: string; installHint?: string };

export function ensureDependency(
  command: string,
  installHint?: string,
): EnsureDependencyResult {
  if (isCommandAvailable(command)) return { ok: true };

  return {
    ok: false,
    error: `Missing dependency: '${command}' is not available on PATH.`,
    installHint,
  };
}
