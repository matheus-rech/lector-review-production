/**
 * Test setup and global configuration
 */

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock URL.createObjectURL
Object.defineProperty(globalThis.URL, "createObjectURL", {
  value: () => "mock-url",
  writable: true,
});

Object.defineProperty(globalThis.URL, "revokeObjectURL", {
  value: () => {},
  writable: true,
});
