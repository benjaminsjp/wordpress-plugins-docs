import type { Issue } from "./issue-codes"
import { toContentPath, type ContentPaths } from "./paths"
import { parseWithSchema, readJson } from "./read-json"
import {
  snippetCategoriesFileSchema,
  tagsFileSchema,
  type TaxonomyNode,
} from "./schemas"

export type CategoryRecord = {
  slug: string
  label: string
  description?: string
  subcategories: Array<{
    slug: string
    label: string
    description?: string
    subcategories?: unknown[]
  }>
}

export type TagRecord = {
  slug: string
  label: string
  description?: string
}

export type TaxonomyRecord = {
  categories: CategoryRecord[]
  tags: TagRecord[]
  files: {
    categories: string
    tags: string
  }
}

export async function loadTaxonomy(
  paths: ContentPaths
): Promise<{ taxonomy: TaxonomyRecord | undefined; issues: Issue[] }> {
  const issues: Issue[] = []
  const categoriesFile = toContentPath(paths.root, paths.categories)
  const tagsFile = toContentPath(paths.root, paths.tags)

  const [categoriesJson, tagsJson] = await Promise.all([
    readJson(paths.categories, categoriesFile),
    readJson(paths.tags, tagsFile),
  ])

  issues.push(...categoriesJson.issues, ...tagsJson.issues)

  const categoriesParsed = categoriesJson.issues.length
    ? { value: undefined, issues: [] }
    : parseWithSchema(
        snippetCategoriesFileSchema,
        categoriesJson.data,
        categoriesFile
      )
  const tagsParsed = tagsJson.issues.length
    ? { value: undefined, issues: [] }
    : parseWithSchema(tagsFileSchema, tagsJson.data, tagsFile)

  issues.push(...categoriesParsed.issues, ...tagsParsed.issues)

  if (!categoriesParsed.value || !tagsParsed.value) {
    return { taxonomy: undefined, issues }
  }

  const taxonomy: TaxonomyRecord = {
    categories: categoriesParsed.value.categories.map(toCategoryRecord),
    tags: tagsParsed.value.tags,
    files: {
      categories: categoriesFile,
      tags: tagsFile,
    },
  }

  return { taxonomy, issues }
}

function toCategoryRecord(node: TaxonomyNode): CategoryRecord {
  return {
    slug: node.slug,
    label: node.label,
    description: node.description,
    subcategories: (node.subcategories ?? []).map((subcategory) => ({
      slug: subcategory.slug,
      label: subcategory.label,
      description: subcategory.description,
      subcategories: subcategory.subcategories,
    })),
  }
}
