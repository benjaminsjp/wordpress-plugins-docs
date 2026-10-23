import { readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"
import { ISSUE_CODES, type Issue } from "./issue-codes"
import {
  isValidSlug,
  RESERVED_SNIPPET_SLUGS,
  toContentPath,
  type ContentPaths,
} from "./paths"
import { parseWithSchema, readJson } from "./read-json"
import { snippetJsonSchema, type SnippetJson } from "./schemas"

export type SnippetRecord = SnippetJson & {
  slug: string
  file: string
  css: string
  cssFile: string
  notesFile: string | null
}

export async function loadSnippets(
  paths: ContentPaths
): Promise<{ snippets: SnippetRecord[]; issues: Issue[] }> {
  const issues: Issue[] = []
  const snippets: SnippetRecord[] = []

  let entries: string[] = []
  try {
    entries = await readdir(paths.snippets)
  } catch {
    return { snippets, issues }
  }

  for (const slug of entries) {
    const dir = path.join(paths.snippets, slug)
    const info = await stat(dir).catch(() => null)
    if (!info?.isDirectory() || slug.startsWith(".")) {
      continue
    }

    const loaded = await loadSnippet(paths.root, dir, slug)
    issues.push(...loaded.issues)
    if (loaded.snippet) {
      snippets.push(loaded.snippet)
    }
  }

  snippets.sort((left, right) => left.slug.localeCompare(right.slug))
  return { snippets, issues }
}

async function loadSnippet(
  root: string,
  dir: string,
  slug: string
): Promise<{ snippet: SnippetRecord | undefined; issues: Issue[] }> {
  const issues: Issue[] = []
  const snippetFile = path.join(dir, "snippet.json")
  const relativeSnippetFile = toContentPath(root, snippetFile)
  const cssPath = path.join(dir, "snippet.css")
  const cssFile = toContentPath(root, cssPath)

  if (!isValidSlug(slug)) {
    issues.push({
      code: ISSUE_CODES.SLUG_INVALID,
      severity: "error",
      file: relativeSnippetFile,
      message: `Snippet slug "${slug}" must be kebab-case.`,
    })
  }

  if (RESERVED_SNIPPET_SLUGS.has(slug)) {
    issues.push({
      code: ISSUE_CODES.SLUG_RESERVED,
      severity: "error",
      file: relativeSnippetFile,
      message: `Snippet slug "${slug}" is reserved.`,
    })
  }

  const json = await readJson(snippetFile, relativeSnippetFile)
  issues.push(...json.issues)
  if (json.issues.length) {
    return { snippet: undefined, issues }
  }

  const parsed = parseWithSchema(
    snippetJsonSchema,
    json.data,
    relativeSnippetFile
  )
  issues.push(...parsed.issues)
  if (!parsed.value) {
    return { snippet: undefined, issues }
  }

  let css = ""
  try {
    css = await readFile(cssPath, "utf8")
  } catch {
    issues.push({
      code: ISSUE_CODES.SNIPPET_CSS_EMPTY,
      severity: "error",
      file: cssFile,
      message: `Snippet "${slug}" is missing snippet.css.`,
    })
    return { snippet: undefined, issues }
  }

  if (css.trim().length === 0) {
    issues.push({
      code: ISSUE_CODES.SNIPPET_CSS_EMPTY,
      severity: "error",
      file: cssFile,
      message: `Snippet "${slug}" has an empty snippet.css.`,
    })
  }

  if (
    parsed.value.placement.location === "other" &&
    !parsed.value.placement.notes
  ) {
    issues.push({
      code: ISSUE_CODES.PLACEMENT_NOTES_REQUIRED,
      severity: "error",
      file: relativeSnippetFile,
      path: "placement.notes",
      message: `Placement "other" requires notes.`,
    })
  }

  const scopedPlacement =
    parsed.value.placement.location === "flatsome-custom-css-tablet" ||
    parsed.value.placement.location === "flatsome-custom-css-mobile"

  if (scopedPlacement && /@media\b/i.test(css)) {
    issues.push({
      code: ISSUE_CODES.SNIPPET_MEDIA_IN_SCOPED_PLACEMENT,
      severity: "warning",
      file: cssFile,
      message: `Snippet "${slug}" is placed in a screen-size-scoped Flatsome field but contains @media rules.`,
    })
  }

  const notesFile = await existingFile(root, path.join(dir, "notes.mdx"))

  return {
    snippet: {
      ...parsed.value,
      slug,
      file: relativeSnippetFile,
      css,
      cssFile,
      notesFile,
    },
    issues,
  }
}

async function existingFile(
  root: string,
  file: string
): Promise<string | null> {
  try {
    await readFile(file)
    return toContentPath(root, file)
  } catch {
    return null
  }
}
