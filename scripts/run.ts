import { spawn } from "node:child_process";

export function run(cmd: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(cmd[0], cmd.slice(1), { stdio: "inherit" })
      .on("error", reject)
      .on("exit", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${cmd.join(" ")} exited with ${code}`));
      });
  });
}
