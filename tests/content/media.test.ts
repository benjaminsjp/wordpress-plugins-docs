import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  isSafeMediaFilename,
  mediaMimeType,
  pluginMediaParams,
  pluginMediaUrl,
  resolveMediaPath,
} from "@/lib/content/media"
import { pluginJsonSchema } from "@/lib/content/schemas"

describe("plugin media helpers", () => {
  it("builds a plugin-local media URL", () => {
    expect(pluginMediaUrl("flatsome-ekstra-farger", "admin-ekstra-farger.jpg")).toBe(
      "/plugins/flatsome-ekstra-farger/media/admin-ekstra-farger.jpg"
    )
  })

  it("accepts kebab-case image and video basenames", () => {
    expect(isSafeMediaFilename("admin-ekstra-farger.jpg")).toBe(true)
    expect(isSafeMediaFilename("demo.webm")).toBe(true)
    expect(isSafeMediaFilename("../secret.jpg")).toBe(false)
    expect(isSafeMediaFilename("folder/admin.png")).toBe(false)
    expect(isSafeMediaFilename("Admin.PNG")).toBe(false)
  })

  it("resolves files inside the media directory only", () => {
    const mediaDir = path.join("content", "plugins", "demo", "media")
    expect(resolveMediaPath(mediaDir, "admin.png")).toBe(
      path.resolve(mediaDir, "admin.png")
    )
    expect(resolveMediaPath(mediaDir, "../plugin.json")).toBeNull()
  })

  it("maps extensions to MIME types", () => {
    expect(mediaMimeType("admin.jpg")).toBe("image/jpeg")
    expect(mediaMimeType("demo.mp4")).toBe("video/mp4")
    expect(mediaMimeType("notes.txt")).toBeUndefined()
  })

  it("rejects path-like media filenames in the schema", () => {
    const parsed = pluginJsonSchema.safeParse({
      name: "Demo",
      summary: "Test",
      versionScheme: "semver",
      status: "active",
      repository: { owner: "ORG", repo: "demo", visibility: "public" },
      author: "benjamin",
      media: {
        images: [{ src: "../secret.jpg", alt: "Hemmelig" }],
      },
    })
    expect(parsed.success).toBe(false)
  })

  it("dedupes static params for images and video", () => {
    expect(
      pluginMediaParams("demo", {
        images: [
          {
            src: "admin.png",
            alt: "Admin",
            featured: true,
            url: "/plugins/demo/media/admin.png",
          },
        ],
        featured: {
          src: "admin.png",
          alt: "Admin",
          featured: true,
          url: "/plugins/demo/media/admin.png",
        },
        video: {
          src: "demo.mp4",
          url: "/plugins/demo/media/demo.mp4",
        },
      })
    ).toEqual([
      { slug: "demo", file: "admin.png" },
      { slug: "demo", file: "demo.mp4" },
    ])
  })
})
