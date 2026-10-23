import { createGitHubClient } from "../lib/content/github-verify"
import { NewReleaseError, scaffoldRelease } from "../lib/content/new-release"
import { CONTENT_ROOT } from "../lib/content/paths"
import { loadAndValidate } from "../lib/content/validate"

async function main() {
  const [slug, version] = process.argv.slice(2)

  if (!slug || !version) {
    console.error("Usage: npm run new-release -- <slug> <version>")
    process.exitCode = 1
    return
  }

  const content = await loadAndValidate(CONTENT_ROOT)
  const errors = content.issues.filter((issue) => issue.severity === "error")
  if (errors.length > 0) {
    console.error("Fix content validation errors before scaffolding a release.")
    process.exitCode = 1
    return
  }

  try {
    const token = process.env.GITHUB_TOKEN?.trim() || undefined
    const result = await scaffoldRelease({
      slug,
      version,
      plugins: content.plugins,
      token,
      client: createGitHubClient({ token }),
    })

    console.log(`Wrote ${result.file}`)
    for (const warning of result.warnings) {
      console.warn(warning)
    }
  } catch (error) {
    const message =
      error instanceof NewReleaseError
        ? error.message
        : error instanceof Error
          ? error.message
          : String(error)
    console.error(message)
    process.exitCode = 1
  }
}

void main()
