import { formatIssues } from "../lib/content/issue-codes"
import { CONTENT_ROOT } from "../lib/content/paths"
import { loadAndValidate } from "../lib/content/validate"

async function main() {
  const content = await loadAndValidate(CONTENT_ROOT)
  const errors = content.issues.filter((issue) => issue.severity === "error")
  const warnings = content.issues.filter((issue) => issue.severity === "warning")

  if (content.issues.length === 0) {
    console.log("Content is valid.")
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
