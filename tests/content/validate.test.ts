import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { assertNoContentErrors, ISSUE_CODES } from "@/lib/content/issue-codes"
import type { PluginRecord } from "@/lib/content/load-plugins"
import { EMPTY_PLUGIN_MEDIA } from "@/lib/content/media"
import { CONTENT_ROOT } from "@/lib/content/paths"
import { releaseJsonSchema } from "@/lib/content/schemas"
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
  { dir: "plugin-author-unknown", code: ISSUE_CODES.PLUGIN_AUTHOR_UNKNOWN },
  { dir: "media-missing", code: ISSUE_CODES.MEDIA_MISSING },
  { dir: "media-featured-duplicate", code: ISSUE_CODES.MEDIA_FEATURED_DUPLICATE },
  { dir: "video-missing", code: ISSUE_CODES.VIDEO_MISSING },
]

describe("seed content", () => {
  it("has no validation errors", async () => {
    const result = await loadAndValidate(CONTENT_ROOT)
    expect(result.issues.filter((issue) => issue.severity === "error")).toEqual(
      []
    )
    expect(result.plugins.map((plugin) => plugin.slug)).toEqual([
      "blogg-post-plugin-for-flatsome",
      "flatsome-better-animations",
      "flatsome-breadcrumbs",
      "flatsome-ekstra-farger",
      "kafra-auto-skjema",
      "kafra-datablad",
      "kafra-produktkatalog",
      "kontingentkalkulator",
      "ux-select",
      "videogalleri",
      "wp-icons-flatsome",
      "wp-lucide-icons",
    ])
    expect(result.snippets.map((snippet) => snippet.slug)).toEqual([
      "button-improvements",
      "dropdown-menu-styling",
      "gravity-forms-styling",
    ])
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

  it("checks extra ids, zip names, hashes, and shared assets", () => {
    const plugin = makePlugin("demo")
    const release = plugin.releases[0]
    if (!release) return
    release.download = {
      sha256: "a".repeat(64),
      extras: [
        {
          id: "lite",
          label: "Lite",
          asset: "demo-1.0.0.zip",
          sha256: "not-a-hash",
        },
        { id: "lite", label: "Lite", asset: "demo-lite.tar" },
      ],
    }
    release.resolved.extras = [
      {
        id: "lite",
        label: "Lite",
        asset: "demo-1.0.0.zip",
        sha256: "not-a-hash",
        downloadUrl: "https://example.com/lite.zip",
      },
      {
        id: "lite",
        label: "Lite",
        asset: "demo-lite.tar",
        downloadUrl: "https://example.com/lite.tar",
      },
    ]

    const issues = crossValidate([plugin], [], undefined)
    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        ISSUE_CODES.EXTRA_ID_DUPLICATE,
        ISSUE_CODES.DOWNLOAD_DUPLICATE,
        ISSUE_CODES.ASSET_NOT_ZIP,
        ISSUE_CODES.SHA256_INVALID,
        ISSUE_CODES.SHA256_MISSING,
      ])
    )
  })

  it("rejects an extra id that is not kebab-case", () => {
    const parsed = releaseJsonSchema.safeParse({
      releaseDate: "2026-01-01",
      channel: "stable",
      requirements: { wordpress: { min: "6.4" }, php: { min: "8.1" } },
      download: {
        extras: [{ id: "Lite", label: "Lite", asset: "demo-lite.zip" }],
      },
    })
    expect(parsed.success).toBe(false)
  })
})

function makePlugin(slug: string): PluginRecord {
  return {
    name: slug,
    summary: "Test",
    versionScheme: "semver",
    status: "active",
    repository: { owner: "ORG", repo: slug, visibility: "public" },
    author: "benjamin",
    slug,
    file: `plugins/${slug}/plugin.json`,
    docs: { overview: "overview.mdx", installation: null, usage: null },
    releases: [makeReleaseBase(slug, "1.0.0")],
    resolvedMedia: EMPTY_PLUGIN_MEDIA,
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
      extras: [],
    },
  }
}
