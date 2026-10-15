import { FenValidationError } from "./errors/fen-validation-error";

export class FenValidator {
  public validate(fields: readonly string[]): void {
    this.validateFieldCount(fields);
    // TODO add more checks
  }

  private validateFieldCount(fields: readonly string[]): void {
    if (fields.length !== 6) {
      throw new FenValidationError("FEN must contain exactly six fields");
    }
  }
}
