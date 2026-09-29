import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { GameSession } from "../../../game-session/src";
import { ServerErrorResponse } from "../errors";
import { sqliteTimestampToIso } from "../timestamps";
import { type AppContext, GameColor, GameResponse, GameStatus } from "../types";

type GameRow = {
  white_user_id: string;
  white_name: string;
  black_user_id: string;
  black_name: string;
  created_at: string;
};

export class GameGet extends OpenAPIRoute {
  schema = {
    tags: ["Games"],
    summary: "Read a game snapshot",
    request: {
      params: z.object({ gameId: z.uuidv7() }),
    },
    responses: {
      "200": {
        description: "The current game position and ordered move history",
        content: {
          "application/json": {
            schema: z.object({ success: z.literal(true), game: GameResponse }),
          },
        },
      },
      "404": {
        description: "Game not found or not active",
        content: {
          "application/json": {
            schema: z.object({ success: z.literal(false) }),
          },
        },
      },
      "500": {
        description: "Server error",
        content: { "application/json": { schema: ServerErrorResponse } },
      },
    },
  };

  async handle(c: AppContext) {
    const { params } = await this.getValidatedData<typeof this.schema>();
    const row = await c.env.DB.prepare(
      `SELECT white.public_id AS white_user_id, white.name AS white_name,
              black.public_id AS black_user_id, black.name AS black_name,
              games.created_at
       FROM games
       JOIN users AS white ON white.id = games.white_user_id
       JOIN users AS black ON black.id = games.black_user_id
       WHERE games.public_id = ? AND games.status = ?`,
    ).bind(params.gameId, GameStatus.Active).first<GameRow>();
    if (!row) return c.json({ success: false }, 404);

    const session = c.env.GAME_SESSION.getByName(params.gameId) as DurableObjectStub<GameSession>;
    const snapshot = await session.getSnapshot();
    if (
      !snapshot || snapshot.gameId !== params.gameId ||
      snapshot.whiteUserId !== row.white_user_id ||
      snapshot.blackUserId !== row.black_user_id
    ) {
      throw new Error(`Active game ${params.gameId} has no matching game session`);
    }

    const activeColor = snapshot.fen.split(" ")[1];
    if (activeColor !== "w" && activeColor !== "b") {
      throw new Error(`Game ${params.gameId} has an invalid active color in its FEN`);
    }

    return c.json({
      success: true,
      game: {
        id: snapshot.gameId,
        status: snapshot.status,
        turn: activeColor === "w" ? GameColor.White : GameColor.Black,
        white: { id: row.white_user_id, name: row.white_name },
        black: { id: row.black_user_id, name: row.black_name },
        fen: snapshot.fen,
        moves: snapshot.moves,
        createdAt: sqliteTimestampToIso(row.created_at),
      },
    }, 200);
  }
}
