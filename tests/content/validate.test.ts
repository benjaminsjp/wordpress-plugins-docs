import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { assertNoContentErrors, ISSUE_CODES } from "@/lib/content/issue-codes"
import type { PluginRecord } from "@/lib/content/load-plugins"
import { CONTENT_ROOT } from "@/lib/content/paths"
import { crossValidate, loadAndValidate } from "@/lib/content/validate"

const fixturesRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../fixtures/invalid"
)

const fixtureCases: Array<{ dir: string; code: string }> = [
  { dir: "slug-invalid", code: ISSUE_CODES.SLUG_INVALID },
  { dir: "slug-reserved", code: ISSUE_CODES.SLUG_RESERVED },
  { dir: "schema", code: ISSUE_CODES.SCHEMA },
  { dir: "release-date-future", code: ISSUE_CODES.RELEASE_DATE_FUTURE },
  { dir: "version-invalid", code: ISSUE_CODES.VERSION_INVALID },
  { dir: "version-leading-v", code: ISSUE_CODES.VERSION_LEADING_V },
  { dir: "github-owner-invalid", code: ISSUE_CODES.GITHUB_OWNER_INVALID },
  { dir: "github-repo-invalid", code: ISSUE_CODES.GITHUB_REPO_INVALID },
  { dir: "pattern-missing-version", code: ISSUE_CODES.PATTERN_MISSING_VERSION },
  {
    dir: "pattern-unknown-placeholder",
    code: ISSUE_CODES.PATTERN_UNKNOWN_PLACEHOLDER,
  },
  { dir: "asset-not-zip", code: ISSUE_CODES.ASSET_NOT_ZIP },
  { dir: "sha256-invalid", code: ISSUE_CODES.SHA256_INVALID },
  { dir: "sha256-missing", code: ISSUE_CODES.SHA256_MISSING },
  { dir: "download-duplicate", code: ISSUE_CODES.DOWNLOAD_DUPLICATE },
  { dir: "ref-missing", code: ISSUE_CODES.REF_MISSING },
  { dir: "self-dependency", code: ISSUE_CODES.SELF_DEPENDENCY },
  { dir: "min-version-invalid", code: ISSUE_CODES.MIN_VERSION_INVALID },
  { dir: "min-version-unsatisfied", code: ISSUE_CODES.MIN_VERSION_UNSATISFIED },
  { dir: "cycle-required", code: ISSUE_CODES.CYCLE_REQUIRED },
  { dir: "cycle-optional", code: ISSUE_CODES.CYCLE_OPTIONAL },
  { dir: "taxonomy-duplicate-slug", code: ISSUE_CODES.TAXONOMY_DUPLICATE_SLUG },
  { dir: "taxonomy-duplicate-label", code: ISSUE_CODES.TAXONOMY_DUPLICATE_LABEL },
  { dir: "taxonomy-too-deep", code: ISSUE_CODES.TAXONOMY_TOO_DEEP },
  { dir: "category-unknown", code: ISSUE_CODES.CATEGORY_UNKNOWN },
  { dir: "subcategory-unknown", code: ISSUE_CODES.SUBCATEGORY_UNKNOWN },
  { dir: "tag-unknown", code: ISSUE_CODES.TAG_UNKNOWN },
  { dir: "tag-unused", code: ISSUE_CODES.TAG_UNUSED },
  { dir: "overview-missing", code: ISSUE_CODES.OVERVIEW_MISSING },
  { dir: "snippet-css-empty", code: ISSUE_CODES.SNIPPET_CSS_EMPTY },
  { dir: "plugin-no-releases", code: ISSUE_CODES.PLUGIN_NO_RELEASES },
]

describe("seed content", () => {
  it("has no validation errors", async () => {
    const result = await loadAndValidate(CONTENT_ROOT)
    expect(result.issues.filter((issue) => issue.severity === "error")).toEqual(
      []
    )
    expect(result.plugins.map((plugin) => plugin.slug)).toEqual([
      "blogg-post-plugin-for-flatsome",
      "kafra-datablad",
    ])
    expect(result.snippets).toHaveLength(6)
  })
})

describe("build-time assertion", () => {
  it("throws an aggregated error list when content is broken", async () => {
    const result = await loadAndValidate(
      path.join(fixturesRoot, "overview-missing")
    )
    expect(() => assertNoContentErrors(result.issues)).toThrow(
      /Content validation failed/
    )
  })
})

describe("invalid fixtures", () => {
  it.each(fixtureCases)("reports $code for $dir", async ({ dir, code }) => {
    const result = await loadAndValidate(path.join(fixturesRoot, dir))
    expect(result.issues.map((issue) => issue.code)).toContain(code)
  })
})

describe("in-memory uniqueness", () => {
  it("reports duplicate plugin slugs that differ only by case", () => {
    const plugins = [
      makePlugin("foo"),
      { ...makePlugin("Foo"), slug: "Foo" },
    ]
    const issues = crossValidate(plugins, [], undefined)
    expect(issues.map((issue) => issue.code)).toContain(
      ISSUE_CODES.SLUG_DUPLICATE
    )
  })

  it("reports versions that collide after normalization", () => {
    const plugin = makePlugin("demo")
    plugin.releases = [
      makeRelease(plugin, "1.0.0-Beta.1"),
      makeRelease(plugin, "1.0.0-beta.1"),
    ]
    const issues = crossValidate([plugin], [], undefined)
    expect(issues.map((issue) => issue.code)).toContain(
      ISSUE_CODES.VERSION_DUPLICATE
    )
  })
})

function makePlugin(slug: string): PluginRecord {
  return {
    name: slug,
    summary: "Test",
    versionScheme: "semver",
    status: "active",
    repository: { owner: "ORG", repo: slug, visibility: "public" },
    slug,
    file: `plugins/${slug}/plugin.json`,
    docs: { overview: "overview.mdx", installation: null, usage: null },
    releases: [makeReleaseBase(slug, "1.0.0")],
  }
}

function makeRelease(plugin: PluginRecord, version: string) {
  return makeReleaseBase(plugin.slug, version)
}

function makeReleaseBase(
  slug: string,
  version: string
): PluginRecord["releases"][number] {
  const hash = "a".repeat(64)
  return {
    releaseDate: "2026-01-01",
    channel: "stable",
    requirements: { wordpress: { min: "6.0" }, php: { min: "8.1" } },
    dependencies: [],
    download: { sha256: hash },
    version,
    file: `plugins/${slug}/releases/${version}.json`,
    resolved: {
      tag: `v${version}`,
      asset: `${slug}-${version}.zip`,
      downloadUrl: "https://example.com",
      releasePageUrl: "https://example.com",
      repositoryUrl: "https://example.com",
    },
  }
}
