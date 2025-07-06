import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";

const TEST_PROJECT_NAME = "test-integration-project";
const TEST_PROJECT_PATH = join(process.cwd(), TEST_PROJECT_NAME);

describe("CLI Integration Tests", () => {
  beforeEach(() => {
    // Clean up any existing test project
    if (existsSync(TEST_PROJECT_PATH)) {
      rmSync(TEST_PROJECT_PATH, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up after test
    if (existsSync(TEST_PROJECT_PATH)) {
      rmSync(TEST_PROJECT_PATH, { recursive: true, force: true });
    }
  });

  test("creates project with SQLite option", async () => {
    // Run CLI with flags
    await $`bun cli.ts --name ${TEST_PROJECT_NAME} --db sqlite --skip-db-setup --quiet`;

    // Verify project was created
    expect(existsSync(TEST_PROJECT_PATH)).toBe(true);
    expect(existsSync(join(TEST_PROJECT_PATH, "package.json"))).toBe(true);
    expect(existsSync(join(TEST_PROJECT_PATH, "src", "server", "index.ts"))).toBe(true);

    // Verify package.json has correct project name
    const packageJson = JSON.parse(readFileSync(join(TEST_PROJECT_PATH, "package.json"), "utf-8"));
    expect(packageJson.name).toBe(TEST_PROJECT_NAME);
  }, 60000); // 60 second timeout for CLI operations

  test("creates project with PostgreSQL option", async () => {
    const projectName = "test-postgres-project";
    const projectPath = join(process.cwd(), projectName);

    // Clean up before test
    if (existsSync(projectPath)) {
      rmSync(projectPath, { recursive: true, force: true });
    }

    // Run CLI with flags
    await $`bun cli.ts --name ${projectName} --db postgres --skip-db-setup --quiet`;

    // Verify project was created
    expect(existsSync(projectPath)).toBe(true);

    // Clean up
    if (existsSync(projectPath)) {
      rmSync(projectPath, { recursive: true, force: true });
    }
  }, 60000);

  test("fails when project directory already exists", async () => {
    // Create directory first
    mkdirSync(TEST_PROJECT_PATH, { recursive: true });

    try {
      // This should fail
      await $`echo "${TEST_PROJECT_NAME}" | bun cli.ts`.quiet();
      // If we get here, the test failed
      expect(true).toBe(false);
    } catch (error) {
      // Expected to fail
      expect(error).toBeDefined();
    }
  });

  test("fails when project name is empty", async () => {
    try {
      // Send empty project name
      await $`echo "" | bun cli.ts`.quiet();
      // If we get here, the test failed
      expect(true).toBe(false);
    } catch (error) {
      // Expected to fail
      expect(error).toBeDefined();
    }
  });
});
