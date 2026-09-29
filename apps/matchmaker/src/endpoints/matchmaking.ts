import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { ServerErrorResponse } from "../errors";
import type { MatchmakingQueue } from "../matchmakingQueue";
import { type AppContext, MatchmakingPoolId, MatchmakingState } from "../types";

const poolParams = z.object({ poolId: MatchmakingPoolId });
const notFound = z.object({ success: z.literal(false) });
const matchResponse = z.object({
  success: z.literal(true),
  match: MatchmakingState,
});

function queueFor(env: Env, poolId: string): DurableObjectStub<MatchmakingQueue> {
  return env.MATCHMAKING_QUEUE.getByName(poolId) as DurableObjectStub<MatchmakingQueue>;
}

export class MatchmakingJoin extends OpenAPIRoute {
  schema = {
    tags: ["Matchmaking"],
    summary: "Join a matchmaking pool",
    request: {
      params: poolParams,
      body: {
        content: {
          "application/json": {
            schema: z.object({ userId: z.uuidv7() }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Waiting for an opponent or matched to a game",
        content: { "application/json": { schema: matchResponse } },
      },
      "404": {
        description: "Player not found",
        content: { "application/json": { schema: notFound } },
      },
      "500": {
        description: "Game handoff failed; retry with the same player and pool",
        content: { "application/json": { schema: ServerErrorResponse } },
      },
    },
  };

  async handle(c: AppContext) {
    const { params, body } = await this.getValidatedData<typeof this.schema>();
    const match = await queueFor(c.env, params.poolId).join(body.userId);
    return match
      ? c.json({ success: true, match }, 200)
      : c.json({ success: false }, 404);
  }
}

export class MatchmakingStatus extends OpenAPIRoute {
  schema = {
    tags: ["Matchmaking"],
    summary: "Read a player's matchmaking status",
    request: {
      params: poolParams.extend({ userId: z.uuidv7() }),
    },
    responses: {
      "200": {
        description: "Waiting for an opponent or matched to a game",
        content: { "application/json": { schema: matchResponse } },
      },
      "404": {
        description: "Player has not joined this pool",
        content: { "application/json": { schema: notFound } },
      },
      "500": {
        description: "Game handoff failed; poll again to retry",
        content: { "application/json": { schema: ServerErrorResponse } },
      },
    },
  };

  async handle(c: AppContext) {
    const { params } = await this.getValidatedData<typeof this.schema>();
    const match = await queueFor(c.env, params.poolId).status(params.userId);
    return match
      ? c.json({ success: true, match }, 200)
      : c.json({ success: false }, 404);
  }
}
