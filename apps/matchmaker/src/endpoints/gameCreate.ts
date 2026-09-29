import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, GameRequest, GameResponse } from "../types";
import { ServerErrorResponse } from "../errors";
import { GameHandoffError, handoffGame } from "../gameHandoff";

export class GameCreate extends OpenAPIRoute {
  schema = {
    tags: ["Games"],
    summary: "Create a new game",
    request: {
      body: {
        content: {
          "application/json": {
            schema: GameRequest,
          },
        },
      },
    },
    responses: {
      "201": {
        description: "Returns the created game",
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(true),
              game: GameResponse,
            }),
          },
        },
      },
      "200": {
        description: "Returns the game for a repeated creation request",
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(true),
              game: GameResponse,
            }),
          },
        },
      },
      "500": {
        description: "Server error",
        content: {
          "application/json": {
            schema: ServerErrorResponse,
          },
        },
      },
      "404": {
        description: "Not found",
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(false),
            }),
          },
        },
      },
      "409": {
        description: "The game ID is already assigned to another match",
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(false),
              message: z.string(),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    try {
      const { game, created } = await handoffGame(c.env, data.body);
      return c.json({ success: true, game }, created ? 201 : 200);
    } catch (error) {
      if (error instanceof GameHandoffError) {
        return error.status === 404
          ? c.json({ success: false }, 404)
          : c.json({ success: false, message: error.message }, 409);
      }
      throw error;
    }
  }
}
