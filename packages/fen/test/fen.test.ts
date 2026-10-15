import {expect, it} from "vitest";
import { Fen, STARTING_FEN } from "../src";

it("returns the starting FEN from toString()", () => {
  // Given
  const fen = new Fen(STARTING_FEN);

  // When
  const result = fen.toString();

  // Then
  expect(result).toBe(STARTING_FEN);
});
