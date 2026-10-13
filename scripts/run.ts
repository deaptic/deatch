export async function run(cmd: string[]): Promise<void> {
  const p = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: "inherit",
    stderr: "inherit",
  });
  const { code } = await p.output();
  if (code !== 0) throw new Error(`${cmd.join(" ")} exited with ${code}`);
}
