import { describe, expect, test } from "bun:test";
import { parseArgs, validateProjectName } from "../../cli";

describe("parseArgs", () => {
  test("parses --name flag", () => {
    const opts = parseArgs(["--name", "my-app"]);
    expect(opts.name).toBe("my-app");
  });

  test("parses -n shorthand", () => {
    const opts = parseArgs(["-n", "my-app"]);
    expect(opts.name).toBe("my-app");
  });

  test("parses --db flag", () => {
    const opts = parseArgs(["--name", "x", "--db", "sqlite"]);
    expect(opts.db).toBe("sqlite");
  });

  test("parses -d shorthand", () => {
    const opts = parseArgs(["--name", "x", "-d", "postgres"]);
    expect(opts.db).toBe("postgres");
  });

  test("parses boolean flags", () => {
    const opts = parseArgs(["--skip-db-setup", "--skip-install", "--quiet"]);
    expect(opts.skipDbSetup).toBe(true);
    expect(opts.skipInstall).toBe(true);
    expect(opts.quiet).toBe(true);
  });

  test("parses -q shorthand", () => {
    const opts = parseArgs(["-q"]);
    expect(opts.quiet).toBe(true);
  });

  test("parses all flags together", () => {
    const opts = parseArgs(["-n", "my-app", "-d", "sqlite", "--skip-db-setup", "--skip-install", "-q"]);
    expect(opts.name).toBe("my-app");
    expect(opts.db).toBe("sqlite");
    expect(opts.skipDbSetup).toBe(true);
    expect(opts.skipInstall).toBe(true);
    expect(opts.quiet).toBe(true);
  });

  test("returns empty options for no args", () => {
    const opts = parseArgs([]);
    expect(opts.name).toBeUndefined();
    expect(opts.db).toBeUndefined();
    expect(opts.skipDbSetup).toBeUndefined();
    expect(opts.skipInstall).toBeUndefined();
    expect(opts.quiet).toBeUndefined();
  });
});

describe("validateProjectName", () => {
  test("accepts valid multi-char names", () => {
    expect(validateProjectName("my-app")).toBeNull();
    expect(validateProjectName("app123")).toBeNull();
    expect(validateProjectName("a1")).toBeNull();
    expect(validateProjectName("My-App")).toBeNull();
  });

  test("accepts single-character names", () => {
    expect(validateProjectName("a")).toBeNull();
    expect(validateProjectName("Z")).toBeNull();
    expect(validateProjectName("5")).toBeNull();
  });

  test("rejects empty/whitespace names", () => {
    expect(validateProjectName("")).not.toBeNull();
    expect(validateProjectName("   ")).not.toBeNull();
  });

  test("rejects names with invalid characters", () => {
    expect(validateProjectName("my_app")).not.toBeNull();
    expect(validateProjectName("my app")).not.toBeNull();
    expect(validateProjectName("my.app")).not.toBeNull();
    expect(validateProjectName("@my/app")).not.toBeNull();
  });

  test("rejects names starting or ending with hyphens", () => {
    expect(validateProjectName("-myapp")).not.toBeNull();
    expect(validateProjectName("myapp-")).not.toBeNull();
    expect(validateProjectName("-")).not.toBeNull();
  });

  test("rejects reserved names", () => {
    expect(validateProjectName("node_modules")).not.toBeNull();
    expect(validateProjectName("test")).not.toBeNull();
    expect(validateProjectName("src")).not.toBeNull();
    expect(validateProjectName("dist")).not.toBeNull();
    expect(validateProjectName("build")).not.toBeNull();
    expect(validateProjectName("public")).not.toBeNull();
    expect(validateProjectName("tests")).not.toBeNull();
  });

  test("rejects reserved names case-insensitively", () => {
    expect(validateProjectName("SRC")).not.toBeNull();
    expect(validateProjectName("Test")).not.toBeNull();
    expect(validateProjectName("BUILD")).not.toBeNull();
  });

  test("rejects single invalid characters", () => {
    expect(validateProjectName("-")).not.toBeNull();
    expect(validateProjectName(".")).not.toBeNull();
    expect(validateProjectName("@")).not.toBeNull();
  });
});
