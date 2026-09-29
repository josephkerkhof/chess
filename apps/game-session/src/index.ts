import { DurableObject } from "cloudflare:workers";

export type GameInitialization = {
  gameId: string;
  whiteUserId: string;
  blackUserId: string;
  initialFen: string;
};

export type GameState = GameInitialization & {
  fen: string;
  status: "active";
};

export class GameSession extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS game (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        game_id TEXT NOT NULL,
        white_user_id TEXT NOT NULL,
        black_user_id TEXT NOT NULL,
        initial_fen TEXT NOT NULL,
        fen TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status = 'active')
      )
    `);
  }

  initializeGame(input: GameInitialization): GameState {
    if (input.whiteUserId === input.blackUserId) {
      throw new Error("A game requires two distinct players");
    }

    const existing = this.getGame();
    if (existing) {
      if (
        existing.gameId !== input.gameId ||
        existing.whiteUserId !== input.whiteUserId ||
        existing.blackUserId !== input.blackUserId ||
        existing.initialFen !== input.initialFen
      ) {
        throw new Error("Game session was initialized with different players or position");
      }
      return existing;
    }

    this.ctx.storage.sql.exec(
      `INSERT INTO game (id, game_id, white_user_id, black_user_id, initial_fen, fen, status)
       VALUES (1, ?, ?, ?, ?, ?, 'active')`,
      input.gameId,
      input.whiteUserId,
      input.blackUserId,
      input.initialFen,
      input.initialFen,
    );

    return { ...input, fen: input.initialFen, status: "active" };
  }

  getGame(): GameState | null {
    const row = this.ctx.storage.sql.exec<GameState>(
        `
          SELECT game_id AS gameId,
                 white_user_id AS whiteUserId,
                 black_user_id AS blackUserId,
                 initial_fen AS initialFen,
                 fen,
                 status
          FROM game
          WHERE id = 1
        `,
    ).toArray()[0];

    return row ?? null;
  }
}

export default {};
