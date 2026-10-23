import { selectLatestRelease } from "@/lib/content/versions"
import { strings } from "@/lib/strings"
import type { PluginRecord } from "@/lib/content/load-plugins"
import type { SnippetRecord } from "@/lib/content/load-snippets"

export type NavCrumb = {
  label: string
  href?: string
}

export type NavPlugin = {
  slug: string
  name: string
  href: string
}

export type NavSnippet = {
  slug: string
  name: string
  href: string
}

export type NavTag = {
  slug: string
  label: string
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
  snippets: NavSnippet[]
  tags: NavTag[]
  categories: NavCategory[]
  snippetLocations: Record<string, SnippetLocation>
  pluginCount: number
  snippetCount: number
}

export type LatestReleaseItem = {
  pluginSlug: string
  pluginName: string
  version: string
  releaseDate: string
  href: string
}

export function breadcrumbTrail(pathname: string, nav: NavData): NavCrumb[] {
  const home: NavCrumb = { label: strings.nav.home, href: "/" }

  if (pathname === "/") {
    return [{ label: strings.nav.home }]
  }

  if (pathname === "/plugins") {
    return [home, { label: strings.nav.plugins }]
  }

  const pluginMatch = /^\/plugins\/([^/]+)$/.exec(pathname)
  if (pluginMatch) {
    const plugin = nav.plugins.find((item) => item.slug === pluginMatch[1])
    return [
      home,
      { label: strings.nav.plugins, href: "/plugins" },
      { label: plugin?.name ?? pluginMatch[1] },
    ]
  }

  if (pathname === "/css") {
    return [home, { label: strings.nav.snippets }]
  }

  const subcategoryMatch = /^\/css\/category\/([^/]+)\/([^/]+)$/.exec(pathname)
  if (subcategoryMatch) {
    const category = nav.categories.find((item) => item.slug === subcategoryMatch[1])
    const subcategory = category?.subcategories.find(
      (item) => item.slug === subcategoryMatch[2]
    )
    return [
      home,
      { label: strings.nav.snippets, href: "/css" },
      {
        label: category?.label ?? subcategoryMatch[1],
        href: `/css/category/${subcategoryMatch[1]}`,
      },
      { label: subcategory?.label ?? subcategoryMatch[2] },
    ]
  }

  const categoryMatch = /^\/css\/category\/([^/]+)$/.exec(pathname)
  if (categoryMatch) {
    const category = nav.categories.find((item) => item.slug === categoryMatch[1])
    return [
      home,
      { label: strings.nav.snippets, href: "/css" },
      { label: category?.label ?? categoryMatch[1] },
    ]
  }

  const tagMatch = /^\/css\/tag\/([^/]+)$/.exec(pathname)
  if (tagMatch) {
    const tag = nav.tags.find((item) => item.slug === tagMatch[1])
    return [
      home,
      { label: strings.nav.snippets, href: "/css" },
      { label: tag?.label ?? tagMatch[1] },
    ]
  }

  const snippetMatch = /^\/css\/([^/]+)$/.exec(pathname)
  if (snippetMatch && snippetMatch[1] !== "category" && snippetMatch[1] !== "tag") {
    const slug = snippetMatch[1]
    const snippet = nav.snippets.find((item) => item.slug === slug)
    const location = nav.snippetLocations[slug]
    const category = location
      ? nav.categories.find((item) => item.slug === location.category)
      : undefined
    const subcategory = location?.subcategory
      ? category?.subcategories.find((item) => item.slug === location.subcategory)
      : undefined
    const crumbs: NavCrumb[] = [
      home,
      { label: strings.nav.snippets, href: "/css" },
    ]
    if (category) {
      crumbs.push({
        label: category.label,
        href: category.href,
      })
    }
    if (subcategory) {
      crumbs.push({
        label: subcategory.label,
        href: subcategory.href,
      })
    }
    crumbs.push({ label: snippet?.name ?? slug })
    return crumbs
  }

  return [home]
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
