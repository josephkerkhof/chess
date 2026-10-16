export const CHESS_COLORS = ["white", "black"] as const;
export type ChessColor = (typeof CHESS_COLORS)[number];

export const CHESS_FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export type ChessFile = (typeof CHESS_FILES)[number];

export const CHESS_RANKS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export type ChessRank = (typeof CHESS_RANKS)[number];

export const CHESS_PIECE_TYPES = ["king", "queen", "rook", "bishop", "knight", "pawn"] as const;
export type ChessPieceType = (typeof CHESS_PIECE_TYPES)[number];

export interface ChessSquare {
  readonly file: ChessFile;
  readonly rank: ChessRank;
}

/** A snapshot of a piece on one square. */
export interface ChessPiecePlacement {
  readonly piece: ChessPieceType;
  readonly square: ChessSquare;
}

/** The moving piece's placements before and after a move. */
export interface ChessMove {
  readonly color: ChessColor;
  readonly from: ChessPiecePlacement;
  readonly to: ChessPiecePlacement;
}
