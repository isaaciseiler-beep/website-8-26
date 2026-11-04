import "@testing-library/jest-dom";

if (typeof window !== "undefined") Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Browser entry URLs are shared by happy-dom across tests; isolate navigation state.
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
afterEach(()=>{cleanup();if(typeof window!=="undefined"&&window.history)window.history.replaceState(null,"","/");});
