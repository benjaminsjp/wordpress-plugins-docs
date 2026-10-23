import {
  resolveReleaseDownload,
  type ReleaseRef,
} from "./github"
import { ISSUE_CODES, type Issue } from "./issue-codes"
import { pluginJsonSchema, releaseJsonSchema } from "./schemas"

export type ReleaseIdentity = {
  file: string
  tag: string
  asset: string
  sha256: string | null
}

export type ReleaseIdentityInput = {
  file: string
  slug: string
  version: string
  owner: string
  repo: string
  tagPattern?: string
  assetPattern?: string
  download?: ReleaseRef & { sha256?: string }
}

const RELEASE_FILE_PATTERN =
  /^content\/plugins\/([^/]+)\/releases\/([^/]+)\.json$/

export function isReleaseContentPath(file: string): boolean {
  return RELEASE_FILE_PATTERN.test(file.replaceAll("\\", "/"))
}

export function parseReleaseContentPath(
  file: string
): { slug: string; version: string } | null {
  const match = RELEASE_FILE_PATTERN.exec(file.replaceAll("\\", "/"))
  if (!match || !match[1] || !match[2]) return null
  return { slug: match[1], version: match[2] }
}

export function toReleaseIdentity(input: ReleaseIdentityInput): ReleaseIdentity {
  const resolved = resolveReleaseDownload({
    owner: input.owner,
    repo: input.repo,
    slug: input.slug,
    version: input.version,
    tagPattern: input.tagPattern,
    assetPattern: input.assetPattern,
    download: input.download,
  })

  return {
    file: input.file.replaceAll("\\", "/"),
    tag: resolved.tag,
    asset: resolved.asset,
    sha256: input.download?.sha256 ?? null,
  }
}

export function identitiesFromContentFiles(
  files: Map<string, string> | Record<string, string>
): ReleaseIdentity[] {
  const map = files instanceof Map ? files : new Map(Object.entries(files))
  const identities: ReleaseIdentity[] = []

  for (const [file, raw] of map) {
    const parsedPath = parseReleaseContentPath(file)
    if (!parsedPath) continue

    const pluginFile = `content/plugins/${parsedPath.slug}/plugin.json`
    const pluginRaw = map.get(pluginFile)
    if (!pluginRaw) continue

    const pluginJson = parseJson(pluginRaw)
    const releaseJson = parseJson(raw)
    if (!pluginJson || !releaseJson) continue

    const plugin = pluginJsonSchema.safeParse(pluginJson)
    const release = releaseJsonSchema.safeParse(releaseJson)
    if (!plugin.success || !release.success) continue

    identities.push(
      toReleaseIdentity({
        file,
        slug: parsedPath.slug,
        version: parsedPath.version,
        owner: plugin.data.repository.owner,
        repo: plugin.data.repository.repo,
        tagPattern: plugin.data.repository.tagPattern,
        assetPattern: plugin.data.repository.assetPattern,
        download: release.data.download,
      })
    )
  }

  return identities
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

export function compareReleaseIdentities(options: {
  base: ReleaseIdentity[]
  head: ReleaseIdentity[]
  renamed?: Array<{ from: string; to: string }>
  modifiedReleaseFiles?: string[]
}): Issue[] {
  const issues: Issue[] = []
  const baseByFile = new Map(options.base.map((item) => [item.file, item]))
  const headByFile = new Map(options.head.map((item) => [item.file, item]))
  const modified =
    options.modifiedReleaseFiles === undefined
      ? null
      : new Set(
          options.modifiedReleaseFiles.map((file) => file.replaceAll("\\", "/"))
        )

  for (const renamed of options.renamed ?? []) {
    issues.push({
      code: ISSUE_CODES.RELEASE_RENAMED,
      severity: "error",
      file: renamed.from,
      message: `Release file was renamed to "${renamed.to}". Publish a new version file instead of renaming an existing one.`,
    })
  }

  const renamedFrom = new Set((options.renamed ?? []).map((item) => item.from))

  for (const [file, base] of baseByFile) {
    if (renamedFrom.has(file)) continue
    if (!headByFile.has(file)) {
      issues.push({
        code: ISSUE_CODES.RELEASE_DELETED,
        severity: "error",
        file,
        message: `Release file was deleted. Mark the release yanked instead of removing it.`,
      })
      continue
    }

    const head = headByFile.get(file)
    if (!head) continue
    if (modified && !modified.has(file)) continue

    const changes: string[] = []
    if (base.tag !== head.tag) {
      changes.push(`tag "${base.tag}" → "${head.tag}"`)
    }
    if (base.asset !== head.asset) {
      changes.push(`asset "${base.asset}" → "${head.asset}"`)
    }
    if ((base.sha256 ?? null) !== (head.sha256 ?? null)) {
      changes.push("sha256")
    }

    if (changes.length > 0) {
      issues.push({
        code: ISSUE_CODES.RELEASE_IMMUTABLE_FIELD,
        severity: "error",
        file,
        message: `Immutable release fields changed (${changes.join(", ")}). Add a new version file instead.`,
      })
    }
  }

  return issues
}
