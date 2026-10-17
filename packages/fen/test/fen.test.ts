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

it("parses all six fields of a nonstarting position and round-trips it", () => {
  // Given
  const value = "r3k3/8/8/8/8/8/8/4K2R b Kq - 17 42";

  // When
  const fen = new Fen(value);
  const result = fen.toString();

  // Then
  expect(fen.piecePlacement).toBe("r3k3/8/8/8/8/8/8/4K2R");
  expect(fen.activeColor).toBe("black");
  expect(fen.castlingAvailability).toEqual(["K", "q"]);
  expect(fen.enPassantTarget).toBeNull();
  expect(fen.halfmoveClock).toBe(17);
  expect(fen.fullmoveNumber).toBe(42);
  expect(result).toBe(value);
});

it("round-trips a position without castling rights or an en passant target", () => {
  // Given
  const value = "4k3/8/8/8/8/8/4P3/4K3 w - - 5 39";

  // When
  const fen = new Fen(value);
  const result = fen.toString();

  // Then
  expect(fen.castlingAvailability).toEqual([]);
  expect(fen.enPassantTarget).toBeNull();
  expect(result).toBe(value);
});

it.each([
  {
    label: "White's double pawn move",
    value: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
    target: "e3",
  },
  {
    label: "Black's double pawn move",
    value: "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2",
    target: "c6",
  },
])("preserves the en passant target after $label and round-trips it", (example) => {
  // Given
  const { value, target } = example;

  // When
  const fen = new Fen(value);
  const result = fen.toString();

  // Then
  expect(fen.enPassantTarget).toBe(target);
  expect(result).toBe(value);
});
