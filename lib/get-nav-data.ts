import { getPlugins, getSnippets, getTaxonomy } from "@/lib/content"
import type { NavCategory, NavData, SnippetLocation } from "@/lib/nav"

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
    snippets: snippets.map((snippet) => ({
      slug: snippet.slug,
      name: snippet.name,
      href: `/css/${snippet.slug}`,
    })),
    tags: (taxonomy?.tags ?? []).map((tag) => ({
      slug: tag.slug,
      label: tag.label,
      href: `/css/tag/${tag.slug}`,
    })),
    categories,
    snippetLocations,
    pluginCount: plugins.length,
    snippetCount: snippets.length,
  }
}
