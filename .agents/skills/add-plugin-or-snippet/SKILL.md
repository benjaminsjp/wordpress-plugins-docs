---
name: add-plugin-or-snippet
description: Adds WordPress plugin docs or Flatsome CSS snippets as files under content/ only. Use when adding a plugin, a plugin version/release, a CSS snippet, scaffolding new-release, or when the user pastes a GitHub plugin repo URL.
---

# Add plugin or snippet

Follow [README.md](../../../README.md) section **Slik legger du til innhold**. Do not invent a parallel process.

## Hard rules

- Write files under `content/` only. Do not change `app/`, `lib/`, components, or tests unless a test hard-codes the plugin/snippet list (then update that assertion).
- Visible copy (`name`, `summary`, MDX) in Norwegian (`nb`). Slugs, filenames, and IDs in English kebab-case.
- Copy an existing plugin or snippet as the template.
- Never invent `download.sha256`. Copy GitHub's asset `digest` (`sha256:…` → 64 hex chars) or omit the field.
- Never edit `tag`, `asset`, or `sha256` on an existing release file. Yank instead.
- Do not put GitHub tokens in files, Vercel, or chat. Optional local `$env:GITHUB_TOKEN` for private repos only.
- Run `npm run validate` before finishing. Restart `next dev` after a new slug (`dynamicParams = false`).

## Plugin

1. Confirm a GitHub Release exists (tag + ZIP asset). Prefer `npm run new-release -- <slug> <version>` for the release JSON.
2. Create `content/plugins/<slug>/plugin.json`, `docs/overview.mdx`, and `releases/<version>.json`.
3. Default ZIP `{slug}-{version}.zip` and tag `v{version}`. Set `assetPattern` only if the real asset name differs.
4. Plugin `tags` are free text. `related.*` slugs must already exist.
5. Set required `author` to a slug from `content/taxonomy/authors.json`. Add a new author there before first use. Do not confuse with optional `maintainer` (org/team).

## Snippet

1. Create `content/snippets/<slug>/snippet.json` and `snippet.css` (non-empty).
2. `category`, optional `subcategory`, and every `tags` entry must exist in `content/taxonomy/`. Do not invent taxonomy.
3. `placement.location` must be one of the values listed in the README.

## After writing

```bash
npm run validate
```

Fix errors. Warnings (`sha256-missing`, unused snippet tags) are allowed. Do not commit unless the user asks.
