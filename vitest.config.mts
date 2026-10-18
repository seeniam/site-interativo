import path from "node:path";
import { defineConfig } from "vitest/config";

const alias = { "@": path.resolve(import.meta.dirname, "src") };
const include = ["src/**/*.test.ts", "scripts/**/*.test.ts"];

/**
 * A suíte roda em dois fusos longe de Brasília. Tóquio (UTC+9, sem horário de verão) e
 * Nova York (com horário de verão) provam que datas, agenda e PIX não dependem da máquina.
 */
export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      { resolve: { alias }, test: { name: "toquio", environment: "node", include, env: { TZ: "Asia/Tokyo" } } },
      {
        resolve: { alias },
        test: { name: "nova-york", environment: "node", include, env: { TZ: "America/New_York" } },
      },
    ],
  },
});
