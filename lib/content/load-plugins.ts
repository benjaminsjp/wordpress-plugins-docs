import { readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"
import {
  resolveReleaseDownload,
  type ResolvedDownload,
} from "./github"
import { ISSUE_CODES, type Issue } from "./issue-codes"
import {
  isValidSlug,
  toContentPath,
  type ContentPaths,
} from "./paths"
import { parseWithSchema, readJson } from "./read-json"
import {
  pluginJsonSchema,
  releaseJsonSchema,
  type PluginJson,
  type ReleaseJson,
} from "./schemas"

export type ReleaseRecord = ReleaseJson & {
  version: string
  file: string
  resolved: ResolvedDownload
}

export type PluginRecord = PluginJson & {
  slug: string
  file: string
  docs: {
    overview: string | null
    installation: string | null
    usage: string | null
  }
  releases: ReleaseRecord[]
}

export async function loadPlugins(
  paths: ContentPaths
): Promise<{ plugins: PluginRecord[]; issues: Issue[] }> {
  const issues: Issue[] = []
  const plugins: PluginRecord[] = []

  let entries: string[] = []
  try {
    entries = await readdir(paths.plugins)
  } catch {
    return { plugins, issues }
  }

  for (const slug of entries) {
    const dir = path.join(paths.plugins, slug)
    const info = await stat(dir).catch(() => null)
    if (!info?.isDirectory() || slug.startsWith(".")) {
      continue
    }

    const loaded = await loadPlugin(paths.root, dir, slug)
    issues.push(...loaded.issues)
    if (loaded.plugin) {
      plugins.push(loaded.plugin)
    }
  }

  plugins.sort((left, right) => left.slug.localeCompare(right.slug))
  return { plugins, issues }
}

async function loadPlugin(
  root: string,
  dir: string,
  slug: string
): Promise<{ plugin: PluginRecord | undefined; issues: Issue[] }> {
  const issues: Issue[] = []
  const pluginFile = path.join(dir, "plugin.json")
  const relativePluginFile = toContentPath(root, pluginFile)

  if (!isValidSlug(slug)) {
    issues.push({
      code: ISSUE_CODES.SLUG_INVALID,
      severity: "error",
      file: relativePluginFile,
      message: `Plugin slug "${slug}" must be kebab-case.`,
    })
  }

  const json = await readJson(pluginFile, relativePluginFile)
  issues.push(...json.issues)
  if (json.issues.length) {
    return { plugin: undefined, issues }
  }

  const parsed = parseWithSchema(pluginJsonSchema, json.data, relativePluginFile)
  issues.push(...parsed.issues)
  if (!parsed.value) {
    return { plugin: undefined, issues }
  }

  const docsDir = path.join(dir, "docs")
  const overview = await existingFile(
    root,
    path.join(docsDir, "overview.mdx")
  )
  const installation = await existingFile(
    root,
    path.join(docsDir, "installation.mdx")
  )
  const usage = await existingFile(root, path.join(docsDir, "usage.mdx"))

  if (!overview) {
    issues.push({
      code: ISSUE_CODES.OVERVIEW_MISSING,
      severity: "error",
      file: toContentPath(root, path.join(docsDir, "overview.mdx")),
      message: `Plugin "${slug}" is missing docs/overview.mdx.`,
    })
  }

  const releases = await loadReleases(
    root,
    slug,
    parsed.value,
    path.join(dir, "releases"),
    issues
  )

  if (releases.length === 0) {
    issues.push({
      code: ISSUE_CODES.PLUGIN_NO_RELEASES,
      severity: "warning",
      file: relativePluginFile,
      message: `Plugin "${slug}" has no releases.`,
    })
  }

  return {
    plugin: {
      ...parsed.value,
      slug,
      file: relativePluginFile,
      docs: {
        overview,
        installation,
        usage,
      },
      releases,
    },
    issues,
  }
}

async function loadReleases(
  root: string,
  slug: string,
  plugin: PluginJson,
  releasesDir: string,
  issues: Issue[]
): Promise<ReleaseRecord[]> {
  let files: string[] = []
  try {
    files = (await readdir(releasesDir)).filter((name) => name.endsWith(".json"))
  } catch {
    return []
  }

  const releases: ReleaseRecord[] = []

  for (const name of files) {
    const file = path.join(releasesDir, name)
    const relativeFile = toContentPath(root, file)
    const version = name.slice(0, -".json".length)
    const json = await readJson(file, relativeFile)
    issues.push(...json.issues)
    if (json.issues.length) {
      continue
    }

    const parsed = parseWithSchema(releaseJsonSchema, json.data, relativeFile)
    issues.push(...parsed.issues)
    if (!parsed.value) {
      continue
    }

    const resolved = resolveReleaseDownload({
      owner: plugin.repository.owner,
      repo: plugin.repository.repo,
      slug,
      version,
      tagPattern: plugin.repository.tagPattern,
      assetPattern: plugin.repository.assetPattern,
      download: parsed.value.download,
    })

    releases.push({
      ...parsed.value,
      version,
      file: relativeFile,
      resolved,
    })
  }

  return releases
}

async function existingFile(
  root: string,
  file: string
): Promise<string | null> {
  try {
    await readFile(file)
    return toContentPath(root, file)
  } catch {
    return null
  }
}
