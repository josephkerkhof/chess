export type FenColor = "w" | "b";

export type FenCastlingRight = "K" | "Q" | "k" | "q";

export type FenFile = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";

export type FenEnPassantSquare = `${FenFile}${"3" | "6"}`;

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
