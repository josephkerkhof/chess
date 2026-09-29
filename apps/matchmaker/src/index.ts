import { fromHono } from "chanfana";
import { Hono } from "hono";
import { GameCreate } from "./endpoints/gameCreate";
import { MatchmakingJoin, MatchmakingStatus } from "./endpoints/matchmaking";
import { handleError } from "./errors";

export { MatchmakingQueue } from "./matchmakingQueue";

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
openapi.post("/api/matchmaking/:poolId/join", MatchmakingJoin);
openapi.get("/api/matchmaking/:poolId/:userId", MatchmakingStatus);

// Export the Hono app
export default app;
