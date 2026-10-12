import type { MiddlewareHandler } from "hono";
import { ApiError } from "../errors.ts";
import type { Identity, ValidateToken } from "./twitch.ts";

export type AuthEnv = { Variables: { identity: Identity } };

const BEARER = /^Bearer (\S+)$/;

export function requireAuth(
  validate: ValidateToken,
): MiddlewareHandler<AuthEnv> {
  return async (c, next) => {
    const token = c.req.header("Authorization")?.match(BEARER)?.[1];
    if (!token) {
      throw new ApiError(401, "unauthorized", "missing bearer token");
    }
    const validation = await validate(token);
    if (!validation) {
      throw new ApiError(401, "unauthorized", "invalid token");
    }
    c.set("identity", validation.identity);
    await next();
  };
}
