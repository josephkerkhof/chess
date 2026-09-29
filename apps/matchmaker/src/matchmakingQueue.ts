import { DurableObject } from "cloudflare:workers";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { handoffGame } from "./gameHandoff";
import { GameColor, type MatchmakingState } from "./types";

type MatchState = z.infer<typeof MatchmakingState>;
type EntryRow = { game_id: string | null };
type MatchRow = {
  game_id: string;
  first_user_id: string;
  second_user_id: string;
  white_user_id: string | null;
  black_user_id: string | null;
  status: "pending" | "active";
};

// One instance coordinates one matchmaking pool. The Worker chooses the pool name.
export class MatchmakingQueue extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(
        `
          CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL UNIQUE,
            game_id TEXT
          );
        `
    );
    this.ctx.storage.sql.exec(
        `
          CREATE INDEX IF NOT EXISTS entries_waiting_idx ON entries(game_id, id);
        `
    );
    this.ctx.storage.sql.exec(
        `
          CREATE TABLE IF NOT EXISTS matches (
            game_id TEXT PRIMARY KEY,
            first_user_id TEXT NOT NULL,
            second_user_id TEXT NOT NULL,
            white_user_id TEXT,
            black_user_id TEXT,
            status TEXT NOT NULL CHECK (status IN ('pending', 'active')),
            CHECK (first_user_id <> second_user_id)
          );
        `
    );
  }

  async join(userId: string): Promise<MatchState | null> {
    const existing = this.#entry(userId);
    if (existing) {
      return this.status(userId);
    }

    const user = await this.env.DB.prepare(
        `
          SELECT id
          FROM users
          WHERE public_id = ?;
        `,
    ).bind(userId).first<{ id: number }>();
    if (!user) {
      return null;
    }

    // Reserve both players and a stable game ID before the cross-service handoff.
    this.ctx.storage.transactionSync(() => {
      if (this.#entry(userId)) {
        return;
      }

      const waiting = this.ctx.storage.sql.exec<{ user_id: string }>(
          `
            SELECT user_id
            FROM entries
            WHERE game_id IS NULL
            ORDER BY id
            LIMIT 1;
          `,
      ).toArray()[0];
      if (!waiting) {
        this.ctx.storage.sql.exec(
            `
              INSERT INTO entries (user_id)
              VALUES (?);
            `,
            userId,
        );
        return;
      }

      const gameId = uuidv7();
      this.ctx.storage.sql.exec(
          `
            INSERT INTO matches (game_id, first_user_id, second_user_id, status)
            VALUES (?, ?, ?, 'pending');
          `,
          gameId, waiting.user_id, userId,
      );
      this.ctx.storage.sql.exec(
          `
            UPDATE entries
            SET game_id = ?
            WHERE user_id = ?;
          `,
          gameId, waiting.user_id,
      );
      this.ctx.storage.sql.exec(
          `
            INSERT INTO entries (user_id, game_id)
            VALUES (?, ?);
          `,
          userId, gameId,
      );
    });

    return this.status(userId);
  }

  async status(userId: string): Promise<MatchState | null> {
    const entry = this.#entry(userId);
    if (!entry) {
      return null;
    }
    if (!entry.game_id) {
      return { status: "waiting" };
    }

    let match = this.#match(entry.game_id);
    if (!match) {
      throw new Error("Queue entry references a missing match");
    }
    if (match.status === "pending") {
      await this.#onMatchFound(match);
      match = this.#match(entry.game_id);
    }
    if (!match || !match.white_user_id || !match.black_user_id) {
      throw new Error("Completed match is missing its color assignment");
    }

    return {
      status: "matched",
      gameId: match.game_id,
      color: match.white_user_id === userId ? GameColor.White : GameColor.Black,
      opponentId: match.first_user_id === userId
        ? match.second_user_id
        : match.first_user_id,
    };
  }

  #entry(userId: string): EntryRow | undefined {
    return this.ctx.storage.sql.exec<EntryRow>(
        `
          SELECT game_id
          FROM entries
          WHERE user_id = ?;
        `,
        userId,
    ).toArray()[0];
  }

  #match(gameId: string): MatchRow | undefined {
    return this.ctx.storage.sql.exec<MatchRow>(
        `
          SELECT game_id, first_user_id, second_user_id, white_user_id,
                 black_user_id, status
          FROM matches
          WHERE game_id = ?;
        `,
        gameId,
    ).toArray()[0];
  }

  async #onMatchFound(match: MatchRow): Promise<void> {
    const { game } = await handoffGame(this.env, {
      gameId: match.game_id,
      players: [match.first_user_id, match.second_user_id],
    });
    this.ctx.storage.sql.exec(
        `
          UPDATE matches
          SET status = 'active', white_user_id = ?, black_user_id = ?
          WHERE game_id = ? AND status = 'pending';
        `,
        game.white.id, game.black.id, match.game_id,
    );
  }
}
