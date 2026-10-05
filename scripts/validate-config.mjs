import { readFileSync } from "node:fs";
import { parseDocument } from "yaml";

for (const path of [
  "compose.yaml",
  "codemagic.yaml",
  ".github/workflows/ci.yml",
  ".github/workflows/release.yml",
]) {
  const document = parseDocument(readFileSync(path, "utf8"));
  if (document.errors.length)
    throw new Error(
      `${path}: ${document.errors.map((error) => error.message).join("; ")}`,
    );
  console.log(`${path}: valid YAML`);
}
