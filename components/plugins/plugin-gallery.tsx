"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { PluginLightbox } from "@/components/plugins/plugin-lightbox"
import { PluginMediaFrame } from "@/components/plugins/plugin-media-frame"
import type { PluginMediaImage } from "@/lib/content/media"
import { strings } from "@/lib/strings"

export function PluginGallery({ images }: { images: PluginMediaImage[] }) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(1)

  const onSelect = useCallback((carouselApi: CarouselApi) => {
    if (!carouselApi) return
    setCurrent(carouselApi.selectedScrollSnap() + 1)
  }, [])

  useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api, onSelect])

  if (images.length === 0) {
    return null
  }

  const showControls = images.length > 1

  return (
    <div className="flex flex-col gap-3">
      <Carousel
        setApi={setApi}
        opts={{ loop: showControls, align: "start" }}
        className="w-full"
      >
        <CarouselContent className="-ml-0">
          {images.map((image, imageIndex) => (
            <CarouselItem key={image.src} className="pl-0">
              <button
                type="button"
                onClick={() => {
                  setIndex(imageIndex)
                  setOpen(true)
                }}
                className="w-full overflow-hidden rounded-4xl ring-1 ring-foreground/5"
                aria-label={strings.plugins.openScreenshot(image.alt)}
              >
                <PluginMediaFrame>
                  {/* Served from content/ via a route handler, not public/. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="size-full object-cover"
                  />
                </PluginMediaFrame>
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
        {showControls ? (
          <div className="mt-3 flex items-center justify-center gap-3">
            <CarouselPrevious
              variant="outline"
              className="static translate-none"
              aria-label={strings.plugins.carouselPrevious}
            />
            <p className="min-w-32 text-center text-sm text-muted-foreground">
              {strings.plugins.carouselStatus(current, images.length)}
            </p>
            <CarouselNext
              variant="outline"
              className="static translate-none"
              aria-label={strings.plugins.carouselNext}
            />
          </div>
        ) : null}
      </Carousel>
      <PluginLightbox
        open={open}
        onOpenChange={setOpen}
        images={images}
        index={index}
        onIndexChange={setIndex}
        mode="image"
      />
    </div>
  )
}
