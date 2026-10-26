import { mkdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "invalid"
)
const HASH = "a".repeat(64)

type Files = Record<string, string>

async function writeFixture(name: string, files: Files) {
  const dir = path.join(root, name)
  await rm(dir, { recursive: true, force: true })
  for (const [relative, content] of Object.entries(files)) {
    const file = path.join(dir, relative)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, content, "utf8")
  }
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, "\t")}\n`
}

function taxonomy(options?: {
  categories?: unknown[]
  tags?: unknown[]
  authors?: unknown[]
}): Files {
  return {
    "taxonomy/snippet-categories.json": json({
      categories: options?.categories ?? [
        {
          slug: "misc",
          label: "Div",
          subcategories: [{ slug: "general", label: "Generelt" }],
        },
        {
          slug: "header",
          label: "Header",
          subcategories: [{ slug: "navbar", label: "Navigasjon" }],
        },
      ],
    }),
    "taxonomy/tags.json": json({
      tags: options?.tags ?? [{ slug: "spacing", label: "Avstand" }],
    }),
    "taxonomy/authors.json": json({
      authors: options?.authors ?? [
        { slug: "benjamin", label: "Benjamin Pedersen" },
      ],
    }),
  }
}

function pluginFiles(options: {
  slug: string
  plugin?: Record<string, unknown>
  releases?: Array<{ version: string; body?: Record<string, unknown> }>
  overview?: boolean
}): Files {
  const files: Files = {
    [`plugins/${options.slug}/plugin.json`]: json({
      name: options.slug,
      summary: "Test plugin",
      versionScheme: "semver",
      status: "active",
      repository: {
        owner: "ORG",
        repo: options.slug,
        visibility: "public",
      },
      author: "benjamin",
      ...options.plugin,
    }),
  }

  if (options.overview !== false) {
    files[`plugins/${options.slug}/docs/overview.mdx`] = "# Test\n"
  }

  for (const release of options.releases ?? [
    { version: "1.0.0", body: {} },
  ]) {
    files[`plugins/${options.slug}/releases/${release.version}.json`] = json({
      releaseDate: "2026-01-01",
      channel: "stable",
      requirements: {
        wordpress: { min: "6.0" },
        php: { min: "8.1" },
      },
      download: { sha256: HASH },
      ...release.body,
    })
  }

  return files
}

function snippetFiles(options: {
  slug: string
  snippet?: Record<string, unknown>
  css?: string
}): Files {
  return {
    [`snippets/${options.slug}/snippet.json`]: json({
      name: options.slug,
      summary: "Test snippet",
      category: "misc",
      tags: ["spacing"],
      placement: { location: "flatsome-custom-css-all" },
      updated: "2026-01-01",
      ...options.snippet,
    }),
    [`snippets/${options.slug}/snippet.css`]: options.css ?? ".demo { color: red; }\n",
  }
}

const fixtures: Record<string, Files> = {
  "slug-invalid": {
    ...taxonomy(),
    ...pluginFiles({ slug: "Not_Valid" }),
  },
  "slug-reserved": {
    ...taxonomy(),
    ...snippetFiles({ slug: "category" }),
  },
  schema: {
    ...taxonomy(),
    "plugins/demo/plugin.json": json({
      summary: "Missing name",
      versionScheme: "semver",
      status: "active",
      repository: {
        owner: "ORG",
        repo: "demo",
        visibility: "public",
      },
    }),
    "plugins/demo/docs/overview.mdx": "# Test\n",
  },
  "release-date-future": {
    ...taxonomy(),
    ...pluginFiles({
      slug: "demo",
      releases: [{ version: "1.0.0", body: { releaseDate: "2099-01-01" } }],
    }),
  },
  "version-invalid": {
    ...taxonomy(),
    ...pluginFiles({
      slug: "demo",
      releases: [{ version: "1.0" }],
    }),
  },
  "version-leading-v": {
    ...taxonomy(),
    ...pluginFiles({
      slug: "demo",
      releases: [{ version: "v1.0.0" }],
    }),
  },
  "github-owner-invalid": {
    ...taxonomy(),
    ...pluginFiles({
      slug: "demo",
      plugin: {
        repository: { owner: "-bad", repo: "demo", visibility: "public" },
      },
    }),
  },
  "github-repo-invalid": {
    ...taxonomy(),
    ...pluginFiles({
      slug: "demo",
      plugin: {
        repository: { owner: "ORG", repo: "..", visibility: "public" },
      },
    }),
  },
  "pattern-missing-version": {
    ...taxonomy(),
    ...pluginFiles({
      slug: "demo",
      plugin: {
        repository: {
          owner: "ORG",
          repo: "demo",
          visibility: "public",
          tagPattern: "release",
        },
      },
    }),
  },
  "pattern-unknown-placeholder": {
    ...taxonomy(),
    ...pluginFiles({
      slug: "demo",
      plugin: {
        repository: {
          owner: "ORG",
          repo: "demo",
          visibility: "public",
          tagPattern: "v{version}-{hash}",
        },
      },
    }),
  },
  "asset-not-zip": {
    ...taxonomy(),
    ...pluginFiles({
      slug: "demo",
      plugin: {
        repository: {
          owner: "ORG",
          repo: "demo",
          visibility: "public",
          assetPattern: "{slug}-{version}.tar",
        },
      },
    }),
  },
  "sha256-invalid": {
    ...taxonomy(),
    ...pluginFiles({
      slug: "demo",
      releases: [{ version: "1.0.0", body: { download: { sha256: "abc" } } }],
    }),
  },
  "sha256-missing": {
    ...taxonomy(),
    ...pluginFiles({
      slug: "demo",
      releases: [{ version: "1.0.0", body: { download: {} } }],
    }),
  },
  "download-duplicate": {
    ...taxonomy(),
    ...pluginFiles({
      slug: "demo",
      releases: [
        {
          version: "1.0.0",
          body: { download: { tag: "v1", asset: "plugin.zip", sha256: HASH } },
        },
        {
          version: "1.0.1",
          body: { download: { tag: "v1", asset: "plugin.zip", sha256: HASH } },
        },
      ],
    }),
  },
  "ref-missing": {
    ...taxonomy(),
    ...pluginFiles({
      slug: "demo",
      plugin: { related: { plugins: ["does-not-exist"] } },
    }),
  },
  "self-dependency": {
    ...taxonomy(),
    ...pluginFiles({
      slug: "demo",
      releases: [
        {
          version: "1.0.0",
          body: {
            dependencies: [{ plugin: "demo", type: "required" }],
          },
        },
      ],
    }),
  },
  "min-version-invalid": {
    ...taxonomy(),
    ...pluginFiles({
      slug: "library",
      plugin: { versionScheme: "dotted" },
      releases: [{ version: "2.1" }],
    }),
    ...pluginFiles({
      slug: "demo",
      releases: [
        {
          version: "1.0.0",
          body: {
            dependencies: [
              { plugin: "library", type: "required", minVersion: "nope" },
            ],
          },
        },
      ],
    }),
  },
  "min-version-unsatisfied": {
    ...taxonomy(),
    ...pluginFiles({
      slug: "library",
      releases: [{ version: "1.0.0" }],
    }),
    ...pluginFiles({
      slug: "demo",
      releases: [
        {
          version: "1.0.0",
          body: {
            dependencies: [
              { plugin: "library", type: "required", minVersion: "9.0.0" },
            ],
          },
        },
      ],
    }),
  },
  "cycle-required": {
    ...taxonomy(),
    ...pluginFiles({
      slug: "alpha",
      releases: [
        {
          version: "1.0.0",
          body: {
            dependencies: [{ plugin: "beta", type: "required" }],
          },
        },
      ],
    }),
    ...pluginFiles({
      slug: "beta",
      releases: [
        {
          version: "1.0.0",
          body: {
            dependencies: [{ plugin: "alpha", type: "required" }],
          },
        },
      ],
    }),
  },
  "cycle-optional": {
    ...taxonomy(),
    ...pluginFiles({
      slug: "alpha",
      releases: [
        {
          version: "1.0.0",
          body: {
            dependencies: [{ plugin: "beta", type: "optional" }],
          },
        },
      ],
    }),
    ...pluginFiles({
      slug: "beta",
      releases: [
        {
          version: "1.0.0",
          body: {
            dependencies: [{ plugin: "alpha", type: "optional" }],
          },
        },
      ],
    }),
  },
  "taxonomy-duplicate-slug": {
    ...taxonomy({
      categories: [
        { slug: "header", label: "Header" },
        { slug: "header", label: "Topp" },
      ],
    }),
  },
  "taxonomy-duplicate-label": {
    ...taxonomy({
      tags: [
        { slug: "shadow", label: "Skygge" },
        { slug: "shade", label: "Skygge" },
      ],
    }),
  },
  "taxonomy-too-deep": {
    ...taxonomy({
      categories: [
        {
          slug: "header",
          label: "Header",
          subcategories: [
            {
              slug: "navbar",
              label: "Navigasjon",
              subcategories: [{ slug: "too-deep", label: "For dyp" }],
            },
          ],
        },
      ],
    }),
  },
  "category-unknown": {
    ...taxonomy(),
    ...snippetFiles({
      slug: "demo-snippet",
      snippet: { category: "does-not-exist" },
    }),
  },
  "subcategory-unknown": {
    ...taxonomy(),
    ...snippetFiles({
      slug: "demo-snippet",
      snippet: { category: "header", subcategory: "does-not-exist" },
    }),
  },
  "tag-unknown": {
    ...taxonomy(),
    ...snippetFiles({
      slug: "demo-snippet",
      snippet: { tags: ["does-not-exist"] },
    }),
  },
  "tag-unused": {
    ...taxonomy({
      tags: [
        { slug: "spacing", label: "Avstand" },
        { slug: "shadow", label: "Skygge" },
      ],
    }),
    ...snippetFiles({ slug: "demo-snippet" }),
  },
  "overview-missing": {
    ...taxonomy(),
    ...pluginFiles({ slug: "demo", overview: false }),
  },
  "snippet-css-empty": {
    ...taxonomy(),
    ...snippetFiles({ slug: "demo-snippet", css: "   \n" }),
  },
  "plugin-no-releases": {
    ...taxonomy(),
    ...pluginFiles({ slug: "demo", releases: [] }),
  },
  "plugin-author-unknown": {
    ...taxonomy(),
    ...pluginFiles({
      slug: "demo",
      plugin: { author: "does-not-exist" },
    }),
  },
}

async function main() {
  await mkdir(root, { recursive: true })
  for (const [name, files] of Object.entries(fixtures)) {
    await writeFixture(name, files)
    console.log(`Wrote ${name}`)
  }
}

main()
