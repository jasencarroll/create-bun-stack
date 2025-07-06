import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { copyTemplateDirectory, getExcludePatterns } from "../../utils/template";

const TEST_PROJECT_NAME = "test-bun-stack-project";
const TEST_PROJECT_PATH = join(process.cwd(), TEST_PROJECT_NAME);

describe("CLI Generator", () => {
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

  test("copies .gitignore file from template", async () => {
    // This test verifies that .gitignore is properly copied
    const templateDir = join(process.cwd(), "templates", "default");
    const templateVariables = {
      projectName: TEST_PROJECT_NAME,
      dbProvider: "auto",
    };

    await copyTemplateDirectory(
      templateDir,
      TEST_PROJECT_PATH,
      templateVariables,
      getExcludePatterns()
    );

    // Check if .gitignore was copied
    const gitignorePath = join(TEST_PROJECT_PATH, ".gitignore");
    expect(existsSync(gitignorePath)).toBe(true);

    // Verify content
    const gitignoreContent = readFileSync(gitignorePath, "utf-8");
    expect(gitignoreContent).toContain("node_modules");
    expect(gitignoreContent).toContain(".env");
    expect(gitignoreContent).toContain("*.db");
  });

  test("copies CLAUDE.md from template", async () => {
    // This test verifies that CLAUDE.md is properly copied
    const templateDir = join(process.cwd(), "templates", "default");
    const templateVariables = {
      projectName: TEST_PROJECT_NAME,
      dbProvider: "auto",
    };

    await copyTemplateDirectory(
      templateDir,
      TEST_PROJECT_PATH,
      templateVariables,
      getExcludePatterns()
    );

    // Check that CLAUDE.md was copied
    const claudeMdPath = join(TEST_PROJECT_PATH, "CLAUDE.md");
    expect(existsSync(claudeMdPath)).toBe(true);

    // Verify it contains Bun-specific instructions
    const claudeMdContent = readFileSync(claudeMdPath, "utf-8");
    expect(claudeMdContent).toContain("create-bun-stack is a Rails-inspired fullstack application generator for Bun");
  });

  test("creates project with all expected files", async () => {
    // Copy template to test directory
    const templateDir = join(process.cwd(), "templates", "default");
    const templateVariables = {
      projectName: TEST_PROJECT_NAME,
      dbProvider: "auto",
    };

    await copyTemplateDirectory(
      templateDir,
      TEST_PROJECT_PATH,
      templateVariables,
      getExcludePatterns()
    );

    // Check essential files exist
    expect(existsSync(join(TEST_PROJECT_PATH, "package.json"))).toBe(true);
    expect(existsSync(join(TEST_PROJECT_PATH, "tsconfig.json"))).toBe(true);
    expect(existsSync(join(TEST_PROJECT_PATH, "README.md"))).toBe(true);
    expect(existsSync(join(TEST_PROJECT_PATH, "src", "server", "index.ts"))).toBe(true);
    expect(existsSync(join(TEST_PROJECT_PATH, "src", "app", "main.tsx"))).toBe(true);
  });

  test("excludes patterns properly", () => {
    const excludePatterns = getExcludePatterns();

    // These should be excluded
    expect(excludePatterns).toContain("node_modules");
    expect(excludePatterns).toContain("bun.lock");
    expect(excludePatterns).toContain(".db");
    expect(excludePatterns).toContain("dist");
    expect(excludePatterns).toContain("build");

    // These should NOT be excluded (we want them copied)
    expect(excludePatterns).not.toContain(".gitignore");
    expect(excludePatterns).not.toContain("CLAUDE.md");
  });
});
