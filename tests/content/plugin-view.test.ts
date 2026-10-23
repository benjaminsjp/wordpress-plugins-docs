import { describe, expect, it } from "vitest"
import { minVersionSatisfied, versionAnchor } from "@/lib/plugin-view"

describe("versionAnchor", () => {
  it("turns 1.3.0 into v1-3-0", () => {
    expect(versionAnchor("1.3.0")).toBe("v1-3-0")
  })

  it("keeps prerelease labels", () => {
    expect(versionAnchor("2.0.0-beta.1")).toBe("v2-0-0-beta-1")
  })
})

describe("minVersionSatisfied", () => {
  it("treats an equal or higher latest version as satisfied", () => {
    expect(minVersionSatisfied("2.1.1", "2.0", "dotted")).toBe(true)
    expect(minVersionSatisfied("1.2.0", "1.3.0", "semver")).toBe(false)
  })
})
