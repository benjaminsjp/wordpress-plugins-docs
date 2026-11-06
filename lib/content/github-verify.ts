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

function verifyRecordedAsset(options: {
  remote: GitHubReleasePayload
  file: string
  tag: string
  assetName: string
  sha256?: string
  shaPath: string
}): Issue[] {
  const asset = options.remote.assets.find((item) => item.name === options.assetName)
  if (!asset) {
    return [
      {
        code: ISSUE_CODES.GITHUB_ASSET_MISSING,
        severity: "error",
        file: options.file,
        message: `Asset "${options.assetName}" was not found on GitHub release "${options.tag}".`,
      },
    ]
  }

  if (!options.sha256) return []

  if (!asset.digest) {
    return [
      {
        code: ISSUE_CODES.GITHUB_DIGEST_MISSING,
        severity: "warning",
        file: options.file,
        path: options.shaPath,
        message: `GitHub did not report a digest for "${options.assetName}".`,
      },
    ]
  }

  if (normalizeSha256(asset.digest) !== normalizeSha256(options.sha256)) {
    return [
      {
        code: ISSUE_CODES.GITHUB_DIGEST_MISMATCH,
        severity: "error",
        file: options.file,
        path: options.shaPath,
        message: `Recorded SHA-256 does not match the digest GitHub reports for "${options.assetName}".`,
      },
    ]
  }

  return []
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

      issues.push(
        ...verifyRecordedAsset({
          remote,
          file: release.file,
          tag: release.resolved.tag,
          assetName: release.resolved.asset,
          sha256: release.download?.sha256,
          shaPath: "download.sha256",
        })
      )

      for (const [index, extra] of release.resolved.extras.entries()) {
        issues.push(
          ...verifyRecordedAsset({
            remote,
            file: release.file,
            tag: release.resolved.tag,
            assetName: extra.asset,
            sha256: extra.sha256,
            shaPath: `download.extras.${index}.sha256`,
          })
        )
      }
    }
  }

  return issues
}
