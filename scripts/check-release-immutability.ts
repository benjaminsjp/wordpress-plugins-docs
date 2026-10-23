import { execFileSync } from "node:child_process"
import {
  compareReleaseIdentities,
  identitiesFromContentFiles,
  isReleaseContentPath,
} from "../lib/content/release-immutability"
import { formatIssues } from "../lib/content/issue-codes"

function git(args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8" }).trim()
}

function gitOrNull(args: string[]): string | null {
  try {
    return git(args)
  } catch {
    return null
  }
}

function resolveBaseSha(): string | null {
  const fromEnv = process.env.GITHUB_BASE_SHA?.trim()
  if (fromEnv && !/^0+$/.test(fromEnv)) {
    return fromEnv
  }

  const baseRef = process.env.GITHUB_BASE_REF?.trim()
  if (baseRef) {
    return gitOrNull(["rev-parse", `origin/${baseRef}`])
      ?? gitOrNull(["rev-parse", baseRef])
  }

  return (
    gitOrNull(["rev-parse", "origin/main"]) ??
    gitOrNull(["rev-parse", "main"]) ??
    gitOrNull(["rev-parse", "HEAD^"])
  )
}

function listContentFiles(sha: string): Map<string, string> {
  const names = git(["ls-tree", "-r", "--name-only", sha])
    .split(/\r?\n/)
    .filter((file) => {
      const posix = file.replaceAll("\\", "/")
      return isReleaseContentPath(posix) || /\/plugin\.json$/.test(posix)
    })

  const files = new Map<string, string>()
  for (const file of names) {
    const contents = gitOrNull(["show", `${sha}:${file}`])
    if (contents !== null) {
      files.set(file.replaceAll("\\", "/"), contents)
    }
  }
  return files
}

function listRenames(baseSha: string, headSha: string): Array<{ from: string; to: string }> {
  const output = gitOrNull([
    "diff",
    "--name-status",
    "--find-renames",
    "--diff-filter=R",
    `${baseSha}...${headSha}`,
  ])
  if (!output) return []

  const renamed: Array<{ from: string; to: string }> = []
  for (const line of output.split(/\r?\n/)) {
    const match = /^(?:R\d+)\t(.+)\t(.+)$/.exec(line)
    if (!match || !match[1] || !match[2]) continue
    const from = match[1].replaceAll("\\", "/")
    const to = match[2].replaceAll("\\", "/")
    if (isReleaseContentPath(from) || isReleaseContentPath(to)) {
      renamed.push({ from, to })
    }
  }
  return renamed
}

function main() {
  if (gitOrNull(["rev-parse", "--is-inside-work-tree"]) !== "true") {
    console.log("Not a git repository. Skipping release immutability check.")
    return
  }

  const baseSha = resolveBaseSha()
  const headSha = gitOrNull(["rev-parse", "HEAD"])
  if (!baseSha || !headSha) {
    console.log("Could not resolve git base/HEAD. Skipping release immutability check.")
    return
  }

  if (baseSha === headSha) {
    console.log("No commits to compare. Skipping release immutability check.")
    return
  }

  const issues = compareReleaseIdentities({
    base: identitiesFromContentFiles(listContentFiles(baseSha)),
    head: identitiesFromContentFiles(listContentFiles(headSha)),
    renamed: listRenames(baseSha, headSha),
  })

  if (issues.length === 0) {
    console.log("Release files are immutable relative to the base revision.")
    return
  }

  console.error(formatIssues(issues))
  process.exitCode = 1
}

try {
  main()
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
