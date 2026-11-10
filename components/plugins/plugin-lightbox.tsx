"use client"

import { useEffect } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { PluginMediaImage } from "@/lib/content/media"
import { strings } from "@/lib/strings"

export function PluginLightbox({
  open,
  onOpenChange,
  images,
  index,
  onIndexChange,
  video,
  mode,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  images: PluginMediaImage[]
  index: number
  onIndexChange: (index: number) => void
  video?: { src: string; url: string }
  mode: "image" | "video"
}) {
  const image = images[index]
  const showNav = mode === "image" && images.length > 1

  useEffect(() => {
    if (!open || !showNav) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        onIndexChange((index - 1 + images.length) % images.length)
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        onIndexChange((index + 1) % images.length)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [images.length, index, onIndexChange, open, showNav])

  const title =
    mode === "video"
      ? strings.plugins.lightboxVideoTitle
      : (image?.alt ?? strings.plugins.screenshots)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(90vw,72rem)] gap-3 p-3 sm:max-w-[min(90vw,72rem)]">
        <DialogHeader>
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {strings.plugins.lightboxDescription}
          </DialogDescription>
        </DialogHeader>
        {mode === "video" && video ? (
          <video
            src={video.url}
            controls
            autoPlay
            className="max-h-[85vh] w-full rounded-2xl bg-background"
          />
        ) : image ? (
          // Served from content/ via a route handler, not public/.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.alt}
            className="max-h-[85vh] w-full rounded-2xl object-contain"
          />
        ) : null}
        {showNav ? (
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() =>
                onIndexChange((index - 1 + images.length) % images.length)
              }
              aria-label={strings.plugins.lightboxPrevious}
            >
              <ChevronLeftIcon />
            </Button>
            <p className="text-sm text-muted-foreground">
              {index + 1} / {images.length}
            </p>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => onIndexChange((index + 1) % images.length)}
              aria-label={strings.plugins.lightboxNext}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
