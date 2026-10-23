import { access, writeFile } from "node:fs/promises"
import path from "node:path"
import { resolveReleaseDownload } from "./github"
import {
  normalizeSha256,
  type GitHubClient,
  type GitHubReleasePayload,
} from "./github-verify"
import type { PluginRecord, ReleaseRecord } from "./load-plugins"
import { CONTENT_ROOT, SHA256_PATTERN, pluginDir } from "./paths"
import type { ReleaseChannel, ReleaseJson } from "./schemas"
import { compareVersions, isValidVersion } from "./versions"

export const RELEASE_SCHEMA_REF = "../../../../schemas/release.schema.json"

export const FALLBACK_REQUIREMENTS: ReleaseJson["requirements"] = {
  wordpress: { min: "6.4" },
  php: { min: "8.1" },
}

export class NewReleaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NewReleaseError"
  }
}

export type DraftReleaseJson = {
  $schema: string
  releaseDate: string
  channel: ReleaseChannel
  requirements: ReleaseJson["requirements"]
  dependencies: ReleaseJson["dependencies"]
  download?: { sha256: string }
  changelog?: NonNullable<ReleaseJson["changelog"]>
}

export function releaseFilePath(
  slug: string,
  version: string,
  contentRoot: string = CONTENT_ROOT
): string {
  return path.join(pluginDir(contentRoot, slug), "releases", `${version}.json`)
}

export function releaseDateFromPublishedAt(
  publishedAt: string | null | undefined,
  now: Date = new Date()
): string {
  if (publishedAt) {
    const match = /^(\d{4}-\d{2}-\d{2})/.exec(publishedAt)
    if (match) {
      return match[1]
    }
  }

  return now.toISOString().slice(0, 10)
}

export function changelogFromReleaseBody(
  body: string | null | undefined
): NonNullable<ReleaseJson["changelog"]> | undefined {
  if (!body?.trim()) {
    return undefined
  }

  const added = body
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^#{1,6}\s+/, "")
        .replace(/^[-*+]\s+/, "")
        .trim()
    )
    .filter(Boolean)
    .slice(0, 20)

  if (added.length === 0) {
    return undefined
  }

  return { added }
}

export function sha256FromDigest(digest: string | null | undefined): string | undefined {
  if (!digest) {
    return undefined
  }

  const normalized = normalizeSha256(digest)
  return SHA256_PATTERN.test(normalized) ? normalized : undefined
}

export function previousReleaseForCopy(
  plugin: PluginRecord
): ReleaseRecord | undefined {
  if (plugin.releases.length === 0) {
    return undefined
  }

  return [...plugin.releases].sort((left, right) =>
    compareVersions(right.version, left.version, plugin.versionScheme)
  )[0]
}

export function buildDraftRelease(options: {
  version: string
  plugin: PluginRecord
  remote: GitHubReleasePayload
  now?: Date
}): { draft: DraftReleaseJson; warnings: string[] } {
  const { version, plugin, remote } = options
  const warnings: string[] = []
  const resolved = resolveReleaseDownload({
    owner: plugin.repository.owner,
    repo: plugin.repository.repo,
    slug: plugin.slug,
    version,
    tagPattern: plugin.repository.tagPattern,
    assetPattern: plugin.repository.assetPattern,
  })

  if (remote.draft) {
    throw new NewReleaseError(
      `GitHub release "${resolved.tag}" is still a draft. Publish it before scaffolding.`
    )
  }

  const asset = remote.assets.find((item) => item.name === resolved.asset)
  if (!asset) {
    const names = remote.assets.map((item) => item.name).join(", ") || "(none)"
    throw new NewReleaseError(
      `Asset "${resolved.asset}" was not found on GitHub release "${resolved.tag}". Available: ${names}`
    )
  }

  const previous = previousReleaseForCopy(plugin)
  const requirements = previous?.requirements ?? FALLBACK_REQUIREMENTS
  if (!previous) {
    warnings.push(
      "No previous release to copy requirements from. Using WordPress 6.4 and PHP 8.1 — review before opening a PR."
    )
  }

  const sha256 = sha256FromDigest(asset.digest)
  if (!sha256) {
    warnings.push(
      `GitHub did not report a SHA-256 digest for "${resolved.asset}". sha256 was omitted; do not invent one.`
    )
  }

  const changelog = changelogFromReleaseBody(remote.body)
  if (!changelog) {
    warnings.push(
      "GitHub release notes were empty. Add a changelog before opening a PR."
    )
  }

  const draft: DraftReleaseJson = {
    $schema: RELEASE_SCHEMA_REF,
    releaseDate: releaseDateFromPublishedAt(remote.published_at, options.now),
    channel: remote.prerelease ? "beta" : "stable",
    requirements: structuredClone(requirements),
    dependencies: structuredClone(previous?.dependencies ?? []),
  }

  if (sha256) {
    draft.download = { sha256 }
  }
  if (changelog) {
    draft.changelog = changelog
  }

  return { draft, warnings }
}

