import {
  DEFAULT_ASSET_PATTERN,
  DEFAULT_TAG_PATTERN,
  isValidGitHubOwner,
  isValidGitHubRepo,
  unknownPlaceholders,
} from "./github"
import { ISSUE_CODES, type Issue } from "./issue-codes"
import { collectGraphIssues, type PluginGraph, buildPluginGraph } from "./graph"
import { loadPlugins, type PluginRecord } from "./load-plugins"
import { loadSnippets, type SnippetRecord } from "./load-snippets"
import { loadTaxonomy, type TaxonomyRecord } from "./load-taxonomy"
import { CONTENT_ROOT, getContentPaths, SHA256_PATTERN } from "./paths"
import { hasLeadingV, isValidVersion, parseVersion } from "./versions"

export type ContentData = {
  plugins: PluginRecord[]
  snippets: SnippetRecord[]
  taxonomy: TaxonomyRecord | undefined
  graph: PluginGraph
  issues: Issue[]
}

export async function loadAndValidate(
  root: string = CONTENT_ROOT
): Promise<ContentData> {
  const paths = getContentPaths(root)
  const [taxonomyResult, pluginResult, snippetResult] = await Promise.all([
    loadTaxonomy(paths),
    loadPlugins(paths),
    loadSnippets(paths),
  ])

  const issues: Issue[] = [
    ...taxonomyResult.issues,
    ...pluginResult.issues,
    ...snippetResult.issues,
    ...crossValidate(
      pluginResult.plugins,
      snippetResult.snippets,
      taxonomyResult.taxonomy
    ),
  ]

  const graph = buildPluginGraph(pluginResult.plugins)

  issues.sort((left, right) => {
    const file = left.file.localeCompare(right.file)
    if (file !== 0) return file
    return left.code.localeCompare(right.code)
  })

  return {
    plugins: pluginResult.plugins,
    snippets: snippetResult.snippets,
    taxonomy: taxonomyResult.taxonomy,
    graph,
    issues,
  }
}

export function crossValidate(
  plugins: PluginRecord[],
  snippets: SnippetRecord[],
  taxonomy: TaxonomyRecord | undefined
): Issue[] {
  const issues: Issue[] = [
    ...collectDuplicateSlugIssues(plugins, "plugin"),
    ...collectDuplicateSlugIssues(snippets, "snippet"),
  ]

  if (taxonomy) {
    issues.push(...collectTaxonomyIssues(taxonomy))
    issues.push(...collectSnippetTaxonomyIssues(snippets, taxonomy))
    issues.push(...collectPluginAuthorIssues(plugins, taxonomy))
  }

  issues.push(...collectSnippetTokenIssues(snippets))
  issues.push(...collectPluginReferenceIssues(plugins, snippets))
  issues.push(...collectReleaseIssues(plugins))
  issues.push(...collectGraphIssues(plugins))
  return issues
}

function collectDuplicateSlugIssues(
  items: Array<{ slug: string; file: string }>,
  type: "plugin" | "snippet"
): Issue[] {
  const issues: Issue[] = []
  const seen = new Map<string, { slug: string; file: string }>()

  for (const item of items) {
    const key = item.slug.toLowerCase()
    const existing = seen.get(key)
    if (existing) {
      issues.push({
        code: ISSUE_CODES.SLUG_DUPLICATE,
        severity: "error",
        file: item.file,
        message: `Duplicate ${type} slug "${item.slug}" (also used by "${existing.slug}").`,
      })
    } else {
      seen.set(key, item)
    }
  }

  return issues
}

