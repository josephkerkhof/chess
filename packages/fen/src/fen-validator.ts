import { CHESS_FILES, type ChessColor, type ChessFile } from "@chess/core";
import { parseFenColor } from "./color";
import { FenValidationError } from "./errors/fen-validation-error";
import type { FenEnPassantSquare } from "./types";

type FenFields = readonly [string, string, string, string, string, string];

export class FenValidator {
  public validate(fields: readonly string[]): void {
    this.validateFieldCount(fields);

    const [
      piecePlacement,
      activeColor,
      castlingAvailability,
      enPassantTargetSquare,
      halfMoveClock,
      fullMoveNumber,
    ] = fields;

    this.validatePiecePlacementRows(piecePlacement);
    // TODO add more checks for piece placement?

    const parsedActiveColor = parseFenColor(activeColor);
    this.validateCastlingAvailability(castlingAvailability);
    this.validateEnPassantTargetSquare(enPassantTargetSquare, parsedActiveColor);
    this.validateHalfMoveClock(halfMoveClock);
    this.validateFullMoveNumber(fullMoveNumber);
  }

  private validateFieldCount(fields: readonly string[]): asserts fields is FenFields {
    if (fields.length !== 6) {
      throw new FenValidationError("FEN must contain exactly six fields");
    }
  }

  private validatePiecePlacementRows(piecePlacement: string): void {
    const rows = piecePlacement.split("/");
    if (rows.length !== 8) {
      throw new FenValidationError("Piece placement must contain exactly eight rows");
    }
  }

  private validateCastlingAvailability(castlingAvailability: string): void {
    if (castlingAvailability === "-") {
      return;
    }

    if (!/^(?!$)K?Q?k?q?$/.test(castlingAvailability)) {
      throw new FenValidationError(
        "Castling availability must contain unique characters in KQkq order",
      );
    }
  }

  private validateEnPassantTargetSquare(
    enPassantTargetSquare: string,
    activeColor: ChessColor,
  ): asserts enPassantTargetSquare is FenEnPassantSquare | "-" {
    if (enPassantTargetSquare === "-") {
      return;
    }

    if (enPassantTargetSquare.length !== 2) {
      throw new FenValidationError("En passant target square must be two characters long");
    }

    const [file, rank] = enPassantTargetSquare;

    if (!CHESS_FILES.includes(file as ChessFile)) {
      throw new FenValidationError(
        `En passant target square file must be one of: ${CHESS_FILES.join(", ")}`,
      );
    }

    if (rank !== "3" && rank !== "6") {
      throw new FenValidationError("En passant target square rank must be 3 or 6");
    }

    if (activeColor === "black" && rank === "6") {
      throw new FenValidationError(
        "En passant target square rank must be 3 when active color is black",
      );
    }

    if (activeColor === "white" && rank === "3") {
      throw new FenValidationError(
        "En passant target square rank must be 6 when active color is white",
      );
    }
  }

  private validateHalfMoveClock(halfMoveClock: string): void {
    const halfMoveClockNumber = Number(halfMoveClock);

    if (isNaN(halfMoveClockNumber) || !Number.isInteger(halfMoveClockNumber)) {
      throw new FenValidationError("Half move clock must be an integer");
    }

    if (halfMoveClockNumber < 0) {
      throw new FenValidationError("Half move clock must be a positive number");
    }
  }

  private validateFullMoveNumber(fullMoveNumber: string): void {
    const fullMoveNumberNumber = Number(fullMoveNumber);

    if (isNaN(fullMoveNumberNumber) || !Number.isInteger(fullMoveNumberNumber)) {
      throw new FenValidationError("Full move number must be an integer");
    }

    if (fullMoveNumberNumber < 1) {
      throw new FenValidationError("Full move number must be a positive number");
    }
  }
}
