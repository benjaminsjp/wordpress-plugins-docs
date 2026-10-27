import { describe, expect, it } from "vitest"
import {
  buildFooterLexicon,
  latestContentDate,
} from "@/lib/content/footer-data"
import type { PluginRecord } from "@/lib/content/load-plugins"
import type { SnippetRecord } from "@/lib/content/load-snippets"

const HASH = "a".repeat(64)

function plugin(options: {
  name: string
  slug: string
  date: string
  version: string
}): PluginRecord {
  return {
    name: options.name,
    summary: "Test",
    versionScheme: "semver",
    status: "active",
    repository: {
      owner: "ORG",
      repo: options.slug,
      visibility: "public",
    },
    author: "benjamin",
    slug: options.slug,
    file: `plugins/${options.slug}/plugin.json`,
    docs: { overview: "overview.mdx", installation: null, usage: null },
    releases: [
      {
        releaseDate: options.date,
        channel: "stable",
        requirements: { wordpress: { min: "6.0" }, php: { min: "8.1" } },
        dependencies: [],
        download: { sha256: HASH },
        version: options.version,
        file: `plugins/${options.slug}/releases/${options.version}.json`,
        resolved: {
          tag: `v${options.version}`,
          asset: `${options.slug}-${options.version}.zip`,
          downloadUrl: "https://example.com",
          releasePageUrl: "https://example.com",
          repositoryUrl: "https://example.com",
        },
      },
    ],
  }
}

function snippet(options: {
  name: string
  slug: string
  updated: string
  css: string
}): SnippetRecord {
  return {
    name: options.name,
    summary: "Test",
    category: "misc",
    tags: ["spacing"],
    placement: { location: "flatsome-custom-css-all" },
    updated: options.updated,
    slug: options.slug,
    file: `snippets/${options.slug}/snippet.json`,
    css: options.css,
    cssFile: `snippets/${options.slug}/snippet.css`,
    notesFile: null,
  }
}

describe("footer data", () => {
  it("uses the newest plugin or snippet date", () => {
    const date = latestContentDate(
      [
        plugin({
          name: "Alpha",
          slug: "alpha",
          date: "2025-01-01",
          version: "1.0.0",
        }),
      ],
      [
        snippet({
          name: "Buttons",
          slug: "buttons",
          updated: "2026-03-15",
          css: ".button { color: red; }",
        }),
      ]
    )
    expect(date.toISOString().startsWith("2026-03-15")).toBe(true)
  })

  it("includes plugin names, versions and CSS selectors", () => {
    const words = buildFooterLexicon(
      [
        plugin({
          name: "Videogalleri",
          slug: "videogalleri",
          date: "2026-01-01",
          version: "1.1.1",
        }),
      ],
      [
        snippet({
          name: "Knapper",
          slug: "knapper",
          updated: "2026-01-02",
          css: ".button { color: red; }",
        }),
      ]
    )
    expect(words).toContain("Videogalleri")
    expect(words).toContain("v1.1.1")
    expect(words).toContain("Knapper")
    expect(words).toContain(".button")
    expect(words).toContain("add_action()")
  })
})