function collectTaxonomyIssues(taxonomy: TaxonomyRecord): Issue[] {
  const issues: Issue[] = []
  const categorySlugs = new Map<string, string>()
  const categoryLabels = new Map<string, string>()
  const subcategorySlugs = new Map<string, string>()
  const subcategoryLabels = new Map<string, string>()

  for (const category of taxonomy.categories) {
    pushUnique(
      issues,
      categorySlugs,
      category.slug,
      taxonomy.files.categories,
      "category slug"
    )
    pushUnique(
      issues,
      categoryLabels,
      category.label,
      taxonomy.files.categories,
      "category label"
    )

    for (const subcategory of category.subcategories) {
      pushUnique(
        issues,
        subcategorySlugs,
        subcategory.slug,
        taxonomy.files.categories,
        "subcategory slug"
      )
      pushUnique(
        issues,
        subcategoryLabels,
        subcategory.label,
        taxonomy.files.categories,
        "subcategory label"
      )

      if (subcategory.subcategories && subcategory.subcategories.length > 0) {
        issues.push({
          code: ISSUE_CODES.TAXONOMY_TOO_DEEP,
          severity: "error",
          file: taxonomy.files.categories,
          message: `Category "${category.slug}" / "${subcategory.slug}" has more than two levels.`,
        })
      }
    }
  }

  const tagSlugs = new Map<string, string>()
  const tagLabels = new Map<string, string>()
  for (const tag of taxonomy.tags) {
    pushUnique(issues, tagSlugs, tag.slug, taxonomy.files.tags, "tag slug")
    pushUnique(issues, tagLabels, tag.label, taxonomy.files.tags, "tag label")
  }

  const authorSlugs = new Map<string, string>()
  const authorLabels = new Map<string, string>()
  for (const author of taxonomy.authors) {
    pushUnique(
      issues,
      authorSlugs,
      author.slug,
      taxonomy.files.authors,
      "author slug"
    )
    pushUnique(
      issues,
      authorLabels,
      author.label,
      taxonomy.files.authors,
      "author label"
    )
  }

  return issues
}

function collectPluginAuthorIssues(
  plugins: PluginRecord[],
  taxonomy: TaxonomyRecord
): Issue[] {
  const issues: Issue[] = []
  const authors = new Set(taxonomy.authors.map((author) => author.slug))

  for (const plugin of plugins) {
    if (!authors.has(plugin.author)) {
      issues.push({
        code: ISSUE_CODES.PLUGIN_AUTHOR_UNKNOWN,
        severity: "error",
        file: plugin.file,
        path: "author",
        message: `Unknown author "${plugin.author}".`,
      })
    }
  }

  return issues
}

function pushUnique(
  issues: Issue[],
  seen: Map<string, string>,
  value: string,
  file: string,
  kind: string
): void {
  const key = value.toLowerCase()
  const existing = seen.get(key)
  if (existing) {
    issues.push({
      code: kind.includes("label")
        ? ISSUE_CODES.TAXONOMY_DUPLICATE_LABEL
        : ISSUE_CODES.TAXONOMY_DUPLICATE_SLUG,
      severity: "error",
      file,
      message: `Duplicate ${kind} "${value}".`,
    })
    return
  }
  seen.set(key, value)
}

function collectSnippetTaxonomyIssues(
  snippets: SnippetRecord[],
  taxonomy: TaxonomyRecord
): Issue[] {
  const issues: Issue[] = []
  const categories = new Map(
    taxonomy.categories.map((category) => [category.slug, category])
  )
  const tags = new Set(taxonomy.tags.map((tag) => tag.slug))
  const usedTags = new Set<string>()

  for (const snippet of snippets) {
    const category = categories.get(snippet.category)
    if (!category) {
      issues.push({
        code: ISSUE_CODES.CATEGORY_UNKNOWN,
        severity: "error",
        file: snippet.file,
        path: "category",
        message: `Unknown category "${snippet.category}".`,
      })
    }

    if (snippet.subcategory) {
      const match = category?.subcategories.find(
        (item) => item.slug === snippet.subcategory
      )
      if (!category) {
        issues.push({
          code: ISSUE_CODES.SUBCATEGORY_UNKNOWN,
          severity: "error",
          file: snippet.file,
          path: "subcategory",
          message: `Unknown subcategory "${snippet.subcategory}".`,
        })
      } else if (!match) {
        issues.push({
          code: ISSUE_CODES.SUBCATEGORY_UNKNOWN,
          severity: "error",
          file: snippet.file,
          path: "subcategory",
          message: `Subcategory "${snippet.subcategory}" does not belong to category "${snippet.category}".`,
        })
      }
    }

    for (const tag of snippet.tags) {
      usedTags.add(tag)
      if (!tags.has(tag)) {
        issues.push({
          code: ISSUE_CODES.TAG_UNKNOWN,
          severity: "error",
          file: snippet.file,
          path: "tags",
          message: `Unknown tag "${tag}".`,
        })
      }
    }

    if (snippet.related) {
      const snippetSlugs = new Set(snippets.map((item) => item.slug))
      for (const related of snippet.related) {
        if (!snippetSlugs.has(related)) {
          issues.push({
            code: ISSUE_CODES.REF_MISSING,
            severity: "error",
            file: snippet.file,
            path: "related",
            message: `Related snippet "${related}" does not exist.`,
          })
        }
      }
    }
  }

  for (const tag of taxonomy.tags) {
    if (!usedTags.has(tag.slug)) {
      issues.push({
        code: ISSUE_CODES.TAG_UNUSED,
        severity: "warning",
        file: taxonomy.files.tags,
        message: `Tag "${tag.slug}" is not used by any snippet.`,
      })
    }
  }

  return issues
}

