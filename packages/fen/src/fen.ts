import { FenValidator } from "./fen-validator";
import type {
  FenCastlingRight,
  FenColor,
  FenEnPassantSquare,
  FenPosition,
} from "./types";

export class Fen implements FenPosition {
  public readonly piecePlacement: string;
  public readonly activeColor: FenColor;
  public readonly castlingAvailability: readonly FenCastlingRight[];
  public readonly enPassantTarget: FenEnPassantSquare | null;
  public readonly halfmoveClock: number;
  public readonly fullmoveNumber: number;

  constructor(value: string) {
    const fields = this.parse(value);
    new FenValidator().validate(fields);
    const position = this.cast(fields);

    this.piecePlacement = position.piecePlacement;
    this.activeColor = position.activeColor;
    this.castlingAvailability = position.castlingAvailability;
    this.enPassantTarget = position.enPassantTarget;
    this.halfmoveClock = position.halfmoveClock;
    this.fullmoveNumber = position.fullmoveNumber;
  }

  toString(): string {
    return [
      this.piecePlacement,
      this.activeColor,
      this.castlingAvailability.join("") || "-",
      this.enPassantTarget ?? "-",
      this.halfmoveClock,
      this.fullmoveNumber,
    ].join(" ");
  }

  private parse(value: string): string[] {
    return value.split(" ");
  }

  private cast(fields: readonly string[]): FenPosition {
    const [
      piecePlacement,
      activeColor,
      castlingAvailability,
      enPassantTarget,
      halfmoveClock,
      fullmoveNumber,
    ] = fields as [string, string, string, string, string, string];

    return {
      piecePlacement,
      activeColor: activeColor as FenColor,
      castlingAvailability: castlingAvailability === "-"
        ? []
        : castlingAvailability.split("") as FenCastlingRight[],
      enPassantTarget: enPassantTarget === "-"
        ? null
        : enPassantTarget as FenEnPassantSquare,
      halfmoveClock: Number(halfmoveClock),
      fullmoveNumber: Number(fullmoveNumber),
    };
  }
}
