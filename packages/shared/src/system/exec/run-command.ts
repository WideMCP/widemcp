import { spawn } from "node:child_process";

export type RunCommandResult =
  | { ok: true; stdout: string; stderr: string; exitCode: number }
  | { ok: false; error: string; stdout: string; stderr: string; exitCode: number };

/**
 * Run a command without a shell using an argument array.
 * This is a security baseline to avoid shell injection.
 */
export async function runCommand(
  command: string,
  args: readonly string[],
  options?: { cwd?: string; timeoutMs?: number },
): Promise<RunCommandResult> {
  const timeoutMs = options?.timeoutMs ?? 60_000;

  return await new Promise<RunCommandResult>((resolve) => {
    const child = spawn(command, [...args], {
      cwd: options?.cwd,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolve({
        ok: false,
        error: `Command timed out after ${timeoutMs}ms`,
        stdout,
        stderr,
        exitCode: -1,
      });
    }, timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        stdout,
        stderr,
        exitCode: -1,
      });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      const exitCode = code ?? -1;
      if (exitCode === 0) {
        resolve({ ok: true, stdout, stderr, exitCode });
      } else {
        resolve({
          ok: false,
          error: `Command exited with code ${exitCode}`,
          stdout,
          stderr,
          exitCode,
        });
      }
    });
  });
}

