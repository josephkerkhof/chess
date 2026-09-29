import { fromHono } from "chanfana";
import { Hono } from "hono";
import { GameCreate } from "./endpoints/gameCreate";
import { handleError } from "./errors";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

app.onError(handleError);

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/",
});

// Register OpenAPI endpoints

// Create a game
openapi.post("/api/games", GameCreate);

// Export the Hono app
export default app;
