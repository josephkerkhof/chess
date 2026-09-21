# Cloudflare Workers OpenAPI 3.1

This is a Cloudflare Worker with OpenAPI 3.1 using [chanfana](https://github.com/cloudflare/chanfana) and [Hono](https://github.com/honojs/hono).

This is an example project made to be used as a quick start into building OpenAPI compliant Workers that generates the
`openapi.json` schema automatically from code and validates the incoming request to the defined parameters or request body.

## Development environment

This project uses [devenv](https://devenv.sh/) to provide Node.js, pnpm, and SQLite. After installing Nix and devenv, enter
the environment with `devenv shell`. If direnv is installed, run `direnv allow` once to activate it automatically when
entering the repository. Then install the npm dependencies with `pnpm install --frozen-lockfile`.

## Get started

1. Sign up for [Cloudflare Workers](https://workers.dev). The free tier is more than enough for most use cases.
2. Clone this project and install dependencies with `pnpm install`.
3. Run `wrangler login` to login to your Cloudflare account in wrangler
4. Run `pnpm deploy` to publish the API to Cloudflare Workers.

## Project structure

1. The Worker is contained in the `apps/matchmaker` workspace package.
2. Its main router is defined in `apps/matchmaker/src/index.ts`.
3. Each endpoint has its own file in `apps/matchmaker/src/endpoints/`.
4. The live game Durable Object is defined in `apps/game-session/`.
5. For more information read the [chanfana documentation](https://chanfana.pages.dev/) and [Hono documentation](https://hono.dev/docs).

## Development

1. Run `pnpm dev` to start a local instance of the API.
2. Open `http://localhost:8787/` in your browser to see the Swagger interface where you can try the endpoints.
3. Changes made in `apps/matchmaker/src/` will automatically trigger the server to reload; you only need to refresh the Swagger interface.

## Debugging

1. Run the shared IntelliJ configuration **Start Dev Server** to start Wrangler inside devenv.
2. Select **Debug Worker** and click **Debug**. It attaches to the Worker's inspector at `localhost:9229`. If the connection closes, start **Debug Worker** again; automatic reconnection is disabled to avoid repeated reconnect attempts when the inspector is unavailable.
3. Set a breakpoint in `apps/matchmaker/src/endpoints/gameCreate.ts`, for example on the `DB.prepare` user lookup.
4. Run **Create Game** from `apps/matchmaker/matchmaker.http` with the `local` environment selected. IntelliJ pauses at the breakpoint so you can inspect variables. Resume execution to let the HTTP request finish.

**Known limitation:** stepping over an `await` in the Workers runtime can resume the whole request instead of pausing on the next statement. This is tracked in [workerd #2962](https://github.com/cloudflare/workerd/issues/2962), and was reproduced with this app in Wrangler 4.127.0 and 4.135.0. Until the runtime issue is resolved, use a breakpoint on the executable statement after the `await` and resume. Disabling automatic reconnection does not fix async stepping.

The API uses port `8787`; the debugger uses port `9229`. Wrangler generates the TypeScript source maps during development.
Close any browser DevTools session attached to the Worker before using **Debug Worker**, since Wrangler accepts only one debugger client at a time.
Stopping **Debug Worker** detaches the debugger; use **Stop** on **Start Dev Server** to shut down the server.
