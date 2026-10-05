import { spawnSync } from "node:child_process";

const result = spawnSync(
  "docker",
  ["compose", "up", "--build", "--wait", "--wait-timeout", "180"],
  { encoding: "utf8", timeout: 300000, maxBuffer: 20 * 1024 * 1024 },
);
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
if (result.status !== 0) {
  const logs = spawnSync(
    "docker",
    ["compose", "logs", "--no-color", "--tail", "40"],
    { encoding: "utf8", timeout: 30000 },
  );
  const detail = [
    result.error?.message,
    result.stdout,
    result.stderr,
    logs.stdout,
    logs.stderr,
  ]
    .filter(Boolean)
    .join("\n");
  process.stderr.write(logs.stdout ?? "");
  // This stack has mock credentials only. Public CI annotations let contributors
  // diagnose container failures without downloading authenticated job logs.
  if (process.env.GITHUB_ACTIONS === "true") {
    const annotation = detail
      .slice(-3500)
      .replaceAll("%", "%25")
      .replaceAll("\r", "%0D")
      .replaceAll("\n", "%0A");
    console.log(`::error title=Local Compose startup failed::${annotation}`);
  }
  process.exitCode = 1;
}
