import { describe, expect, it } from "vitest"
import { resolveReleaseDownload } from "@/lib/content/github"
import type {
  GitHubClient,
  GitHubReleasePayload,
} from "@/lib/content/github-verify"
import type { PluginRecord } from "@/lib/content/load-plugins"
import {
  NewReleaseError,
  buildDraftRelease,
  changelogFromReleaseBody,
  formatReleaseJson,
  releaseDateFromPublishedAt,
  scaffoldRelease,
  sha256FromDigest,
} from "@/lib/content/new-release"

const SHA =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

function plugin(options?: {
  slug?: string
  visibility?: "public" | "private"
  scheme?: "semver" | "dotted"
  releases?: PluginRecord["releases"]
}): PluginRecord {
  const slug = options?.slug ?? "sample-plugin"
  const resolved = resolveReleaseDownload({
    owner: "bli-synlig-plugins",
    repo: slug,
    slug,
    version: "1.0.0",
  })

  return {
    name: slug,
    summary: "Test",
    versionScheme: options?.scheme ?? "semver",
    status: "active",
    repository: {
      owner: "bli-synlig-plugins",
      repo: slug,
      visibility: options?.visibility ?? "public",
    },
    author: "benjamin",
    slug,
    file: `plugins/${slug}/plugin.json`,
    docs: { overview: "overview.mdx", installation: null, usage: null },
    releases: options?.releases ?? [
      {
        releaseDate: "2026-01-01",
        channel: "stable",
        requirements: {
          wordpress: { min: "6.4" },
          php: { min: "8.1" },
          flatsome: { min: "3.18.0" },
        },
        dependencies: [
          {
            external: { name: "Polylang" },
            type: "required",
          },
        ],
        version: "1.0.0",
        file: `plugins/${slug}/releases/1.0.0.json`,
        resolved,
      },
    ],
  }
}

function remote(options?: Partial<GitHubReleasePayload>): GitHubReleasePayload {
  return {
    draft: false,
    prerelease: false,
    tag_name: "v1.0.1",
    body: "- Adds a filter.\n- Fixes a sync bug.",
    published_at: "2026-10-23T11:58:01Z",
    assets: [
      {
        name: "sample-plugin-1.0.1.zip",
        digest: `sha256:${SHA}`,
      },
    ],
    ...options,
  }
}

function mockClient(payload: GitHubReleasePayload | { status: number; message?: string }): GitHubClient {
  return {
    async getRepo() {
      return { ok: true, value: { private: false } }
    },
    async getReleaseByTag() {
      if ("status" in payload) {
        return { ok: false, status: payload.status, message: payload.message }
      }
      return { ok: true, value: payload }
    },
  }
}

describe("changelogFromReleaseBody", () => {
  it("strips markdown headings and list markers", () => {
    expect(
      changelogFromReleaseBody("## Added\n- New filter\n* Sync fix\n")
    ).toEqual({
      added: ["Added", "New filter", "Sync fix"],
    })
  })

  it("returns undefined for empty notes", () => {
    expect(changelogFromReleaseBody("  \n")).toBeUndefined()
    expect(changelogFromReleaseBody(null)).toBeUndefined()
  })
})

describe("releaseDateFromPublishedAt", () => {
  it("uses the UTC date from GitHub", () => {
    expect(releaseDateFromPublishedAt("2026-10-23T11:58:01Z")).toBe("2026-10-23")
  })

  it("falls back to now when GitHub omits the date", () => {
    expect(releaseDateFromPublishedAt(null, new Date("2026-04-01T12:00:00Z"))).toBe(
      "2026-04-01"
    )
  })
})

describe("sha256FromDigest", () => {
  it("normalizes a GitHub digest and does not invent one", () => {
    expect(sha256FromDigest(`SHA256:${SHA.toUpperCase()}`)).toBe(SHA)
    expect(sha256FromDigest(null)).toBeUndefined()
    expect(sha256FromDigest("not-a-hash")).toBeUndefined()
  })
})

