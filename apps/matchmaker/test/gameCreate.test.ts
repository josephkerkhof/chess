import { env, exports } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";

const adaPublicId = "01890f4e-93ad-7cc4-8a8f-5b2966e01465";
const gracePublicId = "01890f4e-93ad-7cc4-8a8f-5b2966e01466";
const nonExistingPublicId = "01890f4e-93ad-7cc4-8a8f-5b2966e01467";

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
        body: JSON.stringify({ players: [adaPublicId, gracePublicId] }),
      },
    );

    expect(response.status).toBe(201);
    const body = await response.json();

    expect(body).toMatchObject({
      success: true,
      game: {
        id: expect.any(String),
        status: "pending",
        turn: "white",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves: [],
        created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      },
    });
    expect([body.game.white.id, body.game.black.id].sort()).toEqual(
      [adaPublicId, gracePublicId].sort(),
    );
  });

  it("returns 404 when one of the users doesn't exist in the database", async () => {
    const response = await exports.default.fetch(
      "http://example.com/api/games",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ players: [adaPublicId, nonExistingPublicId] }),
      },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      success: false,
    });
  });
});
