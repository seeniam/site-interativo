import { defineConfig, devices } from "@playwright/test";

const PORTA = 3100;

/** E2E contra o build de produção (rode `pnpm build` antes). */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  // Folga para máquinas lentas: a asserção espera até 10s antes de reprovar.
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${PORTA}`,
    locale: "pt-BR",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "celular-390",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, hasTouch: true },
    },
    { name: "tablet-768", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } } },
    { name: "desktop-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `pnpm start -p ${PORTA}`,
    url: `http://localhost:${PORTA}/design-system`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
