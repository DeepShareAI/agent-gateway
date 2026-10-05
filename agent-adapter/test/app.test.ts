import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { handleRequest } from "../src/app.js";

test("demo foundation exposes health and rejects unfinished callbacks", async () => {
  const server = createServer(handleRequest);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    assert.equal((await fetch(`${base}/health`)).status, 200);
    assert.equal(
      (
        await fetch(`${base}/callback`, {
          method: "POST",
          body: "private input",
        })
      ).status,
      404,
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
