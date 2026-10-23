import { describe, expect, it } from "vitest"
import {
  createGitHubClient,
  normalizeSha256,
  verifyGitHubReleases,
  type GitHubClient,
  type GitHubReleasePayload,
  type GitHubRepoPayload,
} from "@/lib/content/github-verify"
import { ISSUE_CODES } from "@/lib/content/issue-codes"
import { resolveReleaseDownload } from "@/lib/content/github"
import type { PluginRecord } from "@/lib/content/load-plugins"

const SHA =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

function plugin(options: {
  slug: string
  visibility: "public" | "private"
  tag?: string
  asset?: string
  sha256?: string
  channel?: "stable" | "beta"
}): PluginRecord {
  const resolved = resolveReleaseDownload({
    owner: "bli-synlig-plugins",
    repo: options.slug,
    slug: options.slug,
    version: "1.0.0",
    download:
      options.tag || options.asset
        ? { tag: options.tag, asset: options.asset }
        : undefined,
  })

  return {
    name: options.slug,
    summary: "Test",
    versionScheme: "semver",
    status: "active",
    repository: {
      owner: "bli-synlig-plugins",
      repo: options.slug,
      visibility: options.visibility,
    },
    slug: options.slug,
    file: `plugins/${options.slug}/plugin.json`,
    docs: { overview: "overview.mdx", installation: null, usage: null },
    releases: [
      {
        releaseDate: "2026-01-01",
        channel: options.channel ?? "stable",
        requirements: {
          wordpress: { min: "6.4" },
          php: { min: "8.1" },
        },
        dependencies: [],
        download: options.sha256 ? { sha256: options.sha256 } : undefined,
        version: "1.0.0",
        file: `plugins/${options.slug}/releases/1.0.0.json`,
        resolved,
      },
    ],
  }
}

function mockClient(options: {
  repos?: Record<string, GitHubRepoPayload | { status: number }>
  releases?: Record<string, GitHubReleasePayload | { status: number }>
}): GitHubClient {
  return {
    async getRepo(owner, repo) {
      const value = options.repos?.[`${owner}/${repo}`]
      if (!value) return { ok: false, status: 404 }
      if ("status" in value) return { ok: false, status: value.status }
      return { ok: true, value }
    },
    async getReleaseByTag(owner, repo, tag) {
      const value = options.releases?.[`${owner}/${repo}@${tag}`]
      if (!value) return { ok: false, status: 404 }
      if ("status" in value) return { ok: false, status: value.status }
      return { ok: true, value }
    },
  }
}

describe("normalizeSha256", () => {
  it("strips the sha256 prefix and lowercases", () => {
    expect(normalizeSha256(`sha256:${SHA.toUpperCase()}`)).toBe(SHA)
  })
})

describe("verifyGitHubReleases", () => {
  it("passes when the public tag, asset, digest, and visibility match", async () => {
    const record = plugin({
      slug: "public-plugin",
      visibility: "public",
      sha256: SHA,
    })
    const issues = await verifyGitHubReleases(
      [record],
      mockClient({
        repos: { "bli-synlig-plugins/public-plugin": { private: false } },
        releases: {
          "bli-synlig-plugins/public-plugin@v1.0.0": {
            draft: false,
            prerelease: false,
            tag_name: "v1.0.0",
            assets: [{ name: record.releases[0]?.resolved.asset ?? "", digest: `sha256:${SHA}` }],
          },
        },
      })
    )
    expect(issues).toEqual([])
  })

  it("errors when a public or private tag is missing", async () => {
    const publicPlugin = plugin({ slug: "public-plugin", visibility: "public" })
    const privatePlugin = plugin({
      slug: "private-plugin",
      visibility: "private",
    })
    const issues = await verifyGitHubReleases(
      [publicPlugin, privatePlugin],
      mockClient({
        repos: {
          "bli-synlig-plugins/public-plugin": { private: false },
          "bli-synlig-plugins/private-plugin": { private: true },
        },
      })
    )
    expect(issues.map((issue) => issue.code)).toEqual([
      ISSUE_CODES.GITHUB_TAG_MISSING,
      ISSUE_CODES.GITHUB_TAG_MISSING,
    ])
  })

  it("errors when the ZIP asset is missing from the GitHub release", async () => {
    const record = plugin({ slug: "public-plugin", visibility: "public" })
    const issues = await verifyGitHubReleases(
      [record],
      mockClient({
        repos: { "bli-synlig-plugins/public-plugin": { private: false } },
        releases: {
          "bli-synlig-plugins/public-plugin@v1.0.0": {
            draft: false,
            prerelease: false,
            tag_name: "v1.0.0",
            assets: [{ name: "other.zip" }],
          },
        },
      })
    )
    expect(issues.map((issue) => issue.code)).toEqual([
      ISSUE_CODES.GITHUB_ASSET_MISSING,
    ])
  })

  it("errors when the digest does not match", async () => {
    const record = plugin({
      slug: "public-plugin",
      visibility: "public",
      sha256: SHA,
    })
    const issues = await verifyGitHubReleases(
      [record],
      mockClient({
        repos: { "bli-synlig-plugins/public-plugin": { private: false } },
        releases: {
          "bli-synlig-plugins/public-plugin@v1.0.0": {
            draft: false,
            prerelease: false,
            tag_name: "v1.0.0",
            assets: [
              {
                name: record.releases[0]?.resolved.asset ?? "",
                digest: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
              },
            ],
          },
        },
      })
    )
    expect(issues.map((issue) => issue.code)).toEqual([
      ISSUE_CODES.GITHUB_DIGEST_MISMATCH,
    ])
  })

  it("errors when a private repository is 404 without access", async () => {
    const issues = await verifyGitHubReleases(
      [plugin({ slug: "kafra-datablad", visibility: "private" })],
      mockClient({})
    )
    expect(issues[0]?.code).toBe(ISSUE_CODES.GITHUB_REPO_UNAVAILABLE)
    expect(issues[0]?.message).toMatch(/PLUGIN_GITHUB_TOKEN/)
  })

  it("warns for draft and prerelease-vs-stable mismatches", async () => {
    const record = plugin({ slug: "public-plugin", visibility: "public" })
    const issues = await verifyGitHubReleases(
      [record],
      mockClient({
        repos: { "bli-synlig-plugins/public-plugin": { private: false } },
        releases: {
          "bli-synlig-plugins/public-plugin@v1.0.0": {
            draft: true,
            prerelease: true,
            tag_name: "v1.0.0",
            assets: [{ name: record.releases[0]?.resolved.asset ?? "" }],
          },
        },
      })
    )
    expect(issues.map((issue) => issue.code)).toEqual([
      ISSUE_CODES.GITHUB_RELEASE_DRAFT,
      ISSUE_CODES.GITHUB_PRERELEASE_STABLE,
    ])
  })
})

describe("createGitHubClient", () => {
  it("caches repo lookups and sends the token", async () => {
    let calls = 0
    const fetchImpl: typeof fetch = async (input, init) => {
      calls += 1
      const headers = new Headers(init?.headers)
      expect(headers.get("Authorization")).toBe("Bearer test-token")
      expect(String(input)).toBe(
        "https://api.github.com/repos/bli-synlig-plugins/public-plugin"
      )
      return new Response(JSON.stringify({ private: false }), { status: 200 })
    }
    const client = createGitHubClient({ token: "test-token", fetchImpl })
    await client.getRepo("bli-synlig-plugins", "public-plugin")
    await client.getRepo("bli-synlig-plugins", "public-plugin")
    expect(calls).toBe(1)
  })
})
