import path from "node:path"

export const CONTENT_ROOT = path.join(process.cwd(), "content")

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
export const RESERVED_SNIPPET_SLUGS = new Set(["category", "tag"])

export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
export const SHA256_PATTERN = /^[0-9a-f]{64}$/i

export type ContentPaths = {
  root: string
  plugins: string
  snippets: string
  taxonomy: string
  categories: string
  tags: string
  authors: string
}

export function getContentPaths(root: string = CONTENT_ROOT): ContentPaths {
  return {
    root,
    plugins: path.join(root, "plugins"),
    snippets: path.join(root, "snippets"),
    taxonomy: path.join(root, "taxonomy"),
    categories: path.join(root, "taxonomy", "snippet-categories.json"),
    tags: path.join(root, "taxonomy", "tags.json"),
    authors: path.join(root, "taxonomy", "authors.json"),
  }
}

export function pluginDir(root: string, slug: string): string {
  return path.join(root, "plugins", slug)
}

export function snippetDir(root: string, slug: string): string {
  return path.join(root, "snippets", slug)
}

export function toContentPath(root: string, file: string): string {
  return path.relative(root, file).split(path.sep).join("/")
}

export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value)
}
