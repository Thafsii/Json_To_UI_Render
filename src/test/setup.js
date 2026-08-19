import '@testing-library/jest-dom/vitest';

// recharts' ResponsiveContainer relies on ResizeObserver, which jsdom does not
// implement. A no-op stub is enough for render-smoke tests — we are not
// asserting on actual pixel layout.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
