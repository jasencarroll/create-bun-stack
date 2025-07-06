import { afterAll, afterEach, beforeAll } from "bun:test";
import type { Subprocess } from "bun";
// Test setup and globals
import { $ } from "bun";

const { spawn } = Bun;

// Test server management
let testServer: Subprocess | null = null;
const TEST_PORT = 3001;

// Check if we should test PostgreSQL
let TEST_POSTGRES = process.env.TEST_POSTGRES === "true";
const POSTGRES_URL = "postgresql://postgres@localhost:5432/bun_stack_test";

// Start test server before all tests
beforeAll(async () => {
  console.log("🚀 Starting test server...");

  if (TEST_POSTGRES) {
    console.log("📘 Testing with PostgreSQL");
    // Check if PostgreSQL is actually running
    try {
      await $`pg_isready -h localhost -p 5432`.quiet();
      // Clean up PostgreSQL test database
      await $`psql -U postgres -d bun_stack_test -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`.quiet();
    } catch (_error) {
      console.warn("⚠️  PostgreSQL not available, falling back to SQLite");
      // Fall back to SQLite
      TEST_POSTGRES = false;
      // Clean up test database
      await $`rm -f ./db/test.db ./db/test.db-journal`.quiet();
    }
  } else {
    console.log("📗 Testing with SQLite");
    // Clean up test database
    try {
      await $`rm -f ./db/test.db ./db/test.db-journal`.quiet();
    } catch {
      // Files might not exist, that's fine
    }
  }

  // Kill any existing process on the test port
  try {
    const result = await $`lsof -ti:${TEST_PORT}`.quiet();
    if (result.stdout) {
      await $`kill -9 ${result.stdout.toString().trim()}`.quiet();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch {
    // Port might not be in use, that's fine
  }

  // Start test server
  testServer = spawn(["bun", "src/server/index.ts"], {
    env: {
      ...process.env,
      NODE_ENV: "test",
      BUN_ENV: "test",
      PORT: TEST_PORT.toString(),
      JWT_SECRET: "test-secret",
      DATABASE_URL: TEST_POSTGRES ? POSTGRES_URL : "", // Use PostgreSQL if testing
      SQLITE_PATH: "./db/test.db", // Use separate test database for SQLite
    },
    stdio: ["ignore", "inherit", "inherit"], // Show server output for debugging
  });

  // Wait for server to be ready
  let retries = 0;
  let lastError = null;
  while (retries < 50) {
    try {
      const response = await fetch(`http://localhost:${TEST_PORT}/api/health`);
      if (response.ok) {
        console.log(`✅ Test server ready on port ${TEST_PORT}`);
        break;
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    retries++;
  }

  if (retries >= 50) {
    throw new Error(`Test server failed to start: ${lastError}`);
  }

  // Run database migrations for test database
  console.log("📦 Setting up test database...");
  if (TEST_POSTGRES) {
    await $`DATABASE_URL=${POSTGRES_URL} bunx drizzle-kit push`.quiet();
  } else {
    await $`SQLITE_PATH=./db/test.db bunx drizzle-kit push`.quiet();
  }
});

// Stop test server after all tests
afterAll(async () => {
  if (testServer) {
    console.log("🛑 Stopping test server...");
    testServer.kill();
    testServer = null;
  }
});

// Extend global type definitions for test environment
declare global {
  var vi: {
    fn: (implementation?: (...args: unknown[]) => unknown) => MockFunction;
    clearAllMocks: () => void;
    mock: (moduleName: string, factory: () => unknown) => void;
  };
}

// Tests use real fetch, no special handling needed

// Define MockFunction type
type MockFunction = {
  (...args: unknown[]): unknown;
  calls: unknown[][];
  _mockReturnValue: unknown;
  mockImplementation?: (...args: unknown[]) => unknown;
  mockReturnThis: () => MockFunction;
  mockImplementationOnce: (impl: (...args: unknown[]) => unknown) => MockFunction;
  mockResolvedValueOnce: (value: unknown) => MockFunction;
  mockRejectedValueOnce: (value: unknown) => MockFunction;
  mockReturnValueOnce: (value: unknown) => MockFunction;
  mockReturnValue: (value: unknown) => MockFunction;
  mockClear: () => void;
};

// Minimal DOM mock for Bun tests
class MockElement {
  tagName: string;
  id = "";
  className = "";
  textContent = "";
  innerHTML = "";
  children: MockElement[] = [];
  parentElement: MockElement | null = null;
  style: Record<string, string> = {};
  attributes: Record<string, string> = {};

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  appendChild(child: MockElement) {
    this.children.push(child);
    child.parentElement = this;
    return child;
  }

  removeChild(child: MockElement) {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
      child.parentElement = null;
    }
    return child;
  }

  querySelector(selector: string): MockElement | null {
    // Very basic selector support
    if (selector.startsWith("#")) {
      const id = selector.slice(1);
      return this.findById(id);
    }
    if (selector.startsWith(".")) {
      const className = selector.slice(1);
      return this.findByClassName(className);
    }
    return this.findByTagName(selector);
  }

  querySelectorAll(selector: string): MockElement[] {
    const results: MockElement[] = [];
    if (selector.startsWith(".")) {
      const className = selector.slice(1);
      this.findAllByClassName(className, results);
    } else {
      this.findAllByTagName(selector, results);
    }
    return results;
  }

  getAttribute(name: string): string | null {
    return this.attributes[name] || null;
  }

  setAttribute(name: string, value: string) {
    this.attributes[name] = value;
    if (name === "id") this.id = value;
    if (name === "class") this.className = value;
  }

  addEventListener() {}
  removeEventListener() {}
  click() {}

  private findById(id: string): MockElement | null {
    if (this.id === id) return this;
    for (const child of this.children) {
      const found = child.findById(id);
      if (found) return found;
    }
    return null;
  }

  private findByClassName(className: string): MockElement | null {
    if (this.className.includes(className)) return this;
    for (const child of this.children) {
      const found = child.findByClassName(className);
      if (found) return found;
    }
    return null;
  }

  private findByTagName(tagName: string): MockElement | null {
    if (this.tagName === tagName.toUpperCase()) return this;
    for (const child of this.children) {
      const found = child.findByTagName(tagName);
      if (found) return found;
    }
    return null;
  }

  private findAllByClassName(className: string, results: MockElement[]) {
    if (this.className.includes(className)) results.push(this);
    for (const child of this.children) {
      child.findAllByClassName(className, results);
    }
  }

  private findAllByTagName(tagName: string, results: MockElement[]) {
    if (this.tagName === tagName.toUpperCase()) results.push(this);
    for (const child of this.children) {
      child.findAllByTagName(tagName, results);
    }
  }
}

// Mock document
const mockDocument = {
  body: new MockElement("body"),
  head: new MockElement("head"),
  documentElement: new MockElement("html"),

  createElement(tagName: string): MockElement {
    return new MockElement(tagName);
  },

  getElementById(id: string): MockElement | null {
    return mockDocument.body.querySelector(`#${id}`);
  },

  querySelector(selector: string): MockElement | null {
    return mockDocument.body.querySelector(selector);
  },

  querySelectorAll(selector: string): MockElement[] {
    return mockDocument.body.querySelectorAll(selector);
  },
};

// Get test port from environment
const testPort = TEST_PORT.toString();

// Mock window
const mockWindow = {
  document: mockDocument,
  location: {
    href: `http://localhost:${testPort}`,
    pathname: "/",
    search: "",
    hash: "",
  },
  localStorage: {
    store: {} as Record<string, string>,
    getItem(key: string) {
      return this.store[key] || null;
    },
    setItem(key: string, value: string) {
      this.store[key] = value;
    },
    removeItem(key: string) {
      delete this.store[key];
    },
    clear() {
      this.store = {};
    },
  },
  fetch: globalThis.fetch ? globalThis.fetch.bind(globalThis) : fetch, // Use real fetch for integration tests
};

// Set up globals - only set if not already defined
if (typeof window === "undefined") {
  // biome-ignore lint/suspicious/noExplicitAny: Setting up test globals
  (global as any).window = mockWindow;
}
if (typeof document === "undefined") {
  // biome-ignore lint/suspicious/noExplicitAny: Setting up test globals
  (global as any).document = mockDocument;
}
if (typeof Element === "undefined") {
  // biome-ignore lint/suspicious/noExplicitAny: Setting up test globals
  (global as any).Element = MockElement;
}
if (typeof localStorage === "undefined") {
  // biome-ignore lint/suspicious/noExplicitAny: Setting up test globals
  (global as any).localStorage = mockWindow.localStorage;
}

// Tests use real fetch, no special handling needed

// Mock vi functions for Bun test compatibility
const viImplementation = {
  fn: (implementation?: (...args: unknown[]) => unknown): MockFunction => {
    const mockFn = ((...args: unknown[]) => {
      mockFn.calls.push(args);
      if (mockFn.mockImplementation) {
        return mockFn.mockImplementation(...args);
      }
      if (implementation) {
        return implementation(...args);
      }
      return mockFn._mockReturnValue;
    }) as MockFunction;

    mockFn.calls = [] as unknown[][];
    mockFn._mockReturnValue = undefined;
    mockFn.mockImplementation = implementation;
    mockFn.mockReturnThis = () => mockFn;
    mockFn.mockImplementationOnce = (impl: (...args: unknown[]) => unknown) => {
      const originalImpl = mockFn.mockImplementation;
      mockFn.mockImplementation = (...args: unknown[]) => {
        mockFn.mockImplementation = originalImpl;
        return impl(...args);
      };
      return mockFn;
    };
    mockFn.mockResolvedValueOnce = (value: unknown) => {
      return mockFn.mockImplementationOnce(() => Promise.resolve(value));
    };
    mockFn.mockRejectedValueOnce = (value: unknown) => {
      return mockFn.mockImplementationOnce(() => Promise.reject(value));
    };
    mockFn.mockReturnValueOnce = (value: unknown) => {
      return mockFn.mockImplementationOnce(() => value);
    };
    mockFn.mockReturnValue = (value: unknown) => {
      mockFn._mockReturnValue = value;
      mockFn.mockImplementation = () => value;
      return mockFn;
    };
    mockFn.mockClear = () => {
      mockFn.calls = [];
    };

    return mockFn;
  },

  clearAllMocks: () => {
    // Clear all mocks
  },

  mock: (moduleName: string, factory: () => unknown) => {
    // Simple module mocking
    const mockModule = factory();
    // @ts-expect-error - Mock require.cache
    require.cache[require.resolve(moduleName)] = {
      exports: mockModule,
      id: moduleName,
      filename: moduleName,
      loaded: true,
      children: [],
      paths: [],
      parent: null,
    };
  },
};

// Assign vi to global
global.vi = viImplementation;

// Set test environment
process.env.NODE_ENV = "test";
process.env.BUN_ENV = "test";
process.env.DATABASE_URL = ""; // Force SQLite for tests
process.env.JWT_SECRET = "test-secret";

// Ensure global fetch is available
if (typeof globalThis.fetch === "undefined" && typeof fetch !== "undefined") {
  globalThis.fetch = fetch;
}

beforeAll(() => {
  // Reset DOM before tests
  mockDocument.body = new MockElement("body");
  mockDocument.head = new MockElement("head");
});

afterEach(() => {
  // Clean up after each test
  mockDocument.body = new MockElement("body");
  mockWindow.localStorage.clear();
  mockWindow.location.pathname = "/";
});
