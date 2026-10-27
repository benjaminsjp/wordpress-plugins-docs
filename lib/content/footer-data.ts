import { extractCssSelectors } from "./search-index"
import { selectLatestRelease } from "./versions"
import type { PluginRecord } from "./load-plugins"
import type { SnippetRecord } from "./load-snippets"

const EXTRA_TOKENS = [
  ".button",
  "add_action()",
  "add_filter()",
  "PHP",
  "CSS",
  "WordPress",
  "Flatsome",
  "WooCommerce",
  "UX Builder",
  "Bli Synlig",
]

export function latestContentDate(
  plugins: PluginRecord[],
  snippets: SnippetRecord[]
): Date {
  let latest = 0

  for (const plugin of plugins) {
    for (const release of plugin.releases) {
      const time = Date.parse(release.releaseDate)
      if (!Number.isNaN(time) && time > latest) {
        latest = time
      }
    }
  }

  for (const snippet of snippets) {
    const time = Date.parse(snippet.updated)
    if (!Number.isNaN(time) && time > latest) {
      latest = time
    }
  }

  return latest > 0 ? new Date(latest) : new Date()
}

export function buildFooterLexicon(
  plugins: PluginRecord[],
  snippets: SnippetRecord[]
): string[] {
  const words: string[] = []

  for (const plugin of plugins) {
    words.push(plugin.name)
    const latest = selectLatestRelease(plugin.releases, plugin.versionScheme)
    if (latest) {
      words.push(`v${latest.version}`)
    }
  }

  for (const snippet of snippets) {
    words.push(snippet.name)
    words.push(...extractCssSelectors(snippet.css).slice(0, 10))
  }

  words.push(...EXTRA_TOKENS)
  return words.filter(Boolean)
}
