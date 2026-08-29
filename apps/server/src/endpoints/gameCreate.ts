import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, GameRequest, GameResponse } from "../types";
import { v7 as uuidv7 } from "uuid";
import { sqliteTimestampToIso } from "../timestamps";

type UserRow = {
  id: number;
  public_id: string;
  name: string;
}

type GameRow = {
  public_id: string;
  created_at: string;
}

const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

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
      "500": {
        description: "Server error",
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(false),
              message: z.string(),
            }),
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
    },
  };

  async handle(c: AppContext) {
    // Get validated data
    const data = await this.getValidatedData<typeof this.schema>();

    // Retrieve the validated request body
    const requestBody = data.body;

    // This endpoint doesn't track who created the game. This is becuase eventually, I want
    // to use a matchmaking service. I don't think users will create games directly via this
    // endpoint. We'll see...
    // Another thing is that there's no throttling on this endpoint at the minute so people
    // could spam it.

    // lookup the users
    const users = await c.env.DB
      .prepare("SELECT id, public_id, name FROM users WHERE public_id IN (?, ?)")
      .bind(
        requestBody.players[0],
        requestBody.players[1],
      )
      .all<UserRow>();

    // bail if the query was unsuccessful
    if (!users.success) {
      return c.json({
        success: false,
        message: "Something went wrong. Please try again.",
      }, 500);
    }

    // return HTTP 404 if fewer than 2 users were found
    if (users.results.length < 2) {
      return c.json({
        success: false,
      }, 404);
    }

    // assign black and white roles to players
    const [first, second] = users.results;
    if (!first || !second) {
      throw new Error("Expected two users");
    }
    const [white, black] = Math.random() < 0.5 ? [first, second] : [second, first];

    const game = await c.env.DB
      .prepare(`
        INSERT INTO games (public_id, white_user_id, black_user_id, status, fen)
        VALUES (?, ?, ?, 'active', ?)
        RETURNING public_id, created_at
      `)
      .bind(
        uuidv7(),
        white.id,
        black.id,
        initialFen,
      )
      .first<GameRow>();

    // TODO: this is a pattern I can improve so I don't need to repeat myself so much
    if (!game) {
      return c.json({
        success: false,
        message: "Something went wrong. Please try again.",
      }, 500);
    }

    // return the new game
    return c.json(
      {
        success: true,
        game: {
          id: game.public_id,
          status: "active",
          turn: "white",
          white: { id: white.public_id, name: white.name },
          black: { id: black.public_id, name: black.name },
          fen: initialFen,
          moves: [],
          created_at: sqliteTimestampToIso(game.created_at),
        },
      },
      201,
    );
  }
}