export function formatReleaseJson(draft: DraftReleaseJson): string {
  return `${JSON.stringify(draft, null, "\t")}\n`
}

export async function scaffoldRelease(options: {
  slug: string
  version: string
  plugins: PluginRecord[]
  client: GitHubClient
  token?: string
  contentRoot?: string
  now?: Date
  fileExists?: (filePath: string) => Promise<boolean>
  writeFile?: (filePath: string, contents: string) => Promise<void>
}): Promise<{ file: string; warnings: string[] }> {
  const plugin = options.plugins.find((item) => item.slug === options.slug)
  if (!plugin) {
    const slugs = options.plugins.map((item) => item.slug).join(", ") || "(none)"
    throw new NewReleaseError(
      `Unknown plugin slug "${options.slug}". Known slugs: ${slugs}`
    )
  }

  if (!isValidVersion(options.version, plugin.versionScheme)) {
    throw new NewReleaseError(
      `"${options.version}" is not a valid ${plugin.versionScheme} version. Do not include a leading v.`
    )
  }

  if (plugin.releases.some((release) => release.version === options.version)) {
    throw new NewReleaseError(
      `Release ${options.version} already exists for ${plugin.slug}. The script refuses to overwrite.`
    )
  }

  const filePath = releaseFilePath(
    plugin.slug,
    options.version,
    options.contentRoot
  )
  const exists = options.fileExists
    ? await options.fileExists(filePath)
    : await pathExists(filePath)
  if (exists) {
    throw new NewReleaseError(
      `Refusing to overwrite existing file ${filePath}`
    )
  }

  const resolved = resolveReleaseDownload({
    owner: plugin.repository.owner,
    repo: plugin.repository.repo,
    slug: plugin.slug,
    version: options.version,
    tagPattern: plugin.repository.tagPattern,
    assetPattern: plugin.repository.assetPattern,
  })

  if (plugin.repository.visibility === "private" && !options.token) {
    throw new NewReleaseError(
      `Plugin "${plugin.slug}" is in a private repository. Set GITHUB_TOKEN in this terminal (do not commit it) and try again.`
    )
  }

  const remote = await options.client.getReleaseByTag(
    plugin.repository.owner,
    plugin.repository.repo,
    resolved.tag
  )

  if (!remote.ok) {
    throw new NewReleaseError(
      `Could not read GitHub release "${resolved.tag}" for ${plugin.repository.owner}/${plugin.repository.repo}: ${remote.message ?? remote.status}. ${
        remote.status === 404 && plugin.repository.visibility === "private"
          ? "A token with read access is required for private repositories."
          : "Publish the GitHub Release first."
      }`
    )
  }

  const { draft, warnings } = buildDraftRelease({
    version: options.version,
    plugin,
    remote: remote.value,
    now: options.now,
  })

  const write = options.writeFile ?? writeFile
  await write(filePath, formatReleaseJson(draft))

  return { file: filePath, warnings }
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}