describe("buildDraftRelease", () => {
  it("copies previous requirements and dependencies, and records GitHub metadata", () => {
    const { draft, warnings } = buildDraftRelease({
      version: "1.0.1",
      plugin: plugin(),
      remote: remote(),
    })

    expect(draft.releaseDate).toBe("2026-10-23")
    expect(draft.channel).toBe("stable")
    expect(draft.requirements.flatsome).toEqual({ min: "3.18.0" })
    expect(draft.dependencies).toEqual([
      { external: { name: "Polylang" }, type: "required" },
    ])
    expect(draft.download).toEqual({ sha256: SHA })
    expect(draft.changelog?.added).toEqual([
      "Adds a filter.",
      "Fixes a sync bug.",
    ])
    expect(warnings).toEqual([])
  })

  it("uses fallback requirements when the plugin has no previous release", () => {
    const { draft, warnings } = buildDraftRelease({
      version: "1.0.0",
      plugin: plugin({ releases: [] }),
      remote: remote({
        tag_name: "v1.0.0",
        assets: [{ name: "sample-plugin-1.0.0.zip", digest: `sha256:${SHA}` }],
      }),
    })

    expect(draft.requirements).toEqual({
      wordpress: { min: "6.4" },
      php: { min: "8.1" },
    })
    expect(draft.dependencies).toEqual([])
    expect(warnings.some((warning) => warning.includes("No previous release"))).toBe(
      true
    )
  })

  it("marks prereleases as beta and omits invented hashes", () => {
    const { draft, warnings } = buildDraftRelease({
      version: "1.0.1",
      plugin: plugin(),
      remote: remote({
        prerelease: true,
        body: "  ",
        assets: [{ name: "sample-plugin-1.0.1.zip", digest: null }],
      }),
    })

    expect(draft.channel).toBe("beta")
    expect(draft.download).toBeUndefined()
    expect(draft.changelog).toBeUndefined()
    expect(warnings.some((warning) => warning.includes("do not invent"))).toBe(true)
    expect(warnings.some((warning) => warning.includes("changelog"))).toBe(true)
  })

  it("refuses draft GitHub releases and missing assets", () => {
    expect(() =>
      buildDraftRelease({
        version: "1.0.1",
        plugin: plugin(),
        remote: remote({ draft: true }),
      })
    ).toThrow(/draft/i)

    expect(() =>
      buildDraftRelease({
        version: "1.0.1",
        plugin: plugin(),
        remote: remote({ assets: [{ name: "other.zip" }] }),
      })
    ).toThrow(/sample-plugin-1.0.1.zip/)
  })

  it("pretty-prints JSON with tabs", () => {
    const { draft } = buildDraftRelease({
      version: "1.0.1",
      plugin: plugin(),
      remote: remote({ assets: [{ name: "sample-plugin-1.0.1.zip" }] }),
    })
    const text = formatReleaseJson(draft)
    expect(text.startsWith("{\n\t\"$schema\"")).toBe(true)
    expect(text.endsWith("\n")).toBe(true)
    expect(text).not.toContain("sha256")
  })
})

describe("scaffoldRelease", () => {
  it("writes a new file and refuses overwrites", async () => {
    const written: { path?: string; contents?: string } = {}
    const result = await scaffoldRelease({
      slug: "sample-plugin",
      version: "1.0.1",
      plugins: [plugin()],
      client: mockClient(remote()),
      fileExists: async () => false,
      writeFile: async (filePath, contents) => {
        written.path = filePath
        written.contents = contents
      },
    })

    expect(written.path?.replaceAll("\\", "/")).toMatch(
      /plugins\/sample-plugin\/releases\/1.0.1.json$/
    )
    expect(written.contents).toContain('"releaseDate": "2026-10-23"')
    expect(result.warnings).toEqual([])

    await expect(
      scaffoldRelease({
        slug: "sample-plugin",
        version: "1.0.1",
        plugins: [plugin()],
        client: mockClient(remote()),
        fileExists: async () => true,
        writeFile: async () => {
          throw new Error("should not write")
        },
      })
    ).rejects.toBeInstanceOf(NewReleaseError)

    await expect(
      scaffoldRelease({
        slug: "sample-plugin",
        version: "1.0.0",
        plugins: [plugin()],
        client: mockClient(remote()),
        fileExists: async () => false,
        writeFile: async () => {
          throw new Error("should not write")
        },
      })
    ).rejects.toThrow(/already exists/)
  })

  it("requires a token for private plugins and a valid version", async () => {
    await expect(
      scaffoldRelease({
        slug: "kafra-datablad",
        version: "1.0.1",
        plugins: [plugin({ slug: "kafra-datablad", visibility: "private" })],
        client: mockClient(remote()),
        fileExists: async () => false,
        writeFile: async () => {
          throw new Error("should not write")
        },
      })
    ).rejects.toThrow(/GITHUB_TOKEN/)

    await expect(
      scaffoldRelease({
        slug: "sample-plugin",
        version: "v1.0.1",
        plugins: [plugin()],
        client: mockClient(remote()),
        fileExists: async () => false,
        writeFile: async () => {
          throw new Error("should not write")
        },
      })
    ).rejects.toThrow(/leading v/)
  })
})
