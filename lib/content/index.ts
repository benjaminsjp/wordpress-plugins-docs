import "server-only"
import { cache } from "react"
import { assertNoContentErrors } from "./issue-codes"
import { CONTENT_ROOT } from "./paths"
import { buildSearchIndex } from "./search-index"
import { loadAndValidate, type ContentData } from "./validate"

export const getContent = cache(async (): Promise<ContentData> => {
  const content = await loadAndValidate(CONTENT_ROOT)
  assertNoContentErrors(content.issues)
  return content
})

export async function getPlugins() {
  return (await getContent()).plugins
}

export async function getPlugin(slug: string) {
  return (await getPlugins()).find((plugin) => plugin.slug === slug)
}

export async function getSnippets() {
  return (await getContent()).snippets
}

export async function getSnippet(slug: string) {
  return (await getSnippets()).find((snippet) => snippet.slug === slug)
}

export async function getTaxonomy() {
  return (await getContent()).taxonomy
}

export async function getPluginGraph() {
  return (await getContent()).graph
}

export async function getSearchIndex() {
  return buildSearchIndex(await getContent())
}

export type {
  PluginRecord,
  ReleaseRecord,
} from "./load-plugins"
export type { SnippetRecord } from "./load-snippets"
export type { TaxonomyRecord } from "./load-taxonomy"
export type { ContentData } from "./validate"
export type { PluginGraph } from "./graph"
export { ISSUE_CODES } from "./issue-codes"
export type { Issue, IssueCode } from "./issue-codes"
export { buildSearchIndex }
export type { SearchRecord, SearchRecordType } from "./search-index"
