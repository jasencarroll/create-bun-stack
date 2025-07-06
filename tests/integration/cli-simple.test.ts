import { afterEach, describe, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

describe("CLI Simple Integration", () => {
  const testProjectName = "test-simple-project";
  const testProjectPath = join(process.cwd(), testProjectName);

  afterEach(() => {
    // Clean up
    if (existsSync(testProjectPath)) {
      rmSync(testProjectPath, { recursive: true, force: true });
    }
  });

  test("CLI runs and shows welcome message", (done) => {
    const child = spawn("bun", ["cli.ts"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let output = "";

    child.stdout.on("data", (data) => {
      output += data.toString();

      if (output.includes("Welcome to Create Bun Stack!")) {
        child.kill();
        expect(output).toContain("Welcome to Create Bun Stack!");
        expect(output).toContain("Using Bun");
        done();
      }
    });

    child.on("error", (err) => {
      done(err);
    });

    // Send empty input to trigger error
    child.stdin.write("\n");
    child.stdin.end();
  }, 10000);
});
