# Cloudflare Workers OpenAPI 3.1

This is a Cloudflare Worker with OpenAPI 3.1 using [chanfana](https://github.com/cloudflare/chanfana) and [Hono](https://github.com/honojs/hono).

This is an example project made to be used as a quick start into building OpenAPI compliant Workers that generates the
`openapi.json` schema automatically from code and validates the incoming request to the defined parameters or request body.

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

Use the shared IntelliJ run configuration `Cloudflare Worker (Debug)`. It starts Wrangler with the local inspector enabled and source maps available for TypeScript breakpoints. Once the server is running, press `d` in the Wrangler terminal to open Cloudflare DevTools, then set a breakpoint in `apps/matchmaker/src/endpoints/gameCreate.ts` and call the endpoint from the Swagger UI.
