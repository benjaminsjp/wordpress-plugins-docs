"use client"

import { useState } from "react"
import { PluginLightbox } from "@/components/plugins/plugin-lightbox"
import { PluginMediaFrame } from "@/components/plugins/plugin-media-frame"
import type { PluginMediaImage } from "@/lib/content/media"
import { strings } from "@/lib/strings"

export function PluginHeroMedia({
  images,
  featured,
  video,
}: {
  images: PluginMediaImage[]
  featured?: PluginMediaImage
  video?: { src: string; url: string }
}) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<"image" | "video">(video ? "video" : "image")

  if (!featured && !video) {
    return null
  }

  const featuredIndex = featured
    ? Math.max(
        images.findIndex((image) => image.src === featured.src),
        0
      )
    : 0

  function openLightbox() {
    if (video) {
      setMode("video")
    } else {
      setMode("image")
      setIndex(featuredIndex)
    }
    setOpen(true)
  }

  const label = video
    ? strings.plugins.openVideo
    : strings.plugins.openScreenshot(featured?.alt ?? strings.plugins.screenshots)

  return (
    <>
      <button
        type="button"
        onClick={openLightbox}
        className="block w-full overflow-hidden rounded-4xl ring-1 ring-foreground/5"
        aria-label={label}
      >
        <PluginMediaFrame>
          {video ? (
            <video
              src={video.url}
              poster={featured?.url}
              autoPlay
              muted
              loop
              playsInline
              className="size-full object-cover"
            />
          ) : featured ? (
            // Served from content/ via a route handler, not public/.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={featured.url}
              alt=""
              className="size-full object-cover"
            />
          ) : null}
        </PluginMediaFrame>
      </button>
      <PluginLightbox
        open={open}
        onOpenChange={setOpen}
        images={images}
        index={index}
        onIndexChange={setIndex}
        video={video}
        mode={mode}
      />
    </>
  )
}
