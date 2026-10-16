import { describe, expect, it } from "vitest";
import { formatFenColor, parseFenColor } from "../src/color";
import { FenValidationError } from "../src/errors/fen-validation-error";

describe("parseFenColor", () => {
  it.each([
    { symbol: "w", expectedColor: "white" },
    { symbol: "b", expectedColor: "black" },
  ])("parses $symbol as $expectedColor", (example) => {
    // Given
    const { symbol, expectedColor } = example;

    // When
    const color = parseFenColor(symbol);

    // Then
    expect(color).toBe(expectedColor);
  });

  it.each(["", "x", "W", "B", "white", "black", " w", "b "])(
    "rejects invalid symbol %j",
    (value) => {
      // Given
      const symbol = value;

      // When
      const parse = () => parseFenColor(symbol);

      // Then
      expect(parse).toThrow(FenValidationError);
      expect(parse).toThrow("Active color must be one of: w, b");
    },
  );
});

describe("formatFenColor", () => {
  it.each([
    { color: "white", expectedSymbol: "w" },
    { color: "black", expectedSymbol: "b" },
  ] as const)("formats $color as $expectedSymbol", (example) => {
    // Given
    const { color, expectedSymbol } = example;

    // When
    const symbol = formatFenColor(color);

    // Then
    expect(symbol).toBe(expectedSymbol);
  });
});
