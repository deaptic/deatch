import { commands } from "../../bindings.ts";
import type { GetUsersParams, User } from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export function fetchUsers(
  params: GetUsersParams,
  options?: InvokeOptions,
): Promise<User[]> {
  return invokeCommand(commands.getUsers, [params], options);
}
