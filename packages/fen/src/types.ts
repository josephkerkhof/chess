export const FEN_COLORS = ["w", "b"] as const;
export type FenColor = (typeof FEN_COLORS)[number];

export type FenCastlingRight = "K" | "Q" | "k" | "q"; // TODO: is this needed? it doesn't include the hyphen

// TODO refactor this a separate package so this can be used outside of this package
export const CHESS_FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
export type ChessFile = (typeof CHESS_FILES)[number];
export const CHESS_RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"]; // TODO: should this be a number instead of a string?
export type ChessRank = (typeof CHESS_RANKS)[number];

export type FenEnPassantSquare = `${ChessFile}${"3" | "6"}`;

/**
 * The six fields of a standard chess FEN record, represented as structured data.
 * These types describe the shape; they do not perform runtime validation.
 */
export interface FenPosition {
  /** Compressed ranks, ordered from rank 8 to rank 1 and separated by `/`. */
  readonly piecePlacement: string;
  readonly activeColor: FenColor;
  /** An empty array represents the FEN `-` sentinel. */
  readonly castlingAvailability: readonly FenCastlingRight[];
  /** `null` represents the FEN `-` sentinel. */
  readonly enPassantTarget: FenEnPassantSquare | null;
  /** Nonnegative count of plies since the last pawn move or capture. */
  readonly halfmoveClock: number;
  /** Positive move number, beginning at 1 and incremented after Black moves. */
  readonly fullmoveNumber: number;
}
