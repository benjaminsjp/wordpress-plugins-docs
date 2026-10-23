import { getPlugins, getSnippets, getTaxonomy } from "@/lib/content"
import { selectLatestRelease } from "@/lib/content/versions"
import type { PluginRecord } from "@/lib/content/load-plugins"
import type { SnippetRecord } from "@/lib/content/load-snippets"

export type NavPlugin = {
  slug: string
  name: string
  href: string
}

export type NavSubcategory = {
  slug: string
  label: string
  href: string
  count: number
}

export type NavCategory = {
  slug: string
  label: string
  href: string
  count: number
  subcategories: NavSubcategory[]
}

export type SnippetLocation = {
  category: string
  subcategory?: string
}

export type NavData = {
  plugins: NavPlugin[]
  categories: NavCategory[]
  snippetLocations: Record<string, SnippetLocation>
}

export type LatestReleaseItem = {
  pluginSlug: string
  pluginName: string
  version: string
  releaseDate: string
  href: string
}

export async function getNavData(): Promise<NavData> {
  const [plugins, snippets, taxonomy] = await Promise.all([
    getPlugins(),
    getSnippets(),
    getTaxonomy(),
  ])

  const snippetLocations: Record<string, SnippetLocation> = {}
  for (const snippet of snippets) {
    snippetLocations[snippet.slug] = {
      category: snippet.category,
      subcategory: snippet.subcategory,
    }
  }

  const categories: NavCategory[] = (taxonomy?.categories ?? []).map(
    (category) => {
      const inCategory = snippets.filter(
        (snippet) => snippet.category === category.slug
      )
      return {
        slug: category.slug,
        label: category.label,
        href: `/css/category/${category.slug}`,
        count: inCategory.length,
        subcategories: category.subcategories.map((subcategory) => ({
          slug: subcategory.slug,
          label: subcategory.label,
          href: `/css/category/${category.slug}/${subcategory.slug}`,
          count: inCategory.filter(
            (snippet) => snippet.subcategory === subcategory.slug
          ).length,
        })),
      }
    }
  )

  return {
    plugins: [...plugins]
      .sort((left, right) => left.name.localeCompare(right.name, "nb"))
      .map((plugin) => ({
        slug: plugin.slug,
        name: plugin.name,
        href: `/plugins/${plugin.slug}`,
      })),
    categories,
    snippetLocations,
  }
}

export function listLatestReleases(
  plugins: PluginRecord[],
  limit = 5
): LatestReleaseItem[] {
  const items = plugins.flatMap((plugin) =>
    plugin.releases.map((release) => ({
      pluginSlug: plugin.slug,
      pluginName: plugin.name,
      version: release.version,
      releaseDate: release.releaseDate,
      href: `/plugins/${plugin.slug}`,
    }))
  )

  return items
    .sort((left, right) => right.releaseDate.localeCompare(left.releaseDate))
    .slice(0, limit)
}

export function listRecentSnippets(snippets: SnippetRecord[], limit = 5) {
  return [...snippets]
    .sort((left, right) => right.updated.localeCompare(left.updated))
    .slice(0, limit)
}

export function latestPluginVersion(plugin: PluginRecord): string | undefined {
  return selectLatestRelease(plugin.releases, plugin.versionScheme)?.version
}
