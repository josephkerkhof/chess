import { expect, it } from "vitest";
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
