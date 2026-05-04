import { spawn } from "node:child_process";

export type RunCommandResult =
  | { ok: true; stdout: string; stderr: string; exitCode: number }
  | { ok: false; error: string; stdout: string; stderr: string; exitCode: number };

const DEFAULT_MAX_STDOUT = 10 * 1024 * 1024;
const DEFAULT_MAX_STDERR = 10 * 1024 * 1024;

/**
 * Run a command without a shell using an argument array.
 * This is a security baseline to avoid shell injection.
 *
 * stdout and stderr are capped (UTF-8 byte length) to avoid unbounded memory use.
 */
export async function runCommand(
  command: string,
  args: readonly string[],
  options?: {
    cwd?: string;
    timeoutMs?: number;
    maxStdoutBytes?: number;
    maxStderrBytes?: number;
  },
): Promise<RunCommandResult> {
  const timeoutMs = options?.timeoutMs ?? 60_000;
  const maxStdoutBytes = options?.maxStdoutBytes ?? DEFAULT_MAX_STDOUT;
  const maxStderrBytes = options?.maxStderrBytes ?? DEFAULT_MAX_STDERR;

  return await new Promise<RunCommandResult>((resolve) => {
    let settled = false;

    const child = spawn(command, [...args], {
      cwd: options?.cwd,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    const finish = (result: RunCommandResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        child.kill("SIGKILL");
      } catch {
        // ignore
      }
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({
        ok: false,
        error: `Command timed out after ${timeoutMs}ms`,
        stdout,
        stderr,
        exitCode: -1,
      });
    }, timeoutMs);

    const checkOverflow = (): void => {
      const outBytes = Buffer.byteLength(stdout, "utf8");
      const errBytes = Buffer.byteLength(stderr, "utf8");
      if (outBytes > maxStdoutBytes) {
        finish({
          ok: false,
          error: `stdout exceeded limit of ${maxStdoutBytes} bytes`,
          stdout,
          stderr,
          exitCode: -1,
        });
        return;
      }
      if (errBytes > maxStderrBytes) {
        finish({
          ok: false,
          error: `stderr exceeded limit of ${maxStderrBytes} bytes`,
          stdout,
          stderr,
          exitCode: -1,
        });
      }
    };

    child.stdout.on("data", (chunk: string | Buffer) => {
      if (settled) return;
      stdout += chunk;
      checkOverflow();
    });

    child.stderr.on("data", (chunk: string | Buffer) => {
      if (settled) return;
      stderr += chunk;
      checkOverflow();
    });

    child.on("error", (error) => {
      finish({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        stdout,
        stderr,
        exitCode: -1,
      });
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
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
