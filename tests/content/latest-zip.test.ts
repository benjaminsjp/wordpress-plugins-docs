import { describe, expect, it } from "vitest"
import {
  getLatestZipRedirects,
  latestZipPath,
  latestZipRedirectsFromPlugins,
} from "@/lib/content/latest-zip"
import { loadPlugins } from "@/lib/content/load-plugins"
import { getContentPaths } from "@/lib/content/paths"
import { selectLatestRelease } from "@/lib/content/versions"

describe("latestZipPath", () => {
  it("builds the stable portal path", () => {
    expect(latestZipPath("kafra-datablad")).toBe(
      "/plugins/kafra-datablad/latest.zip"
    )
  })
})

describe("latestZipRedirectsFromPlugins", () => {
  it("redirects to the highest stable asset that is not yanked", () => {
    const redirects = latestZipRedirectsFromPlugins([
      {
        slug: "demo",
        versionScheme: "semver",
        releases: [
          {
            version: "1.2.0",
            channel: "stable",
            resolved: { downloadUrl: "https://example.com/1.2.0.zip" },
          },
          {
            version: "1.3.0",
            channel: "stable",
            resolved: { downloadUrl: "https://example.com/1.3.0.zip" },
          },
          {
            version: "2.0.0-beta.1",
            channel: "beta",
            resolved: { downloadUrl: "https://example.com/2.0.0-beta.1.zip" },
          },
          {
            version: "1.4.0",
            channel: "stable",
            yanked: { reason: "Broken download" },
            resolved: { downloadUrl: "https://example.com/1.4.0.zip" },
          },
        ],
      },
    ])

    expect(redirects).toEqual([
      {
        source: "/plugins/demo/latest.zip",
        destination: "https://example.com/1.3.0.zip",
        permanent: false,
      },
    ])
  })

  it("falls back to the highest beta when no stable release exists", () => {
    const redirects = latestZipRedirectsFromPlugins([
      {
        slug: "beta-only",
        versionScheme: "semver",
        releases: [
          {
            version: "2.0.0-beta.1",
            channel: "beta",
            resolved: { downloadUrl: "https://example.com/beta.1.zip" },
          },
          {
            version: "2.0.0-beta.2",
            channel: "beta",
            resolved: { downloadUrl: "https://example.com/beta.2.zip" },
          },
        ],
      },
    ])

    expect(redirects[0]?.destination).toBe("https://example.com/beta.2.zip")
    expect(redirects[0]?.permanent).toBe(false)
  })

  it("omits plugins with no downloadable release", () => {
    expect(
      latestZipRedirectsFromPlugins([
        { slug: "empty", versionScheme: "semver", releases: [] },
      ])
    ).toEqual([])
  })
})

describe("getLatestZipRedirects", () => {
  it("redirects each plugin to its latest release asset", async () => {
    const { plugins } = await loadPlugins(getContentPaths())
    const redirects = await getLatestZipRedirects()
    const bySource = new Map(
      redirects.map((redirect) => [redirect.source, redirect])
    )
    const withLatest = plugins.filter(
      (plugin) =>
        selectLatestRelease(plugin.releases, plugin.versionScheme) !== undefined
    )

    expect(redirects).toHaveLength(withLatest.length)
    expect(bySource.size).toBe(redirects.length)

    for (const plugin of plugins) {
      const latest = selectLatestRelease(plugin.releases, plugin.versionScheme)
      const source = latestZipPath(plugin.slug)

      if (!latest) {
        expect(bySource.has(source)).toBe(false)
        continue
      }

      expect(bySource.get(source)).toEqual({
        source,
        destination: latest.resolved.downloadUrl,
        permanent: false,
      })
    }
  })
})
