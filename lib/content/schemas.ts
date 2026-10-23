import { z } from "zod"

const nonEmptyString = z.string().trim().min(1)

export const versionSchemeSchema = z.enum(["semver", "dotted", "calver"])
export const pluginStatusSchema = z.enum(["active", "deprecated", "archived"])
export const visibilitySchema = z.enum(["public", "private"])
export const releaseChannelSchema = z.enum(["stable", "beta"])
export const dependencyTypeSchema = z.enum(["required", "optional"])

export const placementLocationSchema = z.enum([
  "flatsome-custom-css-all",
  "flatsome-custom-css-tablet",
  "flatsome-custom-css-mobile",
  "child-theme-stylesheet",
  "wordpress-additional-css",
  "other",
])

export const isoDateSchema = z.iso.date()

export const versionRequirementSchema = z.object({
  min: nonEmptyString,
  tested: nonEmptyString.optional(),
})

export const repositorySchema = z.object({
  owner: nonEmptyString,
  repo: nonEmptyString,
  visibility: visibilitySchema,
  tagPattern: nonEmptyString.optional(),
  assetPattern: nonEmptyString.optional(),
})

export const relatedSchema = z.object({
  plugins: z.array(nonEmptyString).optional(),
  snippets: z.array(nonEmptyString).optional(),
})

export const pluginJsonSchema = z.object({
  $schema: z.string().optional(),
  name: nonEmptyString,
  summary: nonEmptyString,
  versionScheme: versionSchemeSchema,
  status: pluginStatusSchema,
  repository: repositorySchema,
  tags: z.array(nonEmptyString).optional(),
  maintainer: nonEmptyString.optional(),
  replacedBy: nonEmptyString.optional(),
  related: relatedSchema.optional(),
})

export const internalDependencySchema = z.object({
  plugin: nonEmptyString,
  type: dependencyTypeSchema,
  minVersion: nonEmptyString.optional(),
  reason: nonEmptyString.optional(),
})

export const externalDependencySchema = z.object({
  external: z.object({
    name: nonEmptyString,
    slug: nonEmptyString.optional(),
    url: z.url().optional(),
  }),
  type: dependencyTypeSchema,
  minVersion: nonEmptyString.optional(),
  reason: nonEmptyString.optional(),
})

export const dependencySchema = z.union([
  internalDependencySchema,
  externalDependencySchema,
])

export const changelogSchema = z.object({
  added: z.array(nonEmptyString).optional(),
  changed: z.array(nonEmptyString).optional(),
  fixed: z.array(nonEmptyString).optional(),
  removed: z.array(nonEmptyString).optional(),
  security: z.array(nonEmptyString).optional(),
})

export const releaseJsonSchema = z.object({
  $schema: z.string().optional(),
  releaseDate: isoDateSchema,
  channel: releaseChannelSchema,
  yanked: z.object({ reason: nonEmptyString }).optional(),
  requirements: z.object({
    wordpress: versionRequirementSchema,
    php: versionRequirementSchema,
    flatsome: versionRequirementSchema.optional(),
  }),
  dependencies: z.array(dependencySchema).default([]),
  download: z
    .object({
      tag: nonEmptyString.optional(),
      asset: nonEmptyString.optional(),
      sha256: z.string().optional(),
    })
    .optional(),
  changelog: changelogSchema.optional(),
})

export const placementSchema = z.object({
  location: placementLocationSchema,
  notes: nonEmptyString.optional(),
})

export const snippetJsonSchema = z.object({
  $schema: z.string().optional(),
  name: nonEmptyString,
  summary: nonEmptyString,
  category: nonEmptyString,
  subcategory: nonEmptyString.optional(),
  tags: z.array(nonEmptyString),
  placement: placementSchema,
  compatibility: z
    .object({
      flatsome: versionRequirementSchema.optional(),
      notes: nonEmptyString.optional(),
    })
    .optional(),
  related: z.array(nonEmptyString).optional(),
  updated: isoDateSchema,
  author: nonEmptyString.optional(),
})

export const taxonomyNodeSchema = z.object({
  slug: nonEmptyString,
  label: nonEmptyString,
  description: nonEmptyString.optional(),
  subcategories: z
    .array(
      z.object({
        slug: nonEmptyString,
        label: nonEmptyString,
        description: nonEmptyString.optional(),
        subcategories: z.array(z.unknown()).optional(),
      })
    )
    .optional(),
})

export const snippetCategoriesFileSchema = z.object({
  $schema: z.string().optional(),
  categories: z.array(taxonomyNodeSchema),
})

export const tagsFileSchema = z.object({
  $schema: z.string().optional(),
  tags: z.array(
    z.object({
      slug: nonEmptyString,
      label: nonEmptyString,
      description: nonEmptyString.optional(),
    })
  ),
})

export type VersionScheme = z.infer<typeof versionSchemeSchema>
export type PluginStatus = z.infer<typeof pluginStatusSchema>
export type Visibility = z.infer<typeof visibilitySchema>
export type ReleaseChannel = z.infer<typeof releaseChannelSchema>
export type DependencyType = z.infer<typeof dependencyTypeSchema>
export type PlacementLocation = z.infer<typeof placementLocationSchema>
export type PluginJson = z.infer<typeof pluginJsonSchema>
export type ReleaseJson = z.infer<typeof releaseJsonSchema>
export type SnippetJson = z.infer<typeof snippetJsonSchema>
export type InternalDependency = z.infer<typeof internalDependencySchema>
export type ExternalDependency = z.infer<typeof externalDependencySchema>
export type Dependency = z.infer<typeof dependencySchema>
export type TaxonomyNode = z.infer<typeof taxonomyNodeSchema>
export type SnippetCategoriesFile = z.infer<typeof snippetCategoriesFileSchema>
export type TagsFile = z.infer<typeof tagsFileSchema>

export function isInternalDependency(
  dependency: Dependency
): dependency is InternalDependency {
  return "plugin" in dependency
}
