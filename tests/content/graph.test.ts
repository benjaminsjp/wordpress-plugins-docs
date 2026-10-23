import { describe, expect, it } from "vitest"
import { buildPluginGraph, collectGraphIssues } from "@/lib/content/graph"
import { ISSUE_CODES } from "@/lib/content/issue-codes"
import type { PluginRecord } from "@/lib/content/load-plugins"

const HASH = "a".repeat(64)

function plugin(options: {
  slug: string
  scheme?: PluginRecord["versionScheme"]
  releases: Array<{
    version: string
    channel?: "stable" | "beta"
    dependencies?: PluginRecord["releases"][number]["dependencies"]
  }>
}): PluginRecord {
  return {
    name: options.slug,
    summary: "Test plugin",
    versionScheme: options.scheme ?? "semver",
    status: "active",
    repository: {
      owner: "ORG",
      repo: options.slug,
      visibility: "public",
    },
    slug: options.slug,
    file: `plugins/${options.slug}/plugin.json`,
    docs: { overview: "overview.mdx", installation: null, usage: null },
    releases: options.releases.map((release) => ({
      releaseDate: "2026-01-01",
      channel: release.channel ?? "stable",
      requirements: {
        wordpress: { min: "6.0" },
        php: { min: "8.1" },
      },
      dependencies: release.dependencies ?? [],
      download: { sha256: HASH },
      version: release.version,
      file: `plugins/${options.slug}/releases/${release.version}.json`,
      resolved: {
        tag: `v${release.version}`,
        asset: `${options.slug}-${release.version}.zip`,
        downloadUrl: "https://example.com",
        releasePageUrl: "https://example.com",
        repositoryUrl: "https://example.com",
      },
    })),
  }
}

describe("plugin graph", () => {
  it("derives dependents from the latest release", () => {
    const plugins = [
      plugin({ slug: "agency-core", scheme: "dotted", releases: [{ version: "2.1" }] }),
      plugin({
        slug: "badges",
        releases: [
          {
            version: "1.2.0",
            dependencies: [
              { plugin: "agency-core", type: "required", minVersion: "2.0" },
            ],
          },
          {
            version: "1.3.0",
            dependencies: [
              { plugin: "agency-core", type: "required", minVersion: "2.1" },
            ],
          },
        ],
      }),
    ]

    const graph = buildPluginGraph(plugins)
    expect(graph.dependents.get("agency-core")).toEqual(["badges"])
    expect(graph.edges).toEqual([
      expect.objectContaining({
        from: "badges",
        to: "agency-core",
        minVersion: "2.1",
      }),
    ])
  })

  it("reports a required dependency cycle", () => {
    const issues = collectGraphIssues([
      plugin({
        slug: "alpha",
        releases: [
          {
            version: "1.0.0",
            dependencies: [{ plugin: "beta", type: "required" }],
          },
        ],
      }),
      plugin({
        slug: "beta",
        releases: [
          {
            version: "1.0.0",
            dependencies: [{ plugin: "alpha", type: "required" }],
          },
        ],
      }),
    ])

    expect(issues.map((issue) => issue.code)).toContain(
      ISSUE_CODES.CYCLE_REQUIRED
    )
  })

  it("warns on an optional dependency cycle", () => {
    const issues = collectGraphIssues([
      plugin({
        slug: "alpha",
        releases: [
          {
            version: "1.0.0",
            dependencies: [{ plugin: "beta", type: "optional" }],
          },
        ],
      }),
      plugin({
        slug: "beta",
        releases: [
          {
            version: "1.0.0",
            dependencies: [{ plugin: "alpha", type: "optional" }],
          },
        ],
      }),
    ])

    expect(issues.map((issue) => issue.code)).toContain(
      ISSUE_CODES.CYCLE_OPTIONAL
    )
  })
})
