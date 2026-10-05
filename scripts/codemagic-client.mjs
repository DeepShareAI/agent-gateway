const running = new Set([
  "initializing",
  "queued",
  "preparing",
  "fetching",
  "testing",
  "building",
  "publishing",
  "finishing",
]);

export function buildOutcome(build, { appId, workflow, revision }) {
  if (build.app_id !== appId || build.workflow?.id !== workflow)
    throw new Error("Codemagic build identity mismatch");
  if (build.commit?.hash && build.commit.hash !== revision)
    throw new Error("Codemagic fetched a different commit");
  if (running.has(build.status)) return "pending";
  if (build.status !== "finished")
    throw new Error(`Codemagic build ended: ${build.status}`);
  if (build.commit?.hash !== revision)
    throw new Error("Completed build has no matching revision");
  const extension = workflow === "android-release" ? ".aab" : ".ipa";
  if (!build.artifacts?.some((artifact) => artifact.name.endsWith(extension)))
    throw new Error("Signed mobile artifact missing");
  if (workflow === "ios-release") {
    if (["failed", "timeout"].includes(build.app_store_connect_status))
      throw new Error("TestFlight post-processing failed");
    // Fail closed: upload completion alone does not establish distribution completion.
    if (build.app_store_connect_status !== "finished") return "pending";
  }
  return "finished";
}

export async function runBuild({
  appId,
  token,
  workflow,
  branch,
  revision,
  relayUrl,
  fetchImpl = fetch,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  attempts = 360,
}) {
  const headers = { "x-auth-token": token, "Content-Type": "application/json" };
  async function api(path, options = {}) {
    const response = await fetchImpl(`https://codemagic.io/api/v3${path}`, {
      ...options,
      headers,
      redirect: "error",
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) {
      const error = new Error(`Codemagic API returned HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return (await response.json()).data;
  }
  const started = await api(`/apps/${encodeURIComponent(appId)}/builds`, {
    method: "POST",
    body: JSON.stringify({
      workflow_id: workflow,
      branch,
      environment: {
        variables: { EXPECTED_REVISION: revision, RELAY_URL: relayUrl },
      },
    }),
  });
  if (!/^[a-f0-9]{24}$/.test(started?.id ?? ""))
    throw new Error("Invalid Codemagic build ID");
  console.log(`${workflow}: accepted build ${started.id}`);
  for (let attempt = 0; attempt < attempts; attempt++) {
    let build;
    try {
      build = await api(`/builds/${started.id}`);
    } catch (error) {
      // The v3 API explicitly allows a short eventual-consistency window after acceptance.
      if (error.status === 404 && attempt < 5) {
        await sleep(30000);
        continue;
      }
      throw error;
    }
    if (build.id !== started.id)
      throw new Error("Codemagic response build ID mismatch");
    if (buildOutcome(build, { appId, workflow, revision }) === "finished") {
      return {
        workflow,
        buildId: started.id,
        revision,
        status: "finished",
        distribution:
          workflow === "ios-release"
            ? "testflight-processing-finished"
            : "google-play-internal-upload-finished",
      };
    }
    await sleep(30000);
  }
  throw new Error(
    `${workflow}: timed out waiting for build/distribution completion (${started.id})`,
  );
}
