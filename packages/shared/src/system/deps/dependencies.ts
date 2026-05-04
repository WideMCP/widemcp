import { accessSync, constants } from "node:fs";
import { delimiter } from "node:path";

/**
 * Returns true if the given executable is available on PATH.
 *
 * This intentionally does not invoke a shell (no `which`, no `command -v`).
 */
export function isCommandAvailable(command: string): boolean {
  const rawPath = process.env.PATH ?? "";
  if (rawPath.length === 0) return false;

  const pathEntries = rawPath.split(delimiter).filter(Boolean);
  for (const entry of pathEntries) {
    const fullPath = `${entry}/${command}`;
    try {
      accessSync(fullPath, constants.X_OK);
      return true;
    } catch {
      // continue
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

