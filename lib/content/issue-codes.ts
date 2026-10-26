export const ISSUE_CODES = {
  SLUG_INVALID: "slug-invalid",
  SLUG_DUPLICATE: "slug-duplicate",
  SLUG_RESERVED: "slug-reserved",
  SCHEMA: "schema",
  RELEASE_DATE_FUTURE: "release-date-future",
  VERSION_INVALID: "version-invalid",
  VERSION_DUPLICATE: "version-duplicate",
  VERSION_LEADING_V: "version-leading-v",
  GITHUB_OWNER_INVALID: "github-owner-invalid",
  GITHUB_REPO_INVALID: "github-repo-invalid",
  PATTERN_MISSING_VERSION: "pattern-missing-version",
  PATTERN_UNKNOWN_PLACEHOLDER: "pattern-unknown-placeholder",
  ASSET_NOT_ZIP: "asset-not-zip",
  SHA256_INVALID: "sha256-invalid",
  SHA256_MISSING: "sha256-missing",
  DOWNLOAD_DUPLICATE: "download-duplicate",
  REF_MISSING: "ref-missing",
  SELF_DEPENDENCY: "self-dependency",
  MIN_VERSION_INVALID: "min-version-invalid",
  MIN_VERSION_UNSATISFIED: "min-version-unsatisfied",
  CYCLE_REQUIRED: "cycle-required",
  CYCLE_OPTIONAL: "cycle-optional",
  TAXONOMY_DUPLICATE_SLUG: "taxonomy-duplicate-slug",
  TAXONOMY_DUPLICATE_LABEL: "taxonomy-duplicate-label",
  TAXONOMY_TOO_DEEP: "taxonomy-too-deep",
  CATEGORY_UNKNOWN: "category-unknown",
  SUBCATEGORY_UNKNOWN: "subcategory-unknown",
  TAG_UNKNOWN: "tag-unknown",
  TAG_UNUSED: "tag-unused",
  OVERVIEW_MISSING: "overview-missing",
  SNIPPET_CSS_EMPTY: "snippet-css-empty",
  SNIPPET_TOKEN_MISSING: "snippet-token-missing",
  SNIPPET_TOKEN_DUPLICATE: "snippet-token-duplicate",
  SNIPPET_TOKEN_OVERLAP: "snippet-token-overlap",
  PLUGIN_NO_RELEASES: "plugin-no-releases",
  PLACEMENT_NOTES_REQUIRED: "placement-notes-required",
  SNIPPET_MEDIA_IN_SCOPED_PLACEMENT: "snippet-media-in-scoped-placement",
  GITHUB_TAG_MISSING: "github-tag-missing",
  GITHUB_ASSET_MISSING: "github-asset-missing",
  GITHUB_DIGEST_MISMATCH: "github-digest-mismatch",
  GITHUB_DIGEST_MISSING: "github-digest-missing",
  GITHUB_VISIBILITY_MISMATCH: "github-visibility-mismatch",
  GITHUB_REPO_UNAVAILABLE: "github-repo-unavailable",
  GITHUB_API_ERROR: "github-api-error",
  GITHUB_RELEASE_DRAFT: "github-release-draft",
  GITHUB_PRERELEASE_STABLE: "github-prerelease-stable",
  RELEASE_DELETED: "release-deleted",
  RELEASE_RENAMED: "release-renamed",
  RELEASE_IMMUTABLE_FIELD: "release-immutable-field",
} as const

export type IssueCode = (typeof ISSUE_CODES)[keyof typeof ISSUE_CODES]

export type IssueSeverity = "error" | "warning"

export type Issue = {
  code: IssueCode
  severity: IssueSeverity
  message: string
  file: string
  path?: string
}

export function formatIssues(issues: Issue[]): string {
  return issues
    .map((issue) => {
      const location = issue.path ? `${issue.file}  ${issue.path}` : issue.file
      return `${issue.severity}  ${issue.code}  ${location}  ${issue.message}`
    })
    .join("\n")
}

export function assertNoContentErrors(issues: Issue[]): void {
  const errors = issues.filter((issue) => issue.severity === "error")

  if (errors.length > 0) {
    throw new Error(`Content validation failed:\n${formatIssues(errors)}`)
  }
}
