import { FenValidationError } from "./errors/fen-validation-error";
import { FEN_COLORS, type FenColor } from "./types";

type FenFields = readonly [string, string, string, string, string, string];

export class FenValidator {
  public validate(fields: readonly string[]): void {
    this.validateFieldCount(fields);

    const [
      piecePlacement,
      activeColor,
      castlingAvailability,
      _enPassantTargetSquare,
      _halfMoveClock,
      _fullMoveNumber,
    ] = fields;

    this.validatePiecePlacementRows(piecePlacement);
    // TODO add more checks for piece placement

    this.validateActiveColor(activeColor);
    this.validateCastlingAvailability(castlingAvailability);

    // TODO add more checks
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

  private validateActiveColor(activeColor: string): asserts activeColor is FenColor {
    if (!FEN_COLORS.some((color) => color === activeColor)) {
      throw new FenValidationError(`Active color must be one of: ${FEN_COLORS.join(", ")}`);
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
}
