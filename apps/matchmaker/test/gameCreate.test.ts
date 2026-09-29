import { env, exports } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import type { z } from "zod";
import type { GameSession } from "../../game-session/src/index";
import type { GameResponse } from "../src/types";

type GameBody = { success: true; game: z.infer<typeof GameResponse> };
type MatchBody = {
  success: true;
  match: { status: "waiting" } | {
    status: "matched";
    gameId: string;
    color: "white" | "black";
    opponentId: string;
  };
};

const gameSession = (id: string) =>
  env.GAME_SESSION.getByName(id) as DurableObjectStub<GameSession>;

const adaPublicId = "01890f4e-93ad-7cc4-8a8f-5b2966e01465";
const gracePublicId = "01890f4e-93ad-7cc4-8a8f-5b2966e01466";
const nonExistingPublicId = "01890f4e-93ad-7cc4-8a8f-5b2966e01467";
const firstGameId = "01890f4e-93ad-7cc4-8a8f-5b2966e01468";
const secondGameId = "01890f4e-93ad-7cc4-8a8f-5b2966e01469";
const thirdGameId = "01890f4e-93ad-7cc4-8a8f-5b2966e0146a";
const fourthGameId = "01890f4e-93ad-7cc4-8a8f-5b2966e0146b";
const fifthGameId = "01890f4e-93ad-7cc4-8a8f-5b2966e0146e";
const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const join = (poolId: string, userId: string) => exports.default.fetch(
  `http://example.com/api/matchmaking/${poolId}/join`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId }),
  },
);

const status = (poolId: string, userId: string) => exports.default.fetch(
  `http://example.com/api/matchmaking/${poolId}/${userId}`,
);

beforeEach(async () => {
  await env.DB.prepare("DELETE FROM games").run();
  await env.DB.prepare("DELETE FROM users").run();

  await env.DB.batch([
    env.DB.prepare("INSERT INTO users (public_id, name) VALUES (?, ?)").bind(
      adaPublicId,
      "Ada",
    ),
    env.DB.prepare("INSERT INTO users (public_id, name) VALUES (?, ?)").bind(
      gracePublicId,
      "Grace",
    ),
  ]);
});

