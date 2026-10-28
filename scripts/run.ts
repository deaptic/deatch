import { spawn } from "node:child_process";

export type Command = readonly [string, ...string[]];

export function run([command, ...args]: Command): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(command, args, { stdio: "inherit" })
      .on("error", reject)
      .on("exit", (code, signal) => {
        if (code === 0) return resolve();
        const how = signal ? `was killed by ${signal}` : `exited with ${code}`;
        reject(new Error(`${[command, ...args].join(" ")} ${how}`));
      });
  });
}
