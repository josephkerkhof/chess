import { describe, expect, it } from "vitest";
import { FenValidationError, FenValidator, STARTING_FEN } from "../src";

it("accepts the starting FEN fields", () => {
  // Given
  const validator = new FenValidator();
  const fields = STARTING_FEN.split(" ");

  // When
  const validate = () => validator.validate(fields);

  // Then
  expect(validate).not.toThrow();
});

it.each([5, 7])("rejects a FEN with %i fields", (fieldCount) => {
  // Given
  const validator = new FenValidator();
  const fields = Array<string>(fieldCount).fill("-");

  // When
  const validate = () => validator.validate(fields);

  // Then
  expect(validate).toThrow(FenValidationError);
  expect(validate).toThrow("FEN must contain exactly six fields");
});

it.each([
  { label: "seven rows", wrongPiecePlacement: "rnbqkbnr/pppppppp/8/8/8/PPPPPPPP/RNBQKBNR" },
  { label: "nine rows", wrongPiecePlacement: "rnbqkbnr/pppppppp/8/8/8/8/8/PPPPPPPP/RNBQKBNR" },
])("rejects piece placement with $label", ({ wrongPiecePlacement }) => {
  // Given
  const validator = new FenValidator();
  const fields = STARTING_FEN.split(" ");

  // and the piece placement row doesn't have 8 rows
  fields[0] = wrongPiecePlacement;

  // When
  const validate = () => validator.validate(fields);

  // Then
  expect(validate).toThrow(FenValidationError);
  expect(validate).toThrow("Piece placement must contain exactly eight rows");
});

it("rejects an active color that's not 'b' or 'w'", () => {
  // Given
  const validator = new FenValidator();
  const fields = STARTING_FEN.split(" ");

  // and the active color is not 'b' or 'w'
  fields[1] = "x";

  // When
  const validate = () => validator.validate(fields);

  // Then
  expect(validate).toThrow(FenValidationError);
  expect(validate).toThrow("Active color must be one of: w, b");
});

it.each([
  "-",
  "K",
  "Q",
  "k",
  "q",
  "KQ",
  "Kk",
  "Kq",
  "Qk",
  "Qq",
  "kq",
  "KQk",
  "KQq",
  "Kkq",
  "Qkq",
  "KQkq",
])("accepts castling availability %j", (castlingAvailability) => {
  // Given
  const validator = new FenValidator();
  const fields = STARTING_FEN.split(" ");
  fields[2] = castlingAvailability;

  // When
  const validate = () => validator.validate(fields);

  // Then
  expect(validate).not.toThrow();
});

it.each([
  "",
  "KK",
  "QQ",
  "kk",
  "qq",
  "KQK",
  "KQkkq",
  "QK",
  "qk",
  "kK",
  "qQ",
  "A",
  "KQx",
  "--",
  "-K",
  "K-",
  " K",
  "K ",
  "K\t",
  "K\n",
])("rejects invalid castling availability %j", (castlingAvailability) => {
  // Given
  const validator = new FenValidator();
  const fields = STARTING_FEN.split(" ");
  fields[2] = castlingAvailability;

  // When
  const validate = () => validator.validate(fields);

  // Then
  expect(validate).toThrow(FenValidationError);
  expect(validate).toThrow("Castling availability must contain unique characters in KQkq order");
});

describe("en passant target square", () => {
  it("rejects an en passant target square that's longer than 2 characters", () => {
    // Given
    const validator = new FenValidator();
    const fields = STARTING_FEN.split(" ");

    // and an en passant target square that's longer than 2 characters
    fields[3] = "a44";

    // When
    const validate = () => validator.validate(fields);

    // Then
    expect(validate).toThrow(FenValidationError);
    expect(validate).toThrow("En passant target square must be two characters long");
  });

  it("rejects an en passant target square that's not a valid chess file", () => {
    // Given
    const validator = new FenValidator();
    const fields = STARTING_FEN.split(" ");

    // and an en passant target square that's not a valid chess file
    fields[3] = "i4";

    // When
    const validate = () => validator.validate(fields);

    // Then
    expect(validate).toThrow(FenValidationError);
    expect(validate).toThrow(
      "En passant target square file must be one of: a, b, c, d, e, f, g, h",
    );
  });

  it.each(["1", "2", "4", "5", "7", "8"])(
    "rejects an en passant target square that's not on rank 3 or 6",
    (invalidRank: string): void => {
      // Given
      const validator = new FenValidator();
      const fields = STARTING_FEN.split(" ");

      // and an en passant target square that's not a valid chess rank
      fields[3] = "a" + invalidRank;

      // When
      const validate = () => validator.validate(fields);

      // Then
      expect(validate).toThrow(FenValidationError);
      expect(validate).toThrow("En passant target square rank must be 3 or 6");
    },
  );

  it("rejects an en passant target square for white that isn't on rank 3", () => {
    // Given
    const validator = new FenValidator();
    const fields = STARTING_FEN.split(" ");
    fields[1] = "b";
    fields[3] = "e6";

    // When
    const validate = () => validator.validate(fields);

    // Then
    expect(validate).toThrow(FenValidationError);
    expect(validate).toThrow("En passant target square rank must be 3 when active color is black");
  });

  it("rejects an en passant target square for black that isn't on rank 6", () => {
    // Given
    const validator = new FenValidator();
    const fields = STARTING_FEN.split(" ");
    fields[1] = "w";
    fields[3] = "e3";

    // When
    const validate = () => validator.validate(fields);

    // Then
    expect(validate).toThrow(FenValidationError);
    expect(validate).toThrow("En passant target square rank must be 6 when active color is white");
  });

  it.each([
    { label: "white playing on rank 6", enPassantTargetSquare: "e6", activeColor: "w" },
    { label: "black playing on rank 3", enPassantTargetSquare: "e3", activeColor: "b" },
  ])("accepts an en passant target square for $label", ({ enPassantTargetSquare, activeColor }) => {
    // Given
    const validator = new FenValidator();
    const fields = STARTING_FEN.split(" ");
    fields[1] = activeColor;
    fields[3] = enPassantTargetSquare;

    // When
    const validate = () => validator.validate(fields);

    // Then
    expect(validate).not.toThrow();
  });
});
