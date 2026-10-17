import { expect, it } from "vitest";
import { Fen, STARTING_FEN } from "../src";

it.each([
  { symbol: "w", color: "white" },
  { symbol: "b", color: "black" },
])("parses active color $symbol as $color and round-trips it", ({ symbol, color }) => {
  // Given
  const value = STARTING_FEN.replace(" w ", ` ${symbol} `);

  // When
  const fen = new Fen(value);
  const result = fen.toString();

  // Then
  expect(fen.activeColor).toBe(color);
  expect(result).toBe(value);
});
