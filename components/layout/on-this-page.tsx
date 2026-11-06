"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { strings } from "@/lib/strings"
import type { TocItem } from "@/lib/toc"
import { cn } from "@/lib/utils"

const VISIBLE_RATIO = 0.9

function lineOffset(level: TocItem["level"]): number {
  return level === 3 ? 16 : 8
}

function textOffset(level: TocItem["level"]): number {
  return level === 3 ? 32 : 20
}

type ItemPosition = {
  id: string
  x: number
  top: number
  bottom: number
}

function measurePositions(list: HTMLElement, items: TocItem[]): ItemPosition[] {
  const anchors = new Map<string, HTMLAnchorElement>()
  for (const anchor of list.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    const href = anchor.getAttribute("href")
    if (href) anchors.set(href, anchor)
  }

  const positions: ItemPosition[] = []
  for (const item of items) {
    const anchor = anchors.get(`#${item.id}`)
    if (!anchor) continue

    const styles = getComputedStyle(anchor)
    const paddingTop = Number.parseFloat(styles.paddingTop)
    const paddingBottom = Number.parseFloat(styles.paddingBottom)
    positions.push({
      id: item.id,
      x: lineOffset(item.level) + 0.5,
      top: anchor.offsetTop + paddingTop,
      bottom: anchor.offsetTop + anchor.clientHeight - paddingBottom,
    })
  }

  return positions
}

function trackPath(positions: ItemPosition[]): string {
  let path = ""
  let previous: ItemPosition | undefined

  for (const position of positions) {
    if (previous) {
      path += ` C ${previous.x} ${position.top - 4} ${position.x} ${previous.bottom + 4} ${position.x} ${position.top} L${position.x} ${position.bottom}`
    } else {
      path += `M${position.x} ${position.top} L${position.x} ${position.bottom}`
    }
    previous = position
  }

  return path
}

function applyClip(
  highlight: SVGSVGElement,
  positions: ItemPosition[],
  activeIds: readonly string[]
) {
  const active = new Set(activeIds)
  let first: ItemPosition | undefined
  let last: ItemPosition | undefined

  for (const position of positions) {
    if (!active.has(position.id)) continue
    if (!first) first = position
    last = position
  }

  if (!first || !last) {
    highlight.style.clipPath = "inset(100%)"
    return
  }

  highlight.style.clipPath = `polygon(0 ${first.top}px, 100% ${first.top}px, 100% ${last.bottom}px, 0 ${last.bottom}px)`
}

function paintTrack(
  list: HTMLElement,
  items: TocItem[],
  muted: SVGPathElement,
  highlightPath: SVGPathElement,
  highlight: SVGSVGElement,
  activeIds: readonly string[]
): ItemPosition[] {
  const positions = measurePositions(list, items)
  const path = trackPath(positions)
  muted.setAttribute("d", path)
  highlightPath.setAttribute("d", path)

  let width = 0
  let height = 0
  for (const position of positions) {
    width = Math.max(width, position.x + 8)
    height = Math.max(height, position.bottom)
  }

  for (const svg of [muted.ownerSVGElement, highlight]) {
    if (!svg) continue
    svg.setAttribute("width", String(width))
    svg.setAttribute("height", String(height))
  }

  applyClip(highlight, positions, activeIds)
  return positions
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index])
}

function visibleHeadingIds(items: TocItem[]): string[] {
  const viewportHeight = window.innerHeight
  const ids: string[] = []

  for (const item of items) {
    const rect = document.getElementById(item.id)?.getBoundingClientRect()
    if (!rect || rect.height === 0) continue
    const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)
    if (visibleHeight / rect.height >= VISIBLE_RATIO) ids.push(item.id)
  }

  return ids
}

function headingAboveViewport(items: TocItem[], edge: number): string | undefined {
  let id = items[0]?.id

  for (const item of items) {
    const rect = document.getElementById(item.id)?.getBoundingClientRect()
    if (!rect || rect.height === 0) continue
    if (rect.top >= edge) break
    id = item.id
  }

  return id
}

export function OnThisPage({ items }: { items: TocItem[] }) {
  const [activeIds, setActiveIds] = useState<string[]>([])
  const listRef = useRef<HTMLDivElement>(null)
  const mutedRef = useRef<SVGPathElement>(null)
  const highlightSvgRef = useRef<SVGSVGElement>(null)
  const highlightRef = useRef<SVGPathElement>(null)
  const positionsRef = useRef<ItemPosition[]>([])
  const activeIdsRef = useRef(activeIds)

  useLayoutEffect(() => {
    if (items.length < 2) return

    const list = listRef.current
    const muted = mutedRef.current
    const highlightPath = highlightRef.current
    const highlight = highlightSvgRef.current
    if (!list || !muted || !highlightPath || !highlight) return

    const commit = (next: string[]) => {
      activeIdsRef.current = next
      applyClip(highlight, positionsRef.current, next)
      setActiveIds((current) => (sameIds(current, next) ? current : next))
    }

    const syncActive = () => {
      const visible = visibleHeadingIds(items)
      if (visible.length > 0) {
        commit(visible)
        return
      }

      const above = headingAboveViewport(items, 0)
      commit(above ? [above] : [])
    }

    const measure = () => {
      positionsRef.current = paintTrack(
        list,
        items,
        muted,
        highlightPath,
        highlight,
        activeIdsRef.current
      )
    }

    const onScroll = () => {
      syncActive()
    }

    const onResize = () => {
      measure()
      syncActive()
    }

    measure()
    syncActive()

    const resize = new ResizeObserver(() => {
      measure()
    })
    resize.observe(list)
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize)

    return () => {
      resize.disconnect()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
    }
  }, [items])

  if (items.length < 2) {
    return null
  }

  const currentId = activeIds[0]

  return (
    <nav aria-label={strings.toc.title} className="flex flex-col gap-2">
      <p className="text-xs font-medium">{strings.toc.title}</p>
      <div ref={listRef} className="relative">
        <svg
          aria-hidden
          className="pointer-events-none absolute start-0 top-0 overflow-visible text-muted-foreground/35"
        >
          <path ref={mutedRef} fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
        <svg
          ref={highlightSvgRef}
          aria-hidden
          className="pointer-events-none absolute start-0 top-0 overflow-visible text-chart-3"
        >
          <path ref={highlightRef} fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
        <ul className="flex flex-col">
          {items.map((item) => {
            const active = activeIds.includes(item.id)
            return (
              <li key={item.id} className="first:[&>a]:pt-0 last:[&>a]:pb-0">
                <a
                  href={`#${item.id}`}
                  aria-current={item.id === currentId ? "location" : undefined}
                  style={{ paddingInlineStart: textOffset(item.level) }}
                  className={cn(
                    "relative block py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                    active && "text-foreground"
                  )}
                >
                  {item.title}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
