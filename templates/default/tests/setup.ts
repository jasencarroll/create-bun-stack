// Test setup and globals
import { afterEach, beforeAll } from "bun:test";

// Tests use real fetch, no special handling needed

// Minimal DOM mock for Bun tests
class MockElement {
  tagName: string;
  id: string = "";
  className: string = "";
  textContent: string = "";
  innerHTML: string = "";
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

// Mock window
const mockWindow = {
  document: mockDocument,
  location: {
    href: "http://localhost:3000",
    pathname: "/",
    search: "",
    hash: "",
  },
  localStorage: {
    store: {} as Record<string, string>,
    getItem(key: string) { return this.store[key] || null; },
    setItem(key: string, value: string) { this.store[key] = value; },
    removeItem(key: string) { delete this.store[key]; },
    clear() { this.store = {}; },
  },
  fetch: globalThis.fetch ? globalThis.fetch.bind(globalThis) : fetch, // Use real fetch for integration tests
};

// Set up globals
(global as any).window = mockWindow;
(global as any).document = mockDocument;
(global as any).Element = MockElement;
(global as any).localStorage = mockWindow.localStorage;

// Tests use real fetch, no special handling needed

// Mock vi functions for Bun test compatibility
(global as any).vi = {
  fn: (implementation?: Function) => {
    const mockFn = (...args: any[]) => {
      mockFn.calls.push(args);
      if (mockFn.mockImplementation) {
        return mockFn.mockImplementation(...args);
      }
      if (implementation) {
        return implementation(...args);
      }
      return mockFn._mockReturnValue;
    };
    
    mockFn.calls = [] as any[];
    mockFn._mockReturnValue = undefined;
    mockFn.mockImplementation = implementation;
    mockFn.mockReturnThis = () => mockFn;
    mockFn.mockImplementationOnce = (impl: Function) => {
      const originalImpl = mockFn.mockImplementation;
      mockFn.mockImplementation = (...args: any[]) => {
        mockFn.mockImplementation = originalImpl;
        return impl(...args);
      };
      return mockFn;
    };
    mockFn.mockResolvedValueOnce = (value: any) => {
      return mockFn.mockImplementationOnce(() => Promise.resolve(value));
    };
    mockFn.mockRejectedValueOnce = (value: any) => {
      return mockFn.mockImplementationOnce(() => Promise.reject(value));
    };
    mockFn.mockReturnValueOnce = (value: any) => {
      return mockFn.mockImplementationOnce(() => value);
    };
    mockFn.mockReturnValue = (value: any) => {
      mockFn._mockReturnValue = value;
      mockFn.mockImplementation = () => value;
      return mockFn;
    };
    mockFn.mockClear = () => {
      mockFn.calls = [];
    };
    
    return mockFn as any;
  },
  
  clearAllMocks: () => {
    // Clear all mocks
  },
  
  mock: (moduleName: string, factory: () => any) => {
    // Simple module mocking
    const mockModule = factory();
    (require.cache as any)[require.resolve(moduleName)] = {
      exports: mockModule,
      id: moduleName,
      filename: moduleName,
      loaded: true,
      children: [],
      paths: [],
      parent: null,
    } as any;
  }
};

// Set test environment
process.env.DATABASE_URL = ""; // Force SQLite for tests
process.env.JWT_SECRET = "test-secret";

// Ensure global fetch is available
if (typeof globalThis.fetch === 'undefined' && typeof fetch !== 'undefined') {
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
