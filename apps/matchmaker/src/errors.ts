import { z } from "zod";
import type { AppContext } from "./types";

export const ServerErrorResponse = z.object({
  success: z.literal(false),
  message: z.string(),
});

export function handleError(error: Error, c: AppContext) {
  console.error("Unhandled request error", error);

  return c.json(
    {
      success: false,
      message: "Something went wrong. Please try again.",
    },
    500,
  );
}
