export const GameColor = {
  White: "white",
  Black: "black",
} as const;
export type GameColor = (typeof GameColor)[keyof typeof GameColor];

export const GameStatus = {
  Pending: "pending",
  Active: "active",
  Abandoned: "abandoned",
  Completed: "completed",
} as const;
export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];
