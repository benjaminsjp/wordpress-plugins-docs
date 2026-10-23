import type { ComponentType } from "react"

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
