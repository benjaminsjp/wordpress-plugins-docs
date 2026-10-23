import { describe, expect, it } from "vitest"
import {
  compareVersions,
  hasLeadingV,
  isValidVersion,
  parseVersion,
  selectLatestRelease,
} from "@/lib/content/versions"

describe("parseVersion", () => {
  it("parses semver, including prerelease", () => {
    expect(parseVersion("1.2.3", "semver")?.canonical).toBe("1.2.3")
    expect(parseVersion("2.0.0-beta.1", "semver")?.canonical).toBe(
      "2.0.0-beta.1"
    )
    expect(parseVersion("1.0.0-Beta.1", "semver")?.canonical).toBe(
      "1.0.0-beta.1"
    )
    expect(parseVersion("1.2", "semver")).toBeNull()
  })

  it("parses dotted versions with two to four parts", () => {
    expect(parseVersion("2.1", "dotted")?.core).toEqual([2, 1])
    expect(parseVersion("2.1.1", "dotted")?.core).toEqual([2, 1, 1])
    expect(parseVersion("1.0.0.3", "dotted")?.core).toEqual([1, 0, 0, 3])
    expect(parseVersion("1", "dotted")).toBeNull()
    expect(parseVersion("1.2.3.4.5", "dotted")).toBeNull()
  })

  it("parses calver as YYYY.MM or YYYY.MM.N", () => {
    expect(parseVersion("2026.10", "calver")?.core).toEqual([2026, 10, 0])
    expect(parseVersion("2026.10.2", "calver")?.core).toEqual([2026, 10, 2])
    expect(parseVersion("2026.1", "calver")).toBeNull()
  })

  it("rejects a leading v", () => {
    expect(hasLeadingV("v1.0.0")).toBe(true)
    expect(isValidVersion("v1.0.0", "semver")).toBe(false)
  })
})

describe("compareVersions", () => {
  it("orders dotted versions numerically", () => {
    expect(compareVersions("2.1", "2.1.1", "dotted")).toBeLessThan(0)
    expect(compareVersions("2.10", "2.9", "dotted")).toBeGreaterThan(0)
  })

  it("applies semver prerelease rules", () => {
    expect(compareVersions("1.0.0-beta.1", "1.0.0", "semver")).toBeLessThan(0)
    expect(compareVersions("1.0.0-beta.2", "1.0.0-beta.1", "semver")).toBeGreaterThan(0)
    expect(compareVersions("1.0.0-beta.1", "1.0.0-rc.1", "semver")).toBeLessThan(0)
  })

  it("orders calver by year, month, then patch", () => {
    expect(compareVersions("2026.09", "2026.10", "calver")).toBeLessThan(0)
    expect(compareVersions("2026.10.2", "2026.10", "calver")).toBeGreaterThan(0)
  })
})

describe("selectLatestRelease", () => {
  const scheme = "semver" as const

  it("selects the highest stable release that is not yanked", () => {
    const latest = selectLatestRelease(
      [
        { version: "1.2.0", channel: "stable" },
        { version: "1.3.0", channel: "stable" },
        { version: "2.0.0-beta.1", channel: "beta" },
        {
          version: "1.4.0",
          channel: "stable",
          yanked: { reason: "Broken download" },
        },
      ],
      scheme
    )
    expect(latest?.version).toBe("1.3.0")
  })

  it("falls back to the highest beta when no stable release exists", () => {
    const latest = selectLatestRelease(
      [
        { version: "2.0.0-beta.1", channel: "beta" },
        { version: "2.0.0-beta.2", channel: "beta" },
      ],
      scheme
    )
    expect(latest?.version).toBe("2.0.0-beta.2")
  })
})
