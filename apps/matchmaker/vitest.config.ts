import path from "node:path";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => {
  const migrations = await readD1Migrations(
    path.join(import.meta.dirname, "../../packages/database/migrations"),
  );

  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          bindings: { TEST_MIGRATIONS: migrations },
          workers: [
            {
              name: "chess-game-session",
              scriptPath: path.join(
                import.meta.dirname,
                ".wrangler/game-session-test/index.js",
              ),
              modules: true,
              durableObjects: {
                GAME_SESSION: { className: "GameSession", useSQLite: true },
              },
            },
          ],
        },
      }),
    ],
    test: {
      setupFiles: ["./test/applyMigrations.ts"],
    },
  };
});
