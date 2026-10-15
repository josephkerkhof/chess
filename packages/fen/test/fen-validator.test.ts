import {expect, it} from "vitest";
import {FenValidationError, FenValidator, STARTING_FEN} from "../src";

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
    {label: "seven rows", wrongPiecePlacement: "rnbqkbnr/pppppppp/8/8/8/PPPPPPPP/RNBQKBNR"},
    {label: "nine rows", wrongPiecePlacement: "rnbqkbnr/pppppppp/8/8/8/8/8/PPPPPPPP/RNBQKBNR"},
])("rejects piece placement with $label", ({wrongPiecePlacement}) => {
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