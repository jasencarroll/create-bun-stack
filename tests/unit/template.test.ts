import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { copyTemplateFile, getExcludePatterns, processTemplate } from "../../utils/template";

describe("Template Processing", () => {
  test("processTemplate replaces single variable", () => {
    const template = "Hello {{name}}!";
    const variables = {
      projectName: "test-app",
      name: "World",
      dbProvider: "auto",
    };
    const result = processTemplate(template, variables);
    expect(result).toBe("Hello World!");
  });

  test("processTemplate replaces multiple variables", () => {
    const template = "Project: {{projectName}}, Database: {{dbProvider}}";
    const variables = { projectName: "my-app", dbProvider: "postgres" };
    const result = processTemplate(template, variables);
    expect(result).toBe("Project: my-app, Database: postgres");
  });

  test("processTemplate ignores undefined variables", () => {
    const template = "Hello {{name}}, {{undefined}}!";
    const variables = {
      projectName: "test-app",
      name: "World",
      dbProvider: "auto",
    };
    const result = processTemplate(template, variables);
    expect(result).toBe("Hello World, {{undefined}}!");
  });

  test("processTemplate handles multiple occurrences of same variable", () => {
    const template = "{{name}} says hello to {{name}}";
    const variables = {
      projectName: "test-app",
      name: "Bob",
      dbProvider: "auto",
    };
    const result = processTemplate(template, variables);
    expect(result).toBe("Bob says hello to Bob");
  });
});

describe("File Copying", () => {
  const testDir = join(process.cwd(), "test-template-dir");
  const sourceFile = join(testDir, "source.txt");
  const targetFile = join(testDir, "target.txt");

  beforeEach(() => {
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  test("copyTemplateFile processes text files with variables", async () => {
    // Create source file with template
    writeFileSync(sourceFile, "Hello {{name}}!");

    const variables = {
      name: "Test",
      projectName: "test-app",
      dbProvider: "auto",
    };
    await copyTemplateFile(sourceFile, targetFile, variables);

    const content = readFileSync(targetFile, "utf-8");
    expect(content).toBe("Hello Test!");
  });

  test("copyTemplateFile creates target directory if it doesn't exist", async () => {
    const nestedTarget = join(testDir, "nested", "deep", "target.txt");
    writeFileSync(sourceFile, "Test content");

    const variables = { projectName: "test-app", dbProvider: "auto" };
    await copyTemplateFile(sourceFile, nestedTarget, variables);

    expect(existsSync(nestedTarget)).toBe(true);
  });
});

describe("Exclude Patterns", () => {
  test("getExcludePatterns returns expected patterns", () => {
    const patterns = getExcludePatterns();

    expect(patterns).toContain("node_modules");
    expect(patterns).toContain("bun.lock");
    expect(patterns).toContain(".db");
    expect(patterns).toContain("dist");
    expect(patterns).toContain("build");
    expect(patterns).toContain(".env.local");
    expect(patterns).toContain(".DS_Store");
    expect(patterns).toContain("*.log");
  });

  test("getExcludePatterns does not include .gitignore", () => {
    const patterns = getExcludePatterns();
    expect(patterns).not.toContain(".gitignore");
  });

  test("getExcludePatterns does not include CLAUDE.md", () => {
    const patterns = getExcludePatterns();
    expect(patterns).not.toContain("CLAUDE.md");
  });
});
