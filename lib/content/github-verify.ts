import { ISSUE_CODES, type Issue } from "./issue-codes"
import type { PluginRecord } from "./load-plugins"

export type GitHubReleaseAsset = {
  name: string
  digest?: string | null
}

export type GitHubReleasePayload = {
  draft: boolean
  prerelease: boolean
  tag_name: string
  name?: string | null
  body?: string | null
  published_at?: string | null
  assets: GitHubReleaseAsset[]
}

export type GitHubRepoPayload = {
  private: boolean
}

export type GitHubLookupResult<T> =
  | { ok: true; value: T }
  | { ok: false; status: number; message?: string }

export type GitHubClient = {
  getRepo(
    owner: string,
    repo: string
  ): Promise<GitHubLookupResult<GitHubRepoPayload>>
  getReleaseByTag(
    owner: string,
    repo: string,
    tag: string
  ): Promise<GitHubLookupResult<GitHubReleasePayload>>
}

const API_VERSION = "2022-11-28"
const USER_AGENT = "wordpress-plugins-docs-ci"

export function normalizeSha256(value: string): string {
  return value.replace(/^sha256:/i, "").trim().toLowerCase()
}

export function createGitHubClient(options: {
  token?: string
  fetchImpl?: typeof fetch
}): GitHubClient {
  const fetchImpl = options.fetchImpl ?? fetch
  const repoCache = new Map<string, GitHubLookupResult<GitHubRepoPayload>>()
  const releaseCache = new Map<
    string,
    GitHubLookupResult<GitHubReleasePayload>
  >()

  async function request<T>(
    url: string
  ): Promise<GitHubLookupResult<T>> {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": API_VERSION,
      "User-Agent": USER_AGENT,
    }
    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`
    }

    const response = await fetchImpl(url, { headers })

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: `${response.status} ${response.statusText}`,
      }
    }

    return { ok: true, value: (await response.json()) as T }
  }

  return {
    async getRepo(owner, repo) {
      const key = `${owner}/${repo}`
      const cached = repoCache.get(key)
      if (cached) return cached
      const result = await request<GitHubRepoPayload>(
        `https://api.github.com/repos/${owner}/${repo}`
      )
      repoCache.set(key, result)
      return result
    },
    async getReleaseByTag(owner, repo, tag) {
      const key = `${owner}/${repo}@${tag}`
      const cached = releaseCache.get(key)
      if (cached) return cached
      const result = await request<GitHubReleasePayload>(
        `https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`
      )
      releaseCache.set(key, result)
      return result
    },
  }
}

export async function verifyGitHubReleases(
  plugins: PluginRecord[],
  client: GitHubClient
): Promise<Issue[]> {
  const issues: Issue[] = []

  for (const plugin of plugins) {
    const { owner, repo, visibility } = plugin.repository
    const repoResult = await client.getRepo(owner, repo)

    if (!repoResult.ok) {
      issues.push({
        code: ISSUE_CODES.GITHUB_REPO_UNAVAILABLE,
        severity: "error",
        file: plugin.file,
        message:
          repoResult.status === 404 && visibility === "private"
            ? `Repository ${owner}/${repo} returned 404. If it is private, set PLUGIN_GITHUB_TOKEN with read access to Contents and Metadata.`
            : `Repository ${owner}/${repo} is not available (${repoResult.message ?? repoResult.status}).`,
      })
      continue
    }

    const actualVisibility = repoResult.value.private ? "private" : "public"
    if (actualVisibility !== visibility) {
      issues.push({
        code: ISSUE_CODES.GITHUB_VISIBILITY_MISMATCH,
        severity: "error",
        file: plugin.file,
        path: "repository.visibility",
        message: `Declared visibility is "${visibility}" but GitHub reports "${actualVisibility}".`,
      })
    }

    for (const release of plugin.releases) {
      const tagResult = await client.getReleaseByTag(
        owner,
        repo,
        release.resolved.tag
      )

      if (!tagResult.ok) {
        if (tagResult.status === 404) {
          issues.push({
            code: ISSUE_CODES.GITHUB_TAG_MISSING,
            severity: "error",
            file: release.file,
            message: `GitHub release tag "${release.resolved.tag}" was not found on ${owner}/${repo}.`,
          })
          continue
        }

        issues.push({
          code: ISSUE_CODES.GITHUB_API_ERROR,
          severity: "error",
          file: release.file,
          message: `GitHub API error for tag "${release.resolved.tag}" on ${owner}/${repo}: ${tagResult.message ?? tagResult.status}.`,
        })
        continue
      }

      const remote = tagResult.value
      if (remote.draft) {
        issues.push({
          code: ISSUE_CODES.GITHUB_RELEASE_DRAFT,
          severity: "warning",
          file: release.file,
          message: `GitHub release "${release.resolved.tag}" is a draft.`,
        })
      }
      if (remote.prerelease && release.channel === "stable") {
        issues.push({
          code: ISSUE_CODES.GITHUB_PRERELEASE_STABLE,
          severity: "warning",
          file: release.file,
          message: `GitHub release "${release.resolved.tag}" is a prerelease, but this file is marked stable.`,
        })
      }

      const asset = remote.assets.find(
        (item) => item.name === release.resolved.asset
      )
      if (!asset) {
        issues.push({
          code: ISSUE_CODES.GITHUB_ASSET_MISSING,
          severity: "error",
          file: release.file,
          message: `Asset "${release.resolved.asset}" was not found on GitHub release "${release.resolved.tag}".`,
        })
        continue
      }

      const recorded = release.download?.sha256
      if (!recorded) continue

      if (!asset.digest) {
        issues.push({
          code: ISSUE_CODES.GITHUB_DIGEST_MISSING,
          severity: "warning",
          file: release.file,
          path: "download.sha256",
          message: `GitHub did not report a digest for "${release.resolved.asset}".`,
        })
        continue
      }

      if (normalizeSha256(asset.digest) !== normalizeSha256(recorded)) {
        issues.push({
          code: ISSUE_CODES.GITHUB_DIGEST_MISMATCH,
          severity: "error",
          file: release.file,
          path: "download.sha256",
          message: `Recorded SHA-256 does not match the digest GitHub reports for "${release.resolved.asset}".`,
        })
      }
    }
  }

  return issues
}
