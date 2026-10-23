import { Badge } from "@/components/ui/badge"
import { strings } from "@/lib/strings"
import type { PluginRecord } from "@/lib/content/load-plugins"

export function PluginBadges({
  plugin,
  version,
}: {
  plugin: PluginRecord
  version?: string
}) {
  return (
    <>
      {version ? (
        <Badge variant="default">{strings.version(version)}</Badge>
      ) : null}
      <Badge variant="outline">
        <span className="size-1.5 bg-primary" aria-hidden />
        {strings.status[plugin.status]}
      </Badge>
      <Badge variant="outline">
        {strings.plugins.visibility[plugin.repository.visibility]}
      </Badge>
    </>
  )
}
