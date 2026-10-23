"use client"

import { useMemo, useState } from "react"
import { BlocksIcon, SearchIcon } from "lucide-react"
import { PluginCard } from "@/components/plugins/plugin-card"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { PluginStatus } from "@/lib/content/schemas"
import { strings } from "@/lib/strings"
import type { PluginRecord } from "@/lib/content/load-plugins"

const STATUSES: Array<"all" | PluginStatus> = [
  "all",
  "active",
  "deprecated",
  "archived",
]

const ACTIVE_FILTER =
  "aria-pressed:border-chart-3 data-[state=on]:border-chart-3"

export function PluginGrid({ plugins }: { plugins: PluginRecord[] }) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"all" | PluginStatus>("all")
  const [tag, setTag] = useState("all")

  const tags = useMemo(() => {
    const values = new Set<string>()
    for (const plugin of plugins) {
      for (const item of plugin.tags ?? []) {
        values.add(item)
      }
    }
    return [...values].sort((left, right) => left.localeCompare(right, "nb"))
  }, [plugins])

  const filtered = plugins.filter((plugin) => {
    const haystack = `${plugin.name} ${plugin.summary} ${plugin.slug}`.toLowerCase()
    const matchesQuery = haystack.includes(query.trim().toLowerCase())
    const matchesStatus = status === "all" || plugin.status === status
    const matchesTag = tag === "all" || (plugin.tags ?? []).includes(tag)
    return matchesQuery && matchesStatus && matchesTag
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder={strings.plugins.filterPlaceholder}
              aria-label={strings.plugins.filterPlaceholder}
              className="h-10 pl-9"
            />
          </div>
          <ToggleGroup
            value={[status]}
            onValueChange={(next) =>
              setStatus((next[0] as "all" | PluginStatus | undefined) ?? "all")
            }
            variant="outline"
            size="default"
          >
            {STATUSES.map((value) => (
              <ToggleGroupItem
                key={value}
                value={value}
                className={ACTIVE_FILTER}
              >
                {value === "all"
                  ? strings.plugins.allStatuses
                  : strings.status[value]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        {tags.length > 0 ? (
          <ToggleGroup
            value={[tag]}
            onValueChange={(next) => setTag(next[0] ?? "all")}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem
              value="all"
              className={ACTIVE_FILTER}
            >
              {strings.plugins.allTags}
            </ToggleGroupItem>
            {tags.map((value) => (
              <ToggleGroupItem
                key={value}
                value={value}
                className={ACTIVE_FILTER}
              >
                {value}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : null}
      </div>
      {filtered.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BlocksIcon />
            </EmptyMedia>
            <EmptyTitle>{strings.plugins.emptyFilterTitle}</EmptyTitle>
            <EmptyDescription>
              {strings.plugins.emptyFilterDescription}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((plugin) => (
            <PluginCard key={plugin.slug} plugin={plugin} />
          ))}
        </div>
      )}
    </div>
  )
}