function collectSnippetTokenIssues(snippets: SnippetRecord[]): Issue[] {
  const issues: Issue[] = []

  for (const snippet of snippets) {
    const tokens = snippet.tokens ?? []
    const seenIds = new Set<string>()

    for (const [index, token] of tokens.entries()) {
      if (seenIds.has(token.id)) {
        issues.push({
          code: ISSUE_CODES.SNIPPET_TOKEN_DUPLICATE,
          severity: "error",
          file: snippet.file,
          path: `tokens.${index}.id`,
          message: `Duplicate token id "${token.id}".`,
        })
      }
      seenIds.add(token.id)

      if (!snippet.css.includes(token.replace)) {
        issues.push({
          code: ISSUE_CODES.SNIPPET_TOKEN_MISSING,
          severity: "error",
          file: snippet.file,
          path: `tokens.${index}.replace`,
          message: `Token "${token.id}" replace string was not found in snippet.css.`,
        })
      }

      const overlap = tokens.find(
        (other, otherIndex) =>
          otherIndex > index &&
          (other.replace.includes(token.replace) ||
            token.replace.includes(other.replace))
      )
      if (overlap) {
        issues.push({
          code: ISSUE_CODES.SNIPPET_TOKEN_OVERLAP,
          severity: "error",
          file: snippet.file,
          path: `tokens.${index}.replace`,
          message: `Token "${token.id}" replace string overlaps token "${overlap.id}".`,
        })
      }
    }
  }

  return issues
}

function collectPluginReferenceIssues(
  plugins: PluginRecord[],
  snippets: SnippetRecord[]
): Issue[] {
  const issues: Issue[] = []
  const pluginSlugs = new Set(plugins.map((plugin) => plugin.slug))
  const snippetSlugs = new Set(snippets.map((snippet) => snippet.slug))

  for (const plugin of plugins) {
    if (plugin.replacedBy && !pluginSlugs.has(plugin.replacedBy)) {
      issues.push({
        code: ISSUE_CODES.REF_MISSING,
        severity: "error",
        file: plugin.file,
        path: "replacedBy",
        message: `replacedBy plugin "${plugin.replacedBy}" does not exist.`,
      })
    }

    for (const related of plugin.related?.plugins ?? []) {
      if (!pluginSlugs.has(related)) {
        issues.push({
          code: ISSUE_CODES.REF_MISSING,
          severity: "error",
          file: plugin.file,
          path: "related.plugins",
          message: `Related plugin "${related}" does not exist.`,
        })
      }
    }

    for (const related of plugin.related?.snippets ?? []) {
      if (!snippetSlugs.has(related)) {
        issues.push({
          code: ISSUE_CODES.REF_MISSING,
          severity: "error",
          file: plugin.file,
          path: "related.snippets",
          message: `Related snippet "${related}" does not exist.`,
        })
      }
    }
  }

  return issues
}

