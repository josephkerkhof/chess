import type { Context } from "hono";
import { z } from "zod";

export type AppContext = Context<{ Bindings: Env }>;

export const GameStatus = z.enum(["active", "abandoned", "completed"]);
export const GameTurn = z.enum(["black", "white"]);

export const GameRequest = z.object({
  players: z.tuple([z.uuidv7(), z.uuidv7()]).refine(
    ([first, second]) => first !== second,
    "Players must be distinct"
  ),
});

const player = z.object({
  id: z.uuidv7(),
  name: z.string()
});

export const GameResponse = z.object({
  id: z.string(),
  status: GameStatus,
  turn: GameTurn,
  white: player,
  black: player,
  fen: z.string(), // TODO: add fen validation? see: https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
  moves: z.array(
    z.string() // TODO: when we're inserting moves into this array, add validation for those moves
  ),
  created_at: z.iso.datetime()
});