describe("POST /api/games", () => {
  it("creates a game for two existing users", async () => {
    const response = await exports.default.fetch(
      "http://example.com/api/games",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gameId: firstGameId, players: [adaPublicId, gracePublicId] }),
      },
    );

    expect(response.status).toBe(201);
    const body = await response.json() as GameBody;

    expect(body).toMatchObject({
      success: true,
      game: {
        id: firstGameId,
        status: "active",
        turn: "white",
        fen: initialFen,
        moves: [],
        created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      },
    });
    expect([body.game.white.id, body.game.black.id].sort()).toEqual(
      [adaPublicId, gracePublicId].sort(),
    );

    const stored = await env.DB.prepare(
      "SELECT status FROM games WHERE public_id = ?",
    ).bind(firstGameId).first<{ status: string }>();
    expect(stored?.status).toBe("active");

    const session = await gameSession(firstGameId).getGame();
    expect(session).toMatchObject({
      gameId: firstGameId,
      whiteUserId: body.game.white.id,
      blackUserId: body.game.black.id,
      status: "active",
      fen: body.game.fen,
    });
  });

  it("reuses a game and its assigned colors on retry", async () => {
    const create = (players: string[]) => exports.default.fetch(
      "http://example.com/api/games",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gameId: secondGameId, players }),
      },
    );

    const first = await create([adaPublicId, gracePublicId]);
    const second = await create([gracePublicId, adaPublicId]);
    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(((await second.json()) as GameBody).game).toEqual(((await first.json()) as GameBody).game);

    const count = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM games WHERE public_id = ?",
    ).bind(secondGameId).first<{ count: number }>();
    expect(count?.count).toBe(1);
  });

  it("rejects reuse of a game ID for different players", async () => {
    const thirdPlayer = "01890f4e-93ad-7cc4-8a8f-5b2966e0146c";
    await env.DB.prepare("INSERT INTO users (public_id, name) VALUES (?, ?)")
      .bind(thirdPlayer, "Judit").run();

    const create = (players: string[]) => exports.default.fetch(
      "http://example.com/api/games",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gameId: thirdGameId, players }),
      },
    );

    expect((await create([adaPublicId, gracePublicId])).status).toBe(201);
    const conflict = await create([adaPublicId, thirdPlayer]);
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({ success: false });
  });

  it("leaves a game pending when the session rejects initialization", async () => {
    await gameSession(fourthGameId).initializeGame({
      gameId: fourthGameId,
      whiteUserId: nonExistingPublicId,
      blackUserId: gracePublicId,
      initialFen: "other position",
    });

    const response = await exports.default.fetch(
      "http://example.com/api/games",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gameId: fourthGameId, players: [adaPublicId, gracePublicId] }),
      },
    );

    expect(response.status).toBe(500);
    const row = await env.DB.prepare(
      "SELECT status FROM games WHERE public_id = ?",
    ).bind(fourthGameId).first<{ status: string }>();
    expect(row?.status).toBe("pending");
  });

  it("completes a handoff when the session exists but D1 is still pending", async () => {
    await env.DB.prepare(
      `INSERT INTO games (public_id, white_user_id, black_user_id, status, fen)
       VALUES (?, (SELECT id FROM users WHERE public_id = ?),
                  (SELECT id FROM users WHERE public_id = ?), 'pending', ?)`,
    ).bind(fifthGameId, adaPublicId, gracePublicId, initialFen).run();
    await gameSession(fifthGameId).initializeGame({
      gameId: fifthGameId,
      whiteUserId: adaPublicId,
      blackUserId: gracePublicId,
      initialFen,
    });

    const response = await exports.default.fetch(
      "http://example.com/api/games",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gameId: fifthGameId, players: [gracePublicId, adaPublicId] }),
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json() as GameBody;
    expect(body.game).toMatchObject({
      id: fifthGameId,
      status: "active",
      white: { id: adaPublicId },
      black: { id: gracePublicId },
    });
    expect((await gameSession(fifthGameId).getGame())?.status).toBe("active");
  });

  it("returns 404 when one of the users doesn't exist in the database", async () => {
    const response = await exports.default.fetch(
      "http://example.com/api/games",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gameId: "01890f4e-93ad-7cc4-8a8f-5b2966e0146d", players: [adaPublicId, nonExistingPublicId] }),
      },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      success: false,
    });
  });
});

