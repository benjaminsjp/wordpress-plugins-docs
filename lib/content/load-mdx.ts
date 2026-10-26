import { readFile } from "node:fs/promises"
import path from "node:path"
import type { ComponentType } from "react"
import { CONTENT_ROOT, pluginDir, snippetDir } from "./paths"

export type PluginDocName = "overview" | "installation" | "usage"

export async function loadPluginDoc(
  slug: string,
  doc: PluginDocName
): Promise<ComponentType | null> {
  try {
    const mod = await import(`@/content/plugins/${slug}/docs/${doc}.mdx`)
    return mod.default
  } catch {
    return null
  }
}

export async function readPluginDocSource(
  slug: string,
  doc: PluginDocName
): Promise<string | null> {
  try {
    return await readFile(
      path.join(pluginDir(CONTENT_ROOT, slug), "docs", `${doc}.mdx`),
      "utf8"
    )
  } catch {
    return null
  }
}

export async function loadSnippetNotes(
  slug: string
): Promise<ComponentType | null> {
  try {
    const mod = await import(`@/content/snippets/${slug}/notes.mdx`)
    return mod.default
  } catch {
    return null
  }
}

export async function readSnippetNotesSource(
  slug: string
): Promise<string | null> {
  try {
    return await readFile(
      path.join(snippetDir(CONTENT_ROOT, slug), "notes.mdx"),
      "utf8"
    )
  } catch {
    return null
  }
}