function collectReleaseIssues(plugins: PluginRecord[]): Issue[] {
  const issues: Issue[] = []
  const today = todayIsoDate()

  for (const plugin of plugins) {
    const { owner, repo, tagPattern, assetPattern } = plugin.repository

    if (!isValidGitHubOwner(owner)) {
      issues.push({
        code: ISSUE_CODES.GITHUB_OWNER_INVALID,
        severity: "error",
        file: plugin.file,
        path: "repository.owner",
        message: `GitHub owner "${owner}" is not a valid repository owner name.`,
      })
    }

    if (!isValidGitHubRepo(repo)) {
      issues.push({
        code: ISSUE_CODES.GITHUB_REPO_INVALID,
        severity: "error",
        file: plugin.file,
        path: "repository.repo",
        message: `GitHub repo "${repo}" is not a valid repository name.`,
      })
    }

    issues.push(
      ...collectPatternIssues(
        plugin.file,
        "repository.tagPattern",
        tagPattern ?? DEFAULT_TAG_PATTERN
      ),
      ...collectPatternIssues(
        plugin.file,
        "repository.assetPattern",
        assetPattern ?? DEFAULT_ASSET_PATTERN
      )
    )

    const normalizedVersions = new Map<string, string>()
    const downloadKeys = new Map<string, string>()

    for (const release of plugin.releases) {
      if (hasLeadingV(release.version)) {
        issues.push({
          code: ISSUE_CODES.VERSION_LEADING_V,
          severity: "error",
          file: release.file,
          message: `Version "${release.version}" must not start with a leading v.`,
        })
      } else if (!isValidVersion(release.version, plugin.versionScheme)) {
        issues.push({
          code: ISSUE_CODES.VERSION_INVALID,
          severity: "error",
          file: release.file,
          message: `Version "${release.version}" is not valid for the ${plugin.versionScheme} scheme.`,
        })
      } else {
        const parsed = parseVersion(release.version, plugin.versionScheme)
        if (parsed) {
          const existing = normalizedVersions.get(parsed.canonical)
          if (existing) {
            issues.push({
              code: ISSUE_CODES.VERSION_DUPLICATE,
              severity: "error",
              file: release.file,
              message: `Version "${release.version}" duplicates "${existing}" after normalization.`,
            })
          } else {
            normalizedVersions.set(parsed.canonical, release.version)
          }
        }
      }

      if (release.releaseDate > today) {
        issues.push({
          code: ISSUE_CODES.RELEASE_DATE_FUTURE,
          severity: "warning",
          file: release.file,
          path: "releaseDate",
          message: `Release date ${release.releaseDate} is in the future.`,
        })
      }

      if (!release.resolved.asset.toLowerCase().endsWith(".zip")) {
        issues.push({
          code: ISSUE_CODES.ASSET_NOT_ZIP,
          severity: "error",
          file: release.file,
          message: `Derived asset name "${release.resolved.asset}" must end with .zip.`,
        })
      }

      const sha256 = release.download?.sha256
      if (!sha256) {
        issues.push({
          code: ISSUE_CODES.SHA256_MISSING,
          severity: "warning",
          file: release.file,
          path: "download.sha256",
          message: `Release ${release.version} is missing a sha256 digest.`,
        })
      } else if (!SHA256_PATTERN.test(sha256)) {
        issues.push({
          code: ISSUE_CODES.SHA256_INVALID,
          severity: "error",
          file: release.file,
          path: "download.sha256",
          message: `sha256 must be 64 hexadecimal characters.`,
        })
      }

      const downloadKey = `${release.resolved.tag}::${release.resolved.asset}`
      const existingDownload = downloadKeys.get(downloadKey)
      if (existingDownload) {
        issues.push({
          code: ISSUE_CODES.DOWNLOAD_DUPLICATE,
          severity: "error",
          file: release.file,
          message: `Release ${release.version} resolves to the same tag and asset as ${existingDownload}.`,
        })
      } else {
        downloadKeys.set(downloadKey, release.version)
      }
    }
  }

  return issues
}

function collectPatternIssues(
  file: string,
  path: string,
  pattern: string
): Issue[] {
  const issues: Issue[] = []
  const placeholders = unknownPlaceholders(pattern)

  if (!pattern.includes("{version}")) {
    issues.push({
      code: ISSUE_CODES.PATTERN_MISSING_VERSION,
      severity: "error",
      file,
      path,
      message: `Pattern "${pattern}" must contain {version}.`,
    })
  }

  if (placeholders.length > 0) {
    issues.push({
      code: ISSUE_CODES.PATTERN_UNKNOWN_PLACEHOLDER,
      severity: "error",
      file,
      path,
      message: `Pattern "${pattern}" contains unknown placeholders: ${placeholders.map((name) => `{${name}}`).join(", ")}.`,
    })
  }

  return issues
}

function todayIsoDate(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}
