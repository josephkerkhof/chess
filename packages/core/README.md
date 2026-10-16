# @chess/core

Shared chess domain primitives. The package exports ESM TypeScript source and has
no runtime dependencies.

`CHESS_FILES` and `CHESS_RANKS` contain the file and rank characters used in chess
notation. `ChessFile` and `ChessRank` are the corresponding string literal unions.
These types provide compile-time checks; they do not validate input at runtime.

`CHESS_PIECE_TYPES` contains `K`, `Q`, `R`, `B`, `N`, and `P`, with `ChessPieceType`
as the corresponding literal union. These values identify piece types independently
of color. `P` identifies a pawn internally; algebraic move notation omits that letter.

Add `"@chess/core": "workspace:*"` to a consuming package's dependencies and run
`pnpm install` from the repository root.

```ts
import { CHESS_FILES, CHESS_RANKS } from "@chess/core";
import type { ChessFile, ChessRank } from "@chess/core";
```

Run `pnpm --filter @chess/core typecheck` to check this package. The repository's
`pnpm typecheck` includes it as well.
