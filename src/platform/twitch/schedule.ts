import { commands } from "../bindings.ts";
import type {
  GetSchedulesParams,
  ScheduledStream,
} from "../../shared/types/index.ts";
import { invokeCommand, type InvokeOptions } from "../invoke.ts";

export function getSchedules(
  params: GetSchedulesParams,
  options?: InvokeOptions,
): Promise<ScheduledStream[]> {
  return invokeCommand(commands.getSchedules, [params], options);
}
