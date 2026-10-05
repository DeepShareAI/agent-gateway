import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const child = spawn(
  process.execPath,
  [
    "node_modules/wrangler/bin/wrangler.js",
    "dev",
    "--config",
    "relay/wrangler.toml",
    "--env",
    "local",
    "--port",
    "18787",
    "--ip",
    "127.0.0.1",
  ],
  {
    stdio: "ignore",
    windowsHide: true,
    env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
  },
);
child.on("error", () => {});
try {
  let health;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch("http://127.0.0.1:18787/health", {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) {
        health = await response.json();
        break;
      }
    } catch {
      /* Runtime still starting. */
    }
    await sleep(500);
  }
  assert.equal(health?.service, "agent-gateway-relay");
  assert.equal(health.sourceAccessEnabled, false);
  assert.equal(
    (await fetch("http://127.0.0.1:18787/v1/requests", { method: "POST" }))
      .status,
    404,
  );
  assert.equal(
    (await fetch("http://127.0.0.1:18787/health", { method: "POST" })).status,
    405,
  );
  console.log("Actual local Cloudflare Worker runtime integration passed");
} finally {
  if (child.pid && process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
        windowsHide: true,
      });
    } catch {
      /* Already exited. */
    }
  } else {
    child.kill("SIGTERM");
  }
}
