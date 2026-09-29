import type { z } from "zod";
import type { GameSession } from "../../game-session/src/index";
import { sqliteTimestampToIso } from "./timestamps";
import type { GameRequest, GameResponse } from "./types";

type GameInput = z.infer<typeof GameRequest>;
type Game = z.infer<typeof GameResponse>;

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
  created_at: string;
};

const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export class GameHandoffError extends Error {
  constructor(
    readonly status: 404 | 409,
    message: string,
  ) {
    super(message);
  }
}

export async function handoffGame(env: Env, input: GameInput): Promise<{ game: Game; created: boolean }> {
  const users = await env.DB.prepare(
    "SELECT id, public_id, name FROM users WHERE public_id IN (?, ?)",
  ).bind(input.players[0], input.players[1]).all<UserRow>();

  if (!users.success) {
    throw new Error("User lookup failed");
  }
  if (users.results.length !== 2) {
    throw new GameHandoffError(404, "One or both players were not found");
  }

  const [first, second] = users.results;
  if (!first || !second) {
    throw new Error("Expected two users");
  }
  const [candidateWhite, candidateBlack] =
    Math.random() < 0.5 ? [first, second] : [second, first];

  const inserted = await env.DB.prepare(
    `INSERT INTO games (public_id, white_user_id, black_user_id, status, fen)
     VALUES (?, ?, ?, 'pending', ?)
     ON CONFLICT (public_id) DO NOTHING
     RETURNING public_id, white_user_id, black_user_id, status, created_at`,
  ).bind(input.gameId, candidateWhite.id, candidateBlack.id, initialFen).first<GameRow>();

  const row = inserted ?? await env.DB.prepare(
    "SELECT public_id, white_user_id, black_user_id, status, created_at FROM games WHERE public_id = ?",
  ).bind(input.gameId).first<GameRow>();
  if (!row) {
    throw new Error("Game insert did not return a row and no existing game was found");
  }

  const white = users.results.find((user) => user.id === row.white_user_id);
  const black = users.results.find((user) => user.id === row.black_user_id);
  if (!white || !black || (row.status !== "pending" && row.status !== "active")) {
    throw new GameHandoffError(409, "Game ID is already assigned to another match");
  }

  const session = env.GAME_SESSION.getByName(row.public_id) as DurableObjectStub<GameSession>;
  const state = await session.initializeGame({
    gameId: row.public_id,
    whiteUserId: white.public_id,
    blackUserId: black.public_id,
    initialFen,
  });

  if (row.status === "pending") {
    await env.DB.prepare(
      "UPDATE games SET status = 'active' WHERE public_id = ? AND status = 'pending'",
    ).bind(row.public_id).run();
  }

  return {
    created: inserted !== null,
    game: {
      id: row.public_id,
      status: state.status,
      turn: "white",
      white: { id: white.public_id, name: white.name },
      black: { id: black.public_id, name: black.name },
      fen: state.fen,
      moves: [],
      createdAt: sqliteTimestampToIso(row.created_at),
    },
  };
}
