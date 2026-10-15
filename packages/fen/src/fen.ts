export class Fen {
  private readonly value: string;

  constructor(value: string) {
    this.value = value;
    this.validate();
  }

  toString(): string {
    return this.value;
  }

  private validate(): void {
    // TODO: Parse and validate the six FEN fields.
  }
}
