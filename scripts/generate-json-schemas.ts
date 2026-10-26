import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { z, type ZodType } from "zod"
import {
  authorsFileSchema,
  pluginJsonSchema,
  releaseJsonSchema,
  snippetCategoriesFileSchema,
  snippetJsonSchema,
  tagsFileSchema,
} from "../lib/content/schemas"

const outDir = path.join(process.cwd(), "schemas")

const schemas: Array<[string, ZodType]> = [
  ["plugin.schema.json", pluginJsonSchema],
  ["release.schema.json", releaseJsonSchema],
  ["snippet.schema.json", snippetJsonSchema],
  ["snippet-categories.schema.json", snippetCategoriesFileSchema],
  ["tags.schema.json", tagsFileSchema],
  ["authors.schema.json", authorsFileSchema],
]

async function main() {
  await mkdir(outDir, { recursive: true })

  for (const [filename, schema] of schemas) {
    const json = z.toJSONSchema(schema, {
      target: "draft-07",
      io: "input",
    })
    const file = path.join(outDir, filename)
    await writeFile(file, `${JSON.stringify(json, null, "\t")}\n`, "utf8")
    console.log(`Wrote ${path.relative(process.cwd(), file)}`)
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
