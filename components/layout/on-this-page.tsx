"use client"

import { useEffect, useState } from "react"
import { strings } from "@/lib/strings"
import type { TocItem } from "@/lib/toc"
import { cn } from "@/lib/utils"

export function OnThisPage({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "")

  useEffect(() => {
    if (items.length < 2) {
      return
    }

    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => node !== null)

    if (headings.length === 0) {
      return
    }

    const visible = new Map<string, IntersectionObserverEntry>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry)
          } else {
            visible.delete(entry.target.id)
          }
        }

        const intersecting = [...visible.values()].sort(
          (left, right) => left.boundingClientRect.top - right.boundingClientRect.top
        )
        if (intersecting[0]) {
          setActiveId(intersecting[0].target.id)
          return
        }

        let current = items[0]?.id ?? ""
        for (const item of items) {
          const heading = document.getElementById(item.id)
          if (heading && heading.getBoundingClientRect().top <= 96) {
            current = item.id
          }
        }
        setActiveId(current)
      },
      { rootMargin: "-80px 0px -65% 0px", threshold: [0, 1] }
    )

    for (const heading of headings) {
      observer.observe(heading)
    }

    return () => observer.disconnect()
  }, [items])

  if (items.length < 2) {
    return null
  }

  return (
    <nav aria-label={strings.toc.title} className="flex flex-col gap-2">
      <p className="text-xs font-medium">{strings.toc.title}</p>
      <ul className="flex flex-col">
        {items.map((item) => {
          const active = item.id === activeId
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cn(
                  "block border-l-2 py-1 text-sm",
                  item.level === 3 ? "pl-6" : "pl-3",
                  active
                    ? "border-l-chart-3 text-foreground"
                    : "border-l-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {item.title}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
