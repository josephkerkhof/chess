import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, GameRequest, GameResponse } from "../types";
import { ServerErrorResponse } from "../errors";
import { sqliteTimestampToIso } from "../timestamps";
import type { GameSession } from "../../../game-session/src/index";

type UserRow = {
  id: number;
  public_id: string;
  name: string;
};

type GameRow = {
  public_id: string;
  white_user_id: number;
  black_user_id: number;
  status: string;
  fen: string;
  created_at: string;
};

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
    const requestBody = data.body;

    // TODO: make this route internal-only for the matchmaking DO

    // The matchmaking caller must reuse gameId when retrying this handoff.

    // lookup the users
    const users = await c.env.DB.prepare(
      "SELECT id, public_id, name FROM users WHERE public_id IN (?, ?)",
    )
      .bind(requestBody.players[0], requestBody.players[1])
      .all<UserRow>();

    // bail if the query was unsuccessful
    if (!users.success) {
      throw new Error("User lookup failed");
    }

    // return HTTP 404 if fewer than 2 users were found
    if (users.results.length < 2) {
      return c.json({ success: false }, 404);
    }

    // Choose colors only for a new row. An existing row retains its original colors.
    const [first, second] = users.results;
    if (!first || !second) {
      throw new Error("Expected two users");
    }
    const [candidateWhite, candidateBlack] =
      Math.random() < 0.5 ? [first, second] : [second, first];

    const inserted = await c.env.DB.prepare(
      `
        INSERT INTO games (public_id, white_user_id, black_user_id, status, fen)
        VALUES (?, ?, ?, 'pending', ?)
        ON CONFLICT (public_id) DO NOTHING
        RETURNING public_id, white_user_id, black_user_id, status, fen, created_at
      `,
    )
      .bind(requestBody.gameId, candidateWhite.id, candidateBlack.id, initialFen)
      .first<GameRow>();

    const game = inserted ?? await c.env.DB.prepare(
      "SELECT public_id, white_user_id, black_user_id, status, fen, created_at FROM games WHERE public_id = ?",
    ).bind(requestBody.gameId).first<GameRow>();

    if (!game) {
      throw new Error("Game insert did not return a row and no existing game was found");
    }

    const white = users.results.find((user) => user.id === game.white_user_id);
    const black = users.results.find((user) => user.id === game.black_user_id);
    if (!white || !black || game.status !== "pending" && game.status !== "active") {
      return c.json({ success: false, message: "Game ID is already assigned to another match" }, 409);
    }

    const session = c.env.GAME_SESSION.getByName(game.public_id) as DurableObjectStub<GameSession>;
    const state = await session.initializeGame({
      gameId: game.public_id,
      whiteUserId: white.public_id,
      blackUserId: black.public_id,
      initialFen,
    });

    if (game.status === "pending") {
      await c.env.DB.prepare(
        "UPDATE games SET status = 'active' WHERE public_id = ? AND status = 'pending'",
      ).bind(game.public_id).run();
    }

    return c.json(
      {
        success: true,
        game: {
          id: game.public_id,
          status: state.status,
          turn: "white",
          white: { id: white.public_id, name: white.name },
          black: { id: black.public_id, name: black.name },
          fen: state.fen,
          moves: [],
          created_at: sqliteTimestampToIso(game.created_at),
        },
      },
      inserted ? 201 : 200,
    );
  }
}
