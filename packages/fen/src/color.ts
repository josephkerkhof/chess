import { CHESS_COLORS, type ChessColor } from "@chess/core";
import { FenValidationError } from "./errors/fen-validation-error";
import type { FenColorSymbol } from "./types";

const FEN_COLOR_SYMBOLS = {
  white: "w",
  black: "b",
} as const satisfies Record<ChessColor, FenColorSymbol>;

export function parseFenColor(symbol: string): ChessColor {
  const color = CHESS_COLORS.find((candidate) => FEN_COLOR_SYMBOLS[candidate] === symbol);

  if (color === undefined) {
    throw new FenValidationError(
      `Active color must be one of: ${Object.values(FEN_COLOR_SYMBOLS).join(", ")}`,
    );
  }

  return color;
}

export function formatFenColor(color: ChessColor): FenColorSymbol {
  return FEN_COLOR_SYMBOLS[color];
}
