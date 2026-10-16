import { expect, it } from "vitest";
import { Fen, FenValidationError, STARTING_FEN } from "../src";

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

it.each(["white", "black"])("rejects the internal color name %s in FEN input", (color) => {
  // Given
  const value = STARTING_FEN.replace(" w ", ` ${color} `);

  // When
  const create = () => new Fen(value);

  // Then
  expect(create).toThrow(FenValidationError);
  expect(create).toThrow("Active color must be one of: w, b");
});
