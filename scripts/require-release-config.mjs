for (const name of [
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
  "RELAY_URL",
  "STAGING_RELAY_URL",
  "CM_API_TOKEN",
  "CM_APP_ID",
]) {
  if (!process.env[name])
    throw new Error(
      `Configure ${name} in the GitHub production environment before releasing.`,
    );
}
if (
  [process.env.RELAY_URL, process.env.STAGING_RELAY_URL].some(
    (url) => new URL(url).protocol !== "https:",
  )
)
  throw new Error("RELAY_URL must use HTTPS.");
