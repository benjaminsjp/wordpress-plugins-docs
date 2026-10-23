import { describe, expect, it } from "vitest"
import {
  changelogFileUrl,
  minVersionSatisfied,
  versionAnchor,
} from "@/lib/plugin-view"

describe("versionAnchor", () => {
  it("turns 1.3.0 into v1-3-0", () => {
    expect(versionAnchor("1.3.0")).toBe("v1-3-0")
  })

  it("keeps prerelease labels", () => {
    expect(versionAnchor("2.0.0-beta.1")).toBe("v2-0-0-beta-1")
  })
})

describe("changelogFileUrl", () => {
  it("prefers a per-release changelog url over the plugin file", () => {
    expect(
      changelogFileUrl(
        { changelogUrl: "https://example.com/CHANGELOG.md" },
        { changelog: { url: "https://example.com/CHANGELOG.md#1-3-0" } }
      )
    ).toBe("https://example.com/CHANGELOG.md#1-3-0")
  })

  it("falls back to the plugin changelog file", () => {
    expect(
      changelogFileUrl(
        { changelogUrl: "https://example.com/CHANGELOG.md" },
        {}
      )
    ).toBe("https://example.com/CHANGELOG.md")
  })
})

describe("minVersionSatisfied", () => {
  it("treats an equal or higher latest version as satisfied", () => {
    expect(minVersionSatisfied("2.1.1", "2.0", "dotted")).toBe(true)
    expect(minVersionSatisfied("1.2.0", "1.3.0", "semver")).toBe(false)
  })
})