describe("matchmaking queue", () => {
  it("pairs two players, creates one game, and exposes the result to both", async () => {
    const pool = "two-players";
    const firstJoin = await join(pool, adaPublicId);
    expect(firstJoin.status).toBe(200);
    expect((await firstJoin.json() as MatchBody).match).toEqual({ status: "waiting" });

    const waiting = await status(pool, adaPublicId);
    expect(waiting.status).toBe(200);
    expect((await waiting.json() as MatchBody).match).toEqual({ status: "waiting" });

    const secondJoin = await join(pool, gracePublicId);
    expect(secondJoin.status).toBe(200);
    const grace = (await secondJoin.json() as MatchBody).match;
    expect(grace.status).toBe("matched");
    if (grace.status !== "matched") throw new Error("Expected Grace to be matched");
    expect(grace.opponentId).toBe(adaPublicId);

    const ada = (await (await status(pool, adaPublicId)).json() as MatchBody).match;
    expect(ada).toEqual({
      status: "matched",
      gameId: grace.gameId,
      color: grace.color === "white" ? "black" : "white",
      opponentId: gracePublicId,
    });

    const stored = await env.DB.prepare(
      "SELECT status FROM games WHERE public_id = ?",
    ).bind(grace.gameId).first<{ status: string }>();
    expect(stored?.status).toBe("active");
    expect(await gameSession(grace.gameId).getGame()).toMatchObject({
      gameId: grace.gameId,
      status: "active",
    });

    const duplicateJoin = await join(pool, gracePublicId);
    expect((await duplicateJoin.json() as MatchBody).match).toEqual(grace);
    const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM games")
      .first<{ count: number }>();
    expect(count?.count).toBe(1);
  });

  it("does not pair a player with themselves or queue an unknown player", async () => {
    const pool = "valid-players";
    expect((await join(pool, nonExistingPublicId)).status).toBe(404);
    expect((await status(pool, nonExistingPublicId)).status).toBe(404);

    expect((await (await join(pool, adaPublicId)).json() as MatchBody).match).toEqual({ status: "waiting" });
    expect((await (await join(pool, adaPublicId)).json() as MatchBody).match).toEqual({ status: "waiting" });
    const grace = (await (await join(pool, gracePublicId)).json() as MatchBody).match;
    expect(grace.status).toBe("matched");
  });

  it("reserves each concurrent entrant once and leaves an odd player waiting", async () => {
    const pool = "concurrent-players";
    const juditPublicId = "01890f4e-93ad-7cc4-8a8f-5b2966e0146c";
    const bobbyPublicId = "01890f4e-93ad-7cc4-8a8f-5b2966e0146f";
    await env.DB.batch([
      env.DB.prepare("INSERT INTO users (public_id, name) VALUES (?, ?)")
        .bind(juditPublicId, "Judit"),
      env.DB.prepare("INSERT INTO users (public_id, name) VALUES (?, ?)")
        .bind(bobbyPublicId, "Bobby"),
    ]);

    const firstThree = [adaPublicId, gracePublicId, juditPublicId];
    const responses = await Promise.all(firstThree.map((id) => join(pool, id)));
    expect(responses.map((response) => response.status)).toEqual([200, 200, 200]);

    const results = await Promise.all(firstThree.map(async (id) =>
      (await (await status(pool, id)).json() as MatchBody).match,
    ));
    expect(results.filter((result) => result.status === "matched")).toHaveLength(2);
    expect(results.filter((result) => result.status === "waiting")).toHaveLength(1);

    const fourth = (await (await join(pool, bobbyPublicId)).json() as MatchBody).match;
    expect(fourth.status).toBe("matched");
    const afterFourth = await Promise.all(firstThree.map(async (id) =>
      (await (await status(pool, id)).json() as MatchBody).match,
    ));
    expect(afterFourth.every((result) => result.status === "matched")).toBe(true);
    const gameIds = new Set(afterFourth.flatMap((result) =>
      result.status === "matched" ? [result.gameId] : [],
    ));
    expect(gameIds.size).toBe(2);
    const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM games")
      .first<{ count: number }>();
    expect(count?.count).toBe(2);
  });

  it("retries a reserved match after handoff failure", async () => {
    const pool = "retry-handoff";
    expect((await join(pool, adaPublicId)).status).toBe(200);
    await env.DB.prepare("DELETE FROM users WHERE public_id = ?").bind(adaPublicId).run();

    expect((await join(pool, gracePublicId)).status).toBe(500);
    await env.DB.prepare("INSERT INTO users (public_id, name) VALUES (?, ?)")
      .bind(adaPublicId, "Ada").run();

    const recovered = (await (await status(pool, adaPublicId)).json() as MatchBody).match;
    expect(recovered.status).toBe("matched");
    if (recovered.status !== "matched") throw new Error("Expected recovery to complete");
    const grace = (await (await status(pool, gracePublicId)).json() as MatchBody).match;
    expect(grace).toMatchObject({ status: "matched", gameId: recovered.gameId });
    const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM games")
      .first<{ count: number }>();
    expect(count?.count).toBe(1);
  });
});
