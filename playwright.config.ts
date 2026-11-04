import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60000,
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:4173",
    // Keep one worker-scoped launch configuration across UI and motion files.
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH, timeout: 10000 } : {},
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4173",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    url: "http://127.0.0.1:4173",
  },
});
