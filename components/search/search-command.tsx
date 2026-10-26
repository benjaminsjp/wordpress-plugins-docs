"use client"

import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { SearchIcon } from "lucide-react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Skeleton } from "@/components/ui/skeleton"
import { strings } from "@/lib/strings"
import type { SearchRecord, SearchRecordType } from "@/lib/content/search-index"
import { cn } from "@/lib/utils"

const OPEN_SEARCH_EVENT = "docs:open-search"

const GROUP_ORDER: SearchRecordType[] = ["plugin", "snippet", "category"]

const GROUP_HEADINGS: Record<SearchRecordType, string> = {
  plugin: strings.search.groups.plugins,
  snippet: strings.search.groups.snippets,
  category: strings.search.groups.categories,
}

export function requestOpenSearch() {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))
}

export function SearchTrigger({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const modifier = useSearchModifier()

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "sm" : "default"}
      className={cn(
        "justify-start",
        compact ? undefined : "w-full max-w-xl",
        className
      )}
      onClick={requestOpenSearch}
      aria-label={strings.search.trigger}
      aria-keyshortcuts="Control+K Meta+K"
    >
      <SearchIcon data-icon="inline-start" />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-left",
          compact && "max-sm:hidden"
        )}
      >
        {compact ? strings.search.trigger : strings.search.placeholder}
      </span>
      <KbdGroup className={compact ? "max-sm:hidden" : undefined}>
        <Kbd>{modifier}</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </Button>
  )
}

export function SearchCommand() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [records, setRecords] = useState<SearchRecord[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    function onOpenSearch() {
      setOpen(true)
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener(OPEN_SEARCH_EVENT, onOpenSearch)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpenSearch)
    }
  }, [])

  useEffect(() => {
    if (!open || records) return

    let cancelled = false

    fetch("/search-index.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("search-index")
        }
        return response.json() as Promise<SearchRecord[]>
      })
      .then((data) => {
        if (cancelled) return
        setError(false)
        setRecords(data)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })

    return () => {
      cancelled = true
    }
  }, [open, records])

  const grouped = useMemo(() => {
    const groups: Record<SearchRecordType, SearchRecord[]> = {
      plugin: [],
      snippet: [],
      category: [],
    }
    for (const record of records ?? []) {
      groups[record.type].push(record)
    }
    return groups
  }, [records])

  function goTo(url: string) {
    setOpen(false)
    router.push(url)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={strings.search.title}
      description={strings.search.description}
      className="sm:max-w-xl"
    >
      <Command label={strings.search.title} key={open ? "open" : "closed"}>
        <CommandInput placeholder={strings.search.placeholder} />
        <CommandList>
          {!records && !error ? (
            <div className="flex flex-col gap-2 p-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-5/6" />
              <Skeleton className="h-8 w-2/3" />
              <span className="sr-only">{strings.search.loading}</span>
            </div>
          ) : null}
          {error ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {strings.search.error}
            </p>
          ) : null}
          {records ? (
            <>
              <CommandEmpty>{strings.search.empty}</CommandEmpty>
              {GROUP_ORDER.map((type) => {
                const items = grouped[type]
                if (items.length === 0) return null
                return (
                  <CommandGroup key={type} heading={GROUP_HEADINGS[type]}>
                    {items.map((record) => (
                      <CommandItem
                        key={record.url}
                        value={`${record.type} ${record.slug} ${record.title}`}
                        keywords={[
                          record.summary,
                          record.category ?? "",
                          ...record.tags,
                          ...record.keywords,
                        ].filter(Boolean)}
                        onSelect={() => goTo(record.url)}
                      >
                        <span className="min-w-0 truncate">{record.title}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )
              })}
            </>
          ) : null}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

function subscribeNever() {
  return () => {}
}

function getSearchModifier() {
  return /Mac|iPhone|iPad/i.test(navigator.userAgent) ? "⌘" : "Ctrl"
}

function useSearchModifier() {
  return useSyncExternalStore(subscribeNever, getSearchModifier, () => "Ctrl")
}
