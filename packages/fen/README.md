# @chess/fen

A shared TypeScript package for standard chess Forsyth-Edwards Notation (FEN).
The package exports ESM TypeScript source, matching `@chess/shared`, and depends
on `@chess/core` for shared chess files and ranks. It uses the workspace's
TypeScript compiler.

This is a scaffold: parsing, serialization, and runtime validation are not
implemented yet.

## Use in a workspace package

Add `"@chess/fen": "workspace:*"` to the consuming package's dependencies and run
`pnpm install` from the repository root.

```ts
import { STARTING_FEN } from "@chess/fen";
import type { FenPosition } from "@chess/fen";

const initialPosition: FenPosition = {
  piecePlacement: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
  activeColor: "w",
  castlingAvailability: ["K", "Q", "k", "q"],
  enPassantTarget: null,
  halfmoveClock: 0,
  fullmoveNumber: 1,
};
```

`STARTING_FEN` is the standard initial position as a string. `FenPosition`
describes the six fields as structured data, with an empty castling array and a
`null` en passant target representing the `-` sentinels. Its types alone do not
guarantee valid rank widths, unique castling rights, or valid move counters.

## Development

```sh
pnpm --filter @chess/fen typecheck
pnpm --filter @chess/fen test
```

The repository's `pnpm typecheck` also checks this package. No build step is
needed for workspace consumers that bundle TypeScript source.

## Next steps

- Add a parser and serializer for the six standard FEN fields, with tests for
  rank widths, field values, counters, and round trips.
- Add a non-throwing validator with field-specific errors and a branded `Fen`
  string type. Separate notation validation from chess position legality.
- Expose an `isFen(value: unknown): value is Fen` predicate for a future Zod
  custom field. Keep Zod in the consuming application or an optional adapter.
- Use that validator for `GameResponse.fen` in
  `apps/matchmaker/src/types.ts` once runtime validation is implemented.

Initial scope is standard chess FEN. Chess960 dialects and EPD extensions can be
added separately when needed.

Reference: [FEN specification, section 16.1](https://www.saremba.de/chessgml/standards/pgn/pgn-complete.htm#c16.1).
