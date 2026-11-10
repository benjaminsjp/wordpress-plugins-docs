import { access } from "node:fs/promises"
import path from "node:path"
import { ISSUE_CODES, type Issue } from "./issue-codes"
import {
  IMAGE_FILENAME_PATTERN,
  VIDEO_FILENAME_PATTERN,
} from "./paths"
import type { PluginJson } from "./schemas"

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
}

export type PluginMediaImage = {
  src: string
  alt: string
  featured?: boolean
  url: string
}

export type PluginResolvedMedia = {
  images: PluginMediaImage[]
  featured: PluginMediaImage | undefined
  video: { src: string; url: string } | undefined
}

export const EMPTY_PLUGIN_MEDIA: PluginResolvedMedia = {
  images: [],
  featured: undefined,
  video: undefined,
}

export function pluginMediaDir(pluginDirectory: string): string {
  return path.join(pluginDirectory, "media")
}

export function pluginMediaUrl(slug: string, file: string): string {
  return `/plugins/${slug}/media/${file}`
}

export function isImageFilename(file: string): boolean {
  return IMAGE_FILENAME_PATTERN.test(file)
}

export function isVideoFilename(file: string): boolean {
  return VIDEO_FILENAME_PATTERN.test(file)
}

export function isSafeMediaFilename(file: string): boolean {
  if (file.includes("/") || file.includes("\\") || file.includes("..")) {
    return false
  }
  return isImageFilename(file) || isVideoFilename(file)
}

export function mediaMimeType(file: string): string | undefined {
  return MIME_TYPES[path.extname(file).toLowerCase()]
}

export function resolveMediaPath(
  mediaDir: string,
  file: string
): string | null {
  if (!isSafeMediaFilename(file)) {
    return null
  }

  const resolved = path.resolve(mediaDir, file)
  const relative = path.relative(mediaDir, resolved)
  if (
    relative === "" ||
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    return null
  }

  return resolved
}

export async function loadPluginMedia(
  dir: string,
  slug: string,
  relativePluginFile: string,
  media: PluginJson["media"]
): Promise<{ resolved: PluginResolvedMedia; issues: Issue[] }> {
  if (!media) {
    return { resolved: EMPTY_PLUGIN_MEDIA, issues: [] }
  }

  const issues: Issue[] = []
  const mediaDir = pluginMediaDir(dir)
  const images: PluginMediaImage[] = []
  const featuredIndexes: number[] = []

  for (const [index, image] of (media.images ?? []).entries()) {
    const fieldPath = `media.images.${index}.src`
    const resolvedPath = resolveMediaPath(mediaDir, image.src)

    if (!resolvedPath) {
      issues.push({
        code: ISSUE_CODES.MEDIA_INVALID_PATH,
        severity: "error",
        file: relativePluginFile,
        path: fieldPath,
        message: `Media filename "${image.src}" is not a safe basename.`,
      })
      continue
    }

    if (!(await fileExists(resolvedPath))) {
      issues.push({
        code: ISSUE_CODES.MEDIA_MISSING,
        severity: "error",
        file: relativePluginFile,
        path: fieldPath,
        message: `Media file "${image.src}" was not found in media/.`,
      })
      continue
    }

    if (image.featured) {
      featuredIndexes.push(images.length)
    }

    images.push({
      src: image.src,
      alt: image.alt,
      featured: image.featured,
      url: pluginMediaUrl(slug, image.src),
    })
  }

  if (featuredIndexes.length > 1) {
    issues.push({
      code: ISSUE_CODES.MEDIA_FEATURED_DUPLICATE,
      severity: "error",
      file: relativePluginFile,
      path: "media.images",
      message: `Plugin "${slug}" has more than one featured image.`,
    })
  }

  let video: PluginResolvedMedia["video"]

  if (media.video) {
    const resolvedPath = resolveMediaPath(mediaDir, media.video)
    if (!resolvedPath) {
      issues.push({
        code: ISSUE_CODES.MEDIA_INVALID_PATH,
        severity: "error",
        file: relativePluginFile,
        path: "media.video",
        message: `Video filename "${media.video}" is not a safe basename.`,
      })
    } else if (!(await fileExists(resolvedPath))) {
      issues.push({
        code: ISSUE_CODES.VIDEO_MISSING,
        severity: "error",
        file: relativePluginFile,
        path: "media.video",
        message: `Video file "${media.video}" was not found in media/.`,
      })
    } else {
      video = {
        src: media.video,
        url: pluginMediaUrl(slug, media.video),
      }
    }
  }

  return {
    resolved: {
      images,
      featured: images.find((image) => image.featured),
      video,
    },
    issues,
  }
}

export function pluginMediaParams(
  slug: string,
  media: PluginResolvedMedia
): Array<{ slug: string; file: string }> {
  const files = new Set<string>()
  for (const image of media.images) {
    files.add(image.src)
  }
  if (media.video) {
    files.add(media.video.src)
  }
  return [...files].map((file) => ({ slug, file }))
}

async function fileExists(file: string): Promise<boolean> {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}
