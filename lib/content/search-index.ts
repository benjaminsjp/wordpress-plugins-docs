import type { PluginRecord } from "./load-plugins"
import type { SnippetRecord } from "./load-snippets"
import type { TaxonomyRecord } from "./load-taxonomy"
import { isInternalDependency, type Dependency } from "./schemas"
import { selectLatestRelease } from "./versions"

export type SearchRecordType = "plugin" | "snippet" | "category"

export type SearchRecord = {
  type: SearchRecordType
  slug: string
  title: string
  summary: string
  url: string
  category?: string
  tags: string[]
  keywords: string[]
}

export type SearchIndexContent = {
  plugins: PluginRecord[]
  snippets: SnippetRecord[]
  taxonomy: TaxonomyRecord | undefined
}

const SELECTOR_PATTERN = /([.#])(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g
const HEX_COLOR_PATTERN =
  /^(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

export function extractCssSelectors(css: string): string[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "")
  const selectors = new Set<string>()

  for (const match of withoutComments.matchAll(SELECTOR_PATTERN)) {
    const prefix = match[1]
    const name = match[2]
    if (!prefix || !name) continue
    if (prefix === "#" && HEX_COLOR_PATTERN.test(name)) continue
    selectors.add(`${prefix}${name}`)
  }

  return uniqueSorted([...selectors])
}

function pluginAuthorLabel(
  plugin: PluginRecord,
  taxonomy: TaxonomyRecord | undefined
): string | undefined {
  return taxonomy?.authors.find((author) => author.slug === plugin.author)?.label
}

export function buildSearchIndex(content: SearchIndexContent): SearchRecord[] {
  const records: SearchRecord[] = []

  for (const plugin of content.plugins) {
    const authorLabel = pluginAuthorLabel(plugin, content.taxonomy)
    records.push({
      type: "plugin",
      slug: plugin.slug,
      title: plugin.name,
      summary: plugin.summary,
      url: `/plugins/${plugin.slug}`,
      tags: plugin.tags ?? [],
      keywords: uniqueSorted([
        ...pluginKeywords(plugin),
        ...(authorLabel ? [authorLabel] : []),
        plugin.author,
      ]),
    })
  }

  for (const snippet of content.snippets) {
    records.push({
      type: "snippet",
      slug: snippet.slug,
      title: snippet.name,
      summary: snippet.summary,
      url: `/css/${snippet.slug}`,
      category: snippet.category,
      tags: snippet.tags,
      keywords: extractCssSelectors(snippet.css),
    })
  }

  for (const category of content.taxonomy?.categories ?? []) {
    records.push({
      type: "category",
      slug: category.slug,
      title: category.label,
      summary: category.description ?? "",
      url: `/css/category/${category.slug}`,
      category: category.slug,
      tags: [],
      keywords: uniqueSorted(
        category.subcategories.flatMap((subcategory) => [
          subcategory.slug,
          subcategory.label,
        ])
      ),
    })

    for (const subcategory of category.subcategories) {
      records.push({
        type: "category",
        slug: `${category.slug}/${subcategory.slug}`,
        title: subcategory.label,
        summary: subcategory.description ?? category.label,
        url: `/css/category/${category.slug}/${subcategory.slug}`,
        category: category.slug,
        tags: [],
        keywords: uniqueSorted([category.slug, category.label]),
      })
    }
  }

  return records
}

function pluginKeywords(plugin: PluginRecord): string[] {
  const latest = selectLatestRelease(plugin.releases, plugin.versionScheme)
  if (!latest) return []

  return uniqueSorted(latest.dependencies.flatMap(dependencyKeywords))
}

function dependencyKeywords(dependency: Dependency): string[] {
  if (isInternalDependency(dependency)) {
    return [dependency.plugin]
  }

  return [dependency.external.name, dependency.external.slug].filter(
    (value): value is string => Boolean(value)
  )
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort()
}
