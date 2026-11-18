import { describe, expect, it } from "vitest"
import type { PluginRecord } from "@/lib/content/load-plugins"
import { EMPTY_PLUGIN_MEDIA } from "@/lib/content/media"
import { breadcrumbTrail, listLatestReleases, type NavData } from "@/lib/nav"

const nav: NavData = {
  plugins: [
    {
      slug: "blogg-post-plugin-for-flatsome",
      name: "Blogg filter (ACF + Polylang)",
      href: "/plugins/blogg-post-plugin-for-flatsome",
    },
  ],
  snippets: [{ slug: "header-nav", name: "Header-navigasjon", href: "/css/header-nav" }],
  tags: [{ slug: "responsiv", label: "Responsiv", href: "/css/tag/responsiv" }],
  categories: [
    {
      slug: "header",
      label: "Header",
      href: "/css/category/header",
      count: 1,
      subcategories: [
        {
          slug: "navigasjon",
          label: "Navigasjon",
          href: "/css/category/header/navigasjon",
          count: 1,
        },
      ],
    },
  ],
  snippetLocations: {
    "header-nav": { category: "header", subcategory: "navigasjon" },
  },
  pluginCount: 1,
  snippetCount: 1,
}

describe("breadcrumbTrail", () => {
  it("builds trails for plugins, snippets, and taxonomy pages", () => {
    expect(breadcrumbTrail("/", nav).map((item) => item.label)).toEqual(["Hjem"])
    expect(
      breadcrumbTrail("/plugins/blogg-post-plugin-for-flatsome", nav).map(
        (item) => item.label
      )
    ).toEqual(["Hjem", "Plugins", "Blogg filter (ACF + Polylang)"])
    expect(breadcrumbTrail("/css/header-nav", nav).map((item) => item.label)).toEqual([
      "Hjem",
      "CSS-snippets",
      "Header",
      "Navigasjon",
      "Header-navigasjon",
    ])
    expect(breadcrumbTrail("/css/tag/responsiv", nav).map((item) => item.label)).toEqual([
      "Hjem",
      "CSS-snippets",
      "Responsiv",
    ])
  })
})

function plugin(options: {
  slug: string
  name?: string
  releases: Array<{
    version: string
    releaseDate: string
    yanked?: boolean
  }>
}): PluginRecord {
  return {
    name: options.name ?? options.slug,
    summary: "Test plugin",
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
    resolvedMedia: EMPTY_PLUGIN_MEDIA,
    releases: options.releases.map((release) => ({
      releaseDate: release.releaseDate,
      channel: "stable",
      yanked: release.yanked ? { reason: "Broken download" } : undefined,
      requirements: {
        wordpress: { min: "6.0" },
        php: { min: "8.1" },
      },
      dependencies: [],
      version: release.version,
      file: `plugins/${options.slug}/releases/${release.version}.json`,
      resolved: {
        tag: `v${release.version}`,
        asset: `${options.slug}-${release.version}.zip`,
        downloadUrl: "https://example.com",
        releasePageUrl: "https://example.com",
        repositoryUrl: "https://example.com",
        extras: [],
      },
    })),
  }
}

describe("listLatestReleases", () => {
  const plugins = [
    plugin({
      slug: "alpha",
      name: "Alpha",
      releases: [
        { version: "1.0.0", releaseDate: "2026-11-01" },
        { version: "1.2.0", releaseDate: "2026-11-01" },
        { version: "2.0.0", releaseDate: "2026-11-20", yanked: true },
      ],
    }),
    plugin({
      slug: "beta",
      name: "Beta",
      releases: [
        { version: "1.0.0", releaseDate: "2026-10-01" },
        { version: "1.1.0", releaseDate: "2026-11-17" },
      ],
    }),
    plugin({
      slug: "gamma",
      name: "Gamma",
      releases: [{ version: "1.0.0", releaseDate: "2026-11-10" }],
    }),
  ]

  it("lists one latest release per plugin, newest date first, then applies the limit", () => {
    const labels = (limit?: number) =>
      listLatestReleases(plugins, limit).map(
        (item) => `${item.pluginSlug}@${item.version}`
      )

    expect(labels()).toEqual(["beta@1.1.0", "gamma@1.0.0", "alpha@1.2.0"])
    expect(labels(2)).toEqual(["beta@1.1.0", "gamma@1.0.0"])
  })
})
