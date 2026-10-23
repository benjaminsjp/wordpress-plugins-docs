"use client"

import { useMemo, useState } from "react"
import { BlocksIcon } from "lucide-react"
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
        <Input
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder={strings.plugins.filterPlaceholder}
          aria-label={strings.plugins.filterPlaceholder}
        />
        <div className="flex flex-wrap gap-3">
          <ToggleGroup
            value={[status]}
            onValueChange={(next) =>
              setStatus((next[0] as "all" | PluginStatus | undefined) ?? "all")
            }
            variant="outline"
            size="sm"
          >
            {STATUSES.map((value) => (
              <ToggleGroupItem key={value} value={value}>
                {value === "all"
                  ? strings.plugins.allStatuses
                  : strings.status[value]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {tags.length > 0 ? (
            <ToggleGroup
              value={[tag]}
              onValueChange={(next) => setTag(next[0] ?? "all")}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="all">
                {strings.plugins.allTags}
              </ToggleGroupItem>
              {tags.map((value) => (
                <ToggleGroupItem key={value} value={value}>
                  {value}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          ) : null}
        </div>
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
