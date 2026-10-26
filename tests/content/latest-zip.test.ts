import { describe, expect, it } from "vitest"
import {
  getLatestZipRedirects,
  latestZipPath,
  latestZipRedirectsFromPlugins,
} from "@/lib/content/latest-zip"

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
  it("builds GitHub asset redirects from the real plugin content", async () => {
    const redirects = await getLatestZipRedirects()
    const bySource = new Map(
      redirects.map((redirect) => [redirect.source, redirect])
    )

    expect(bySource.get("/plugins/blogg-post-plugin-for-flatsome/latest.zip")).toEqual({
      source: "/plugins/blogg-post-plugin-for-flatsome/latest.zip",
      destination:
        "https://github.com/bli-synlig-plugins/Blogg-post-plugin-for-flatsome/releases/download/v1.0.5/blogg-post-plugin-for-flatsome-v1.0.5.zip",
      permanent: false,
    })
    expect(bySource.get("/plugins/flatsome-better-animations/latest.zip")).toEqual({
      source: "/plugins/flatsome-better-animations/latest.zip",
      destination:
        "https://github.com/bli-synlig-plugins/flatsome-better-animations/releases/download/v1.0.2/flatsome-better-animations-1.0.2.zip",
      permanent: false,
    })
    expect(bySource.get("/plugins/flatsome-ekstra-farger/latest.zip")).toEqual({
      source: "/plugins/flatsome-ekstra-farger/latest.zip",
      destination:
        "https://github.com/bli-synlig-plugins/flatsome-ekstra-farger/releases/download/v1.0.0/flatsome-ekstra-farger-1.0.0.zip",
      permanent: false,
    })
    expect(bySource.get("/plugins/kafra-auto-skjema/latest.zip")).toEqual({
      source: "/plugins/kafra-auto-skjema/latest.zip",
      destination:
        "https://github.com/bli-synlig-plugins/kafra-auto-skjema/releases/download/v1.1.8/kafra-auto-skjema-1.1.8.zip",
      permanent: false,
    })
    expect(bySource.get("/plugins/kafra-datablad/latest.zip")).toEqual({
      source: "/plugins/kafra-datablad/latest.zip",
      destination:
        "https://github.com/bli-synlig-plugins/kafra-datablad/releases/download/v1.2.2/kafra-datablad-1.2.2.zip",
      permanent: false,
    })
    expect(bySource.get("/plugins/kafra-produktkatalog/latest.zip")).toEqual({
      source: "/plugins/kafra-produktkatalog/latest.zip",
      destination:
        "https://github.com/bli-synlig-plugins/kafra-produktkatalog/releases/download/v1.4.1/kafra-produktkatalog-1.4.1.zip",
      permanent: false,
    })
    expect(bySource.get("/plugins/videogalleri/latest.zip")).toEqual({
      source: "/plugins/videogalleri/latest.zip",
      destination:
        "https://github.com/bli-synlig-plugins/videogalleri/releases/download/v1.1.1/videogalleri-1.1.1.zip",
      permanent: false,
    })
    expect(bySource.get("/plugins/wp-icons-flatsome/latest.zip")).toEqual({
      source: "/plugins/wp-icons-flatsome/latest.zip",
      destination:
        "https://github.com/bli-synlig-plugins/wp-icons-flatsome/releases/download/v1.0.0/wp-icons-flatsome-1.0.0.zip",
      permanent: false,
    })
  })
})
