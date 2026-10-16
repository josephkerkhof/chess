# @chess/core

Shared chess domain primitives. The package exports ESM TypeScript source and has
no runtime dependencies.

`CHESS_FILES` contains the file letters `a` through `h`, and `CHESS_RANKS` contains
the numbers 1 through 8. `ChessFile` and `ChessRank` are the corresponding literal
unions.

`CHESS_PIECE_TYPES` contains the full names `king`, `queen`, `rook`, `bishop`,
`knight`, and `pawn`, with `ChessPieceType` as the corresponding literal union.
`CHESS_COLORS` contains `white` and `black`, with `ChessColor` as its literal union.
Formatters can translate these internal values into notation-specific symbols.

`ChessSquare` combines a file and rank. `ChessPiecePlacement` combines a piece type
and square. `ChessMove` records a color and the moving piece's `from` and `to`
placements. A promotion is represented by a pawn in `from.piece` and its promoted
piece type in `to.piece`.

All square, placement, and move properties are readonly. These types provide
compile-time checks; they do not freeze objects, validate input at runtime, or
check move legality.

Add `"@chess/core": "workspace:*"` to a consuming package's dependencies and run
`pnpm install` from the repository root.

```ts
import type { ChessMove } from "@chess/core";

const move: ChessMove = {
  color: "black",
  from: { piece: "pawn", square: { file: "e", rank: 7 } },
  to: { piece: "pawn", square: { file: "e", rank: 5 } },
};
```

Run `pnpm --filter @chess/core typecheck` to check this package. The repository's
`pnpm typecheck` includes it as well.
