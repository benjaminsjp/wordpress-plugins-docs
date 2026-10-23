import { createGitHubClient, verifyGitHubReleases } from "../lib/content/github-verify"
import { formatIssues } from "../lib/content/issue-codes"
import { CONTENT_ROOT } from "../lib/content/paths"
import { loadAndValidate } from "../lib/content/validate"

async function main() {
  const token = process.env.GITHUB_TOKEN?.trim()
  if (!token) {
    if (process.env.CI) {
      console.error(
        "GITHUB_TOKEN is required in CI. Add the PLUGIN_GITHUB_TOKEN Actions secret and map it to GITHUB_TOKEN for this step."
      )
      process.exitCode = 1
      return
    }

    console.log(
      "GITHUB_TOKEN is not set. Skipping GitHub release verification."
    )
    return
  }

  const content = await loadAndValidate(CONTENT_ROOT)
  const issues = await verifyGitHubReleases(
    content.plugins,
    createGitHubClient({ token })
  )

  const errors = issues.filter((issue) => issue.severity === "error")
  const warnings = issues.filter((issue) => issue.severity === "warning")

  if (issues.length === 0) {
    console.log("GitHub releases match the recorded metadata.")
    return
  }

  if (warnings.length > 0) {
    console.log(formatIssues(warnings))
  }
  if (errors.length > 0) {
    if (warnings.length > 0) {
      console.log("")
    }
    console.error(formatIssues(errors))
    process.exitCode = 1
    return
  }

  console.log(
    `\n${warnings.length} warning${warnings.length === 1 ? "" : "s"}, no errors.`
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
