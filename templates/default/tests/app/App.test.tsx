import { describe, expect, test } from "bun:test";
import { App } from "@/app/App";
import { HomePage } from "@/app/pages/HomePage";
import { NotFoundPage } from "@/app/pages/NotFoundPage";
import { UsersPage } from "@/app/pages/UsersPage";

declare global {
  // @ts-expect-error - vi is defined in setup.ts
  var vi: unknown;
}

describe("App Component", () => {
  test("exports a valid component", () => {
    expect(typeof App).toBe("function");
    expect(App.name).toBe("App");
  });
});

describe("HomePage Component", () => {
  test("exports a valid component", () => {
    expect(typeof HomePage).toBe("function");
    expect(HomePage.name).toBe("HomePage");
  });
});

describe("UsersPage Component", () => {
  test("exports a valid component", () => {
    expect(typeof UsersPage).toBe("function");
    expect(UsersPage.name).toBe("UsersPage");
  });
});

describe("NotFoundPage Component", () => {
  test("exports a valid component", () => {
    expect(typeof NotFoundPage).toBe("function");
    expect(NotFoundPage.name).toBe("NotFoundPage");
  });
});

// Note: For comprehensive React component testing with Bun,
// consider using integration tests with the actual server
// or mocking React's render output directly.
// DOM-based testing requires external libraries which can
// cause compatibility issues with Bun's test runner.
