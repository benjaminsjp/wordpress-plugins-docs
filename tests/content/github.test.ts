import { describe, expect, it } from "vitest"
import {
  applyPattern,
  DEFAULT_ASSET_PATTERN,
  DEFAULT_TAG_PATTERN,
  isValidGitHubOwner,
  isValidGitHubRepo,
  resolveReleaseDownload,
  unknownPlaceholders,
} from "@/lib/content/github"

describe("GitHub naming", () => {
  it("accepts valid owners and repos", () => {
    expect(isValidGitHubOwner("ORG")).toBe(true)
    expect(isValidGitHubOwner("acme-web")).toBe(true)
    expect(isValidGitHubOwner("-acme")).toBe(false)
    expect(isValidGitHubRepo("agency-core")).toBe(true)
    expect(isValidGitHubRepo("..")).toBe(false)
  })
})

describe("resolveReleaseDownload", () => {
  it("uses default v{version} and {slug}-{version}.zip patterns", () => {
    const resolved = resolveReleaseDownload({
      owner: "ORG",
      repo: "flatsome-product-badges",
      slug: "flatsome-product-badges",
      version: "1.3.0",
    })

    expect(DEFAULT_TAG_PATTERN).toBe("v{version}")
    expect(DEFAULT_ASSET_PATTERN).toBe("{slug}-{version}.zip")
    expect(resolved.tag).toBe("v1.3.0")
    expect(resolved.asset).toBe("flatsome-product-badges-1.3.0.zip")
    expect(resolved.downloadUrl).toBe(
      "https://github.com/ORG/flatsome-product-badges/releases/download/v1.3.0/flatsome-product-badges-1.3.0.zip"
    )
    expect(resolved.releasePageUrl).toBe(
      "https://github.com/ORG/flatsome-product-badges/releases/tag/v1.3.0"
    )
  })

  it("uses a plugin tag pattern without a leading v", () => {
    const resolved = resolveReleaseDownload({
      owner: "ORG",
      repo: "agency-core",
      slug: "agency-core",
      version: "2.1.1",
      tagPattern: "{version}",
    })

    expect(resolved.tag).toBe("2.1.1")
    expect(resolved.downloadUrl).toBe(
      "https://github.com/ORG/agency-core/releases/download/2.1.1/agency-core-2.1.1.zip"
    )
  })

  it("derives default URLs for bli-synlig-plugins repositories", () => {
    const resolved = resolveReleaseDownload({
      owner: "bli-synlig-plugins",
      repo: "Blogg-post-plugin-for-flatsome",
      slug: "blogg-post-plugin-for-flatsome",
      version: "1.0.5",
    })

    expect(resolved.tag).toBe("v1.0.5")
    expect(resolved.asset).toBe("blogg-post-plugin-for-flatsome-1.0.5.zip")
    expect(resolved.downloadUrl).toBe(
      "https://github.com/bli-synlig-plugins/Blogg-post-plugin-for-flatsome/releases/download/v1.0.5/blogg-post-plugin-for-flatsome-1.0.5.zip"
    )
    expect(resolved.releasePageUrl).toBe(
      "https://github.com/bli-synlig-plugins/Blogg-post-plugin-for-flatsome/releases/tag/v1.0.5"
    )
  })

  it("uses the blogg ZIP name with a v in the asset", () => {
    const resolved = resolveReleaseDownload({
      owner: "bli-synlig-plugins",
      repo: "Blogg-post-plugin-for-flatsome",
      slug: "blogg-post-plugin-for-flatsome",
      version: "1.0.5",
      assetPattern: "{slug}-v{version}.zip",
    })

    expect(resolved.tag).toBe("v1.0.5")
    expect(resolved.asset).toBe("blogg-post-plugin-for-flatsome-v1.0.5.zip")
    expect(resolved.downloadUrl).toBe(
      "https://github.com/bli-synlig-plugins/Blogg-post-plugin-for-flatsome/releases/download/v1.0.5/blogg-post-plugin-for-flatsome-v1.0.5.zip"
    )
  })

  it("uses the kafra ZIP name with a v in the asset", () => {
    const resolved = resolveReleaseDownload({
      owner: "bli-synlig-plugins",
      repo: "kafra-datablad",
      slug: "kafra-datablad",
      version: "1.0.0",
      assetPattern: "{slug}-v{version}.zip",
    })

    expect(resolved.tag).toBe("v1.0.0")
    expect(resolved.asset).toBe("kafra-datablad-v1.0.0.zip")
    expect(resolved.downloadUrl).toBe(
      "https://github.com/bli-synlig-plugins/kafra-datablad/releases/download/v1.0.0/kafra-datablad-v1.0.0.zip"
    )
  })

  it("lets a release override only the asset name", () => {
    const resolved = resolveReleaseDownload({
      owner: "ORG",
      repo: "flatsome-product-badges",
      slug: "flatsome-product-badges",
      version: "1.2.0",
      download: { asset: "product-badges.zip" },
    })

    expect(resolved.tag).toBe("v1.2.0")
    expect(resolved.asset).toBe("product-badges.zip")
    expect(resolved.downloadUrl).toBe(
      "https://github.com/ORG/flatsome-product-badges/releases/download/v1.2.0/product-badges.zip"
    )
  })

  it("detects unknown placeholders", () => {
    expect(unknownPlaceholders("v{version}-{hash}")).toEqual(["hash"])
    expect(applyPattern("{slug}-{version}.zip", { slug: "a", version: "1" })).toBe(
      "a-1.zip"
    )
  })
})
