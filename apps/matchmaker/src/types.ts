import type { Context } from "hono";
import { z } from "zod";
import { GameColor, GameStatus } from "@chess/shared/game";

export { GameColor, GameStatus };

export type AppContext = Context<{ Bindings: Env }>;

export const GameStatusSchema = z.enum(GameStatus);
export const GameColorSchema = z.enum(GameColor);

export const GameRequest = z.object({
  gameId: z.uuidv7(),
  players: z.tuple([z.uuidv7(), z.uuidv7()]).refine(
    ([first, second]) => first !== second,
    "Players must be distinct"
  ),
});

export const MatchmakingPoolId = z.string().regex(/^[a-z][a-z0-9-]{0,31}$/);

export const MatchmakingState = z.discriminatedUnion("status", [
  z.object({ status: z.literal("waiting") }),
  z.object({
    status: z.literal("matched"),
    gameId: z.uuidv7(),
    color: GameColorSchema,
    opponentId: z.uuidv7(),
  }),
]);

const player = z.object({
  id: z.uuidv7(),
  name: z.string()
});

export const GameResponse = z.object({
  id: z.string(),
  status: GameStatusSchema,
  turn: GameColorSchema,
  white: player,
  black: player,
  fen: z.string(), // TODO: add fen validation? see: https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
  moves: z.array(z.object({ ply: z.number().int().positive(), san: z.string() })),
  createdAt: z.iso.datetime()
});
