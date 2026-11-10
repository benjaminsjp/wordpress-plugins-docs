import { readFile } from "node:fs/promises"
import { notFound } from "next/navigation"
import { getPlugins } from "@/lib/content"
import {
  mediaMimeType,
  pluginMediaDir,
  pluginMediaParams,
  resolveMediaPath,
} from "@/lib/content/media"
import { CONTENT_ROOT, pluginDir } from "@/lib/content/paths"

export const dynamic = "force-static"
export const dynamicParams = false

export async function generateStaticParams() {
  const plugins = await getPlugins()
  return plugins.flatMap((plugin) =>
    pluginMediaParams(plugin.slug, plugin.resolvedMedia)
  )
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string; file: string }> }
) {
  const { slug, file } = await context.params
  const filename = decodeURIComponent(file)
  const mediaDir = pluginMediaDir(pluginDir(CONTENT_ROOT, slug))
  const filePath = resolveMediaPath(mediaDir, filename)

  if (!filePath) {
    notFound()
  }

  let body: Buffer
  try {
    body = await readFile(filePath)
  } catch {
    notFound()
  }

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": mediaMimeType(filename) ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
