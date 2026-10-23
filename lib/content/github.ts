export const DEFAULT_TAG_PATTERN = "v{version}"
export const DEFAULT_ASSET_PATTERN = "{slug}-{version}.zip"

const PLACEHOLDER_PATTERN = /\{([a-zA-Z]+)\}/g
const KNOWN_PLACEHOLDERS = new Set(["version", "slug"])

export const GITHUB_OWNER_PATTERN =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/

export const GITHUB_REPO_PATTERN = /^(?!\.\.?$)[A-Za-z0-9._-]{1,100}$/

export type PatternVars = {
  slug: string
  version: string
}

export type ReleaseRef = {
  tag?: string
  asset?: string
}

export type ResolvedDownload = {
  tag: string
  asset: string
  downloadUrl: string
  releasePageUrl: string
  repositoryUrl: string
}

export function isValidGitHubOwner(owner: string): boolean {
  return GITHUB_OWNER_PATTERN.test(owner)
}

export function isValidGitHubRepo(repo: string): boolean {
  return GITHUB_REPO_PATTERN.test(repo)
}

export function patternPlaceholders(pattern: string): string[] {
  return [...pattern.matchAll(PLACEHOLDER_PATTERN)].map((match) => match[1])
}

export function unknownPlaceholders(pattern: string): string[] {
  return patternPlaceholders(pattern).filter(
    (name) => !KNOWN_PLACEHOLDERS.has(name)
  )
}

export function applyPattern(pattern: string, vars: PatternVars): string {
  return pattern.replaceAll(
    PLACEHOLDER_PATTERN,
    (full, name: string) => {
      if (name === "version") return vars.version
      if (name === "slug") return vars.slug
      return full
    }
  )
}

export function repositoryUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}`
}

export function releasePageUrl(
  owner: string,
  repo: string,
  tag: string
): string {
  return `https://github.com/${owner}/${repo}/releases/tag/${encodeURIComponent(tag)}`
}

export function assetDownloadUrl(
  owner: string,
  repo: string,
  tag: string,
  asset: string
): string {
  return `https://github.com/${owner}/${repo}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(asset)}`
}

export function resolveReleaseDownload(options: {
  owner: string
  repo: string
  slug: string
  version: string
  tagPattern?: string
  assetPattern?: string
  download?: ReleaseRef
}): ResolvedDownload {
  const tagPattern = options.tagPattern ?? DEFAULT_TAG_PATTERN
  const assetPattern = options.assetPattern ?? DEFAULT_ASSET_PATTERN
  const vars = { slug: options.slug, version: options.version }
  const tag = options.download?.tag ?? applyPattern(tagPattern, vars)
  const asset = options.download?.asset ?? applyPattern(assetPattern, vars)

  return {
    tag,
    asset,
    downloadUrl: assetDownloadUrl(options.owner, options.repo, tag, asset),
    releasePageUrl: releasePageUrl(options.owner, options.repo, tag),
    repositoryUrl: repositoryUrl(options.owner, options.repo),
  }
}
