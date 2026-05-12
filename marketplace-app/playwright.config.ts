import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e-tests",
    timeout: 30 * 1000,
    retries:  process.env.CI ? 1 : 0,
    use: {
        baseURL: "http://localhost:3000",
        trace: "retain-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    webServer: {
        command: "npm run dev",
        url: "http://localhost:3000",
        stdout: "ignore",
        stderr: "pipe",
        reuseExistingServer: !process.env.CI,
    },
});