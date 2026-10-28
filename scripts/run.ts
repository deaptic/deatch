import { spawn } from "node:child_process";

export type Command = readonly [string, ...string[]];

export function run([command, ...args]: Command): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(command, args, { stdio: "inherit" })
      .on("error", reject)
      .on("exit", (code) => {
        if (code === 0) resolve();
        else
          reject(
            new Error(`${[command, ...args].join(" ")} exited with ${code}`),
          );
      });
  });
}
