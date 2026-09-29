# Cloudflare Workers

STOP. Your knowledge of Cloudflare Workers APIs and limits may be outdated. Always retrieve current documentation before any Workers, KV, R2, D1, Durable Objects, Queues, Vectorize, AI, or Agents SDK task.

## Docs

- https://developers.cloudflare.com/workers/
- MCP: `https://docs.mcp.cloudflare.com/mcp`

For all limits and quotas, retrieve from the product's `/platform/limits/` page. eg. `/workers/platform/limits`

## Commands

| Command | Purpose |
|---------|---------|
| `npx wrangler dev` | Local development |
| `npx wrangler deploy` | Deploy to Cloudflare |
| `npx wrangler types` | Generate TypeScript types |

Run `wrangler types` after changing bindings in wrangler.jsonc.

## SQL formatting

Write every SQL query embedded in TypeScript (including tests) as a multiline backtick string. Follow the IDE formatter's SQL layout: indent a template argument four spaces beyond its call, indent SQL two spaces beyond the backticks, align continuation lines, and indent `JOIN` clauses under `FROM` as shown below. Put major clauses on separate lines and end the statement with a semicolon. Keep SQL in `.sql` files as SQL.

Bad:

```ts
const row = await env.DB.prepare(
  "SELECT games.public_id FROM games JOIN users AS white ON white.id = games.white_user_id WHERE games.public_id = ?",
);
```

Good:

```ts
const row = await env.DB.prepare(
    `
      SELECT games.public_id
      FROM games
             JOIN users AS white ON white.id = games.white_user_id
      WHERE games.public_id = ?;
    `,
);
```

## Node.js Compatibility

https://developers.cloudflare.com/workers/runtime-apis/nodejs/

## Errors

- **Error 1102** (CPU/Memory exceeded): Retrieve limits from `/workers/platform/limits/`
- **All errors**: https://developers.cloudflare.com/workers/observability/errors/

## Product Docs

Retrieve API references and limits from:
`/kv/` · `/r2/` · `/d1/` · `/durable-objects/` · `/queues/` · `/vectorize/` · `/workers-ai/` · `/agents/`

## Best Practices (conditional)

If the application uses Durable Objects or Workflows, refer to the relevant best practices:

- Durable Objects: https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/
- Workflows: https://developers.cloudflare.com/workflows/build/rules-of-workflows/
