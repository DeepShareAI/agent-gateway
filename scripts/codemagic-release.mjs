import { writeFile } from "node:fs/promises";
import { runBuild } from "./codemagic-client.mjs";

for (const name of [
  "CM_API_TOKEN",
  "CM_APP_ID",
  "RELEASE_BRANCH",
  "EXPECTED_REVISION",
  "RELAY_URL",
]) {
  if (!process.env[name]) throw new Error(`Missing ${name}`);
}
if (!/^[a-f0-9]{40}$/.test(process.env.EXPECTED_REVISION))
  throw new Error("Expected a full commit SHA");
if (new URL(process.env.RELAY_URL).protocol !== "https:")
  throw new Error("Relay must use HTTPS");
const results = await Promise.allSettled(
  ["ios-release"].map((workflow) =>
    runBuild({
      appId: process.env.CM_APP_ID,
      token: process.env.CM_API_TOKEN,
      workflow,
      branch: process.env.RELEASE_BRANCH,
      revision: process.env.EXPECTED_REVISION,
      relayUrl: process.env.RELAY_URL,
    }),
  ),
);
const report = results.map((result) =>
  result.status === "fulfilled"
    ? result.value
    : { status: "failed", message: result.reason.message },
);
await writeFile("delivery-report.json", JSON.stringify(report, null, 2));
if (results.some((result) => result.status === "rejected"))
  throw new Error("Mobile delivery failed; see sanitized delivery report");
console.log(
  "Signed iOS workflow and TestFlight publishing completed. Android delivery is deferred. Verify tester installation separately.",
);
