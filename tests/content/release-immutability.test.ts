import { describe, expect, it } from "vitest"
import { ISSUE_CODES } from "@/lib/content/issue-codes"
import {
  compareReleaseIdentities,
  identitiesFromContentFiles,
  isReleaseContentPath,
  toReleaseIdentity,
} from "@/lib/content/release-immutability"

const pluginJson = JSON.stringify({
  name: "Demo",
  summary: "Demo plugin",
  versionScheme: "semver",
  status: "active",
  repository: {
    owner: "bli-synlig-plugins",
    repo: "demo",
    visibility: "public",
  },
  author: "benjamin",
})

const releaseJson = JSON.stringify({
  releaseDate: "2026-01-01",
  channel: "stable",
  requirements: {
    wordpress: { min: "6.4" },
    php: { min: "8.1" },
  },
})

describe("isReleaseContentPath", () => {
  it("matches release JSON under content/plugins", () => {
    expect(
      isReleaseContentPath(
        "content/plugins/blogg-post-plugin-for-flatsome/releases/1.0.5.json"
      )
    ).toBe(true)
    expect(isReleaseContentPath("content/plugins/demo/plugin.json")).toBe(false)
  })
})

describe("compareReleaseIdentities", () => {
  const base = toReleaseIdentity({
    file: "content/plugins/demo/releases/1.0.0.json",
    slug: "demo",
    version: "1.0.0",
    owner: "bli-synlig-plugins",
    repo: "demo",
  })

  it("errors when an existing release file is deleted", () => {
    const issues = compareReleaseIdentities({ base: [base], head: [] })
    expect(issues.map((issue) => issue.code)).toEqual([
      ISSUE_CODES.RELEASE_DELETED,
    ])
  })

  it("errors when a release file is renamed", () => {
    const issues = compareReleaseIdentities({
      base: [base],
      head: [
        {
          ...base,
          file: "content/plugins/demo/releases/1.0.1.json",
        },
      ],
      renamed: [
        {
          from: base.file,
          to: "content/plugins/demo/releases/1.0.1.json",
        },
      ],
    })
    expect(issues.map((issue) => issue.code)).toContain(
      ISSUE_CODES.RELEASE_RENAMED
    )
  })

  it("errors when the effective tag or asset changes", () => {
    const issues = compareReleaseIdentities({
      base: [base],
      head: [{ ...base, tag: "v1.0.0-changed", asset: "other.zip" }],
    })
    expect(issues).toHaveLength(1)
    expect(issues[0]?.code).toBe(ISSUE_CODES.RELEASE_IMMUTABLE_FIELD)
    expect(issues[0]?.message).toMatch(/tag/)
    expect(issues[0]?.message).toMatch(/asset/)
  })

  it("allows changelog-only edits", () => {
    const issues = compareReleaseIdentities({
      base: [base],
      head: [base],
    })
    expect(issues).toEqual([])
  })

  it("errors when an extra is added to a published release", () => {
    const head = toReleaseIdentity({
      file: base.file,
      slug: "demo",
      version: "1.0.0",
      owner: "bli-synlig-plugins",
      repo: "demo",
      download: {
        extras: [
          { id: "lite", label: "Lite", asset: "demo-lite-1.0.0.zip" },
        ],
      },
    })
    const issues = compareReleaseIdentities({ base: [base], head: [head] })
    expect(issues).toHaveLength(1)
    expect(issues[0]?.code).toBe(ISSUE_CODES.RELEASE_IMMUTABLE_FIELD)
    expect(issues[0]?.message).toMatch(/extra "lite" added/)
  })

  it("allows a plugin assetPattern correction when the release file is unchanged", () => {
    const issues = compareReleaseIdentities({
      base: [base],
      head: [{ ...base, asset: "demo-v1.0.0.zip" }],
      modifiedReleaseFiles: [],
    })
    expect(issues).toEqual([])
  })
})

describe("identitiesFromContentFiles", () => {
  it("derives tag and asset from plugin patterns", () => {
    const identities = identitiesFromContentFiles({
      "content/plugins/demo/plugin.json": pluginJson,
      "content/plugins/demo/releases/1.0.0.json": releaseJson,
    })
    expect(identities).toEqual([
      {
        file: "content/plugins/demo/releases/1.0.0.json",
        tag: "v1.0.0",
        asset: "demo-1.0.0.zip",
        sha256: null,
        extras: [],
      },
    ])
  })

  it("locks an extra asset and hash, and ignores its label", () => {
    const withLite = JSON.stringify({
      releaseDate: "2026-01-01",
      channel: "stable",
      requirements: {
        wordpress: { min: "6.4" },
        php: { min: "8.1" },
      },
      download: {
        sha256: "a".repeat(64),
        extras: [
          {
            id: "lite",
            label: "Lite",
            asset: "demo-lite-1.0.0.zip",
            sha256: "b".repeat(64),
          },
        ],
      },
    })
    const relabeled = withLite.replace('"label":"Lite"', '"label":"Lett"')
    const [identity] = identitiesFromContentFiles({
      "content/plugins/demo/plugin.json": pluginJson,
      "content/plugins/demo/releases/1.0.0.json": withLite,
    })
    const [relabeledIdentity] = identitiesFromContentFiles({
      "content/plugins/demo/plugin.json": pluginJson,
      "content/plugins/demo/releases/1.0.0.json": relabeled,
    })

    expect(identity?.extras).toEqual([
      {
        id: "lite",
        asset: "demo-lite-1.0.0.zip",
        sha256: "b".repeat(64),
      },
    ])
    expect(relabeledIdentity).toEqual(identity)

    const changed = identity
      ? {
          ...identity,
          extras: [
            {
              id: "lite",
              asset: "other-lite.zip",
              sha256: "c".repeat(64),
            },
          ],
        }
      : identity
    const issues = compareReleaseIdentities({
      base: identity ? [identity] : [],
      head: changed ? [changed] : [],
    })
    expect(issues).toHaveLength(1)
    expect(issues[0]?.code).toBe(ISSUE_CODES.RELEASE_IMMUTABLE_FIELD)
    expect(issues[0]?.message).toMatch(/extra "lite" asset/)
    expect(issues[0]?.message).toMatch(/extra "lite" sha256/)
  })
})
