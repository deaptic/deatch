import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class ApiError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const onError: ErrorHandler = (err, c) => {
  if (err instanceof ApiError) {
    return c.json(
      { error: { code: err.code, message: err.message } },
      err.status,
    );
  }
  if (err instanceof HTTPException) {
    return c.json(
      { error: { code: "http", message: err.message } },
      err.status,
    );
  }
  console.error(err);
  return c.json(
    { error: { code: "internal", message: "internal error" } },
    500,
  );
};

export const notFound: NotFoundHandler = (c) =>
  c.json({ error: { code: "not_found", message: "not found" } }, 404);
