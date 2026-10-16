export const CHESS_FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export type ChessFile = (typeof CHESS_FILES)[number];

export const CHESS_RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;
export type ChessRank = (typeof CHESS_RANKS)[number];

/** Color-independent piece types. Algebraic move notation omits the pawn's `P`. */
export const CHESS_PIECE_TYPES = ["K", "Q", "R", "B", "N", "P"] as const;
export type ChessPieceType = (typeof CHESS_PIECE_TYPES)[number];
