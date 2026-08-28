import { execFileSync } from "node:child_process";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, statSync } from "node:fs";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const binaryExtensions = new Set([
  ".avi",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".mkv",
  ".mov",
  ".mp4",
  ".pdf",
  ".png",
  ".webp",
  ".woff",
  ".woff2",
  ".zip",
]);

const apiKeyPrefix = ["s", "k", "-"].join("");
const rules = [
  {
    name: "DeepSeek/OpenAI-style API key",
    pattern: new RegExp(`${apiKeyPrefix}[A-Za-z0-9_-]{20,}`, "g"),
  },
  {
    name: "GitHub access token",
    pattern: new RegExp(`g${"h"}[pousr]_[A-Za-z0-9]{30,}`, "g"),
  },
  {
    name: "AWS access key ID",
    pattern: new RegExp(`A${"KIA"}[A-Z0-9]{16}`, "g"),
  },
  {
    name: "PEM private key",
    pattern: new RegExp(`BEGIN (?:RSA |EC |OPENSSH )?PRIVATE ${"KEY"}`, "g"),
  },
  {
    name: "EVM private key assignment",
    pattern: new RegExp(
      String.raw`(?:PRIVATE_KEY|privateKey)\s*[:=]\s*["'](?:0x)?[a-fA-F0-9]{64}["']`,
      "g",
    ),
  },
];

const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
  cwd: repositoryRoot,
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean);

const findings = [];

for (const relativePath of trackedFiles) {
  if (binaryExtensions.has(extname(relativePath).toLowerCase())) continue;

  const absolutePath = new URL(
    relativePath.replaceAll("\\", "/"),
    new URL("../", import.meta.url),
  );
  // `git ls-files` still includes an index entry while a tracked file is
  // deleted in the working tree. Skip it locally; after commit it disappears
  // from the tracked-file list entirely.
  if (!existsSync(absolutePath)) continue;
  if (statSync(absolutePath).size > 2_000_000) continue;

  const contents = readFileSync(absolutePath, "utf8");
  if (contents.includes("\0")) continue;

  for (const rule of rules) {
    for (const match of contents.matchAll(rule.pattern)) {
      const line = contents.slice(0, match.index).split("\n").length;
      findings.push({ file: relativePath, line, rule: rule.name });
    }
  }
}

if (findings.length > 0) {
  console.error("Potential committed secrets detected (values redacted):");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} — ${finding.rule}`);
  }
  process.exit(1);
}

console.log(`Secret check passed for ${trackedFiles.length} tracked files.`);
