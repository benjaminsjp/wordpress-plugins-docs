import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { selectLatestRelease } from "@/lib/content/versions"
import { strings } from "@/lib/strings"
import type { PluginRecord } from "@/lib/content/load-plugins"

export function PluginCard({ plugin }: { plugin: PluginRecord }) {
  const version = selectLatestRelease(
    plugin.releases,
    plugin.versionScheme
  )?.version

  return (
    <Link href={`/plugins/${plugin.slug}`} className="block h-full">
      <Card className="h-full transition-colors hover:bg-muted/40">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{plugin.name}</CardTitle>
            {version ? (
              <Badge variant="secondary">{strings.version(version)}</Badge>
            ) : null}
            <Badge variant="outline">{strings.status[plugin.status]}</Badge>
            <Badge variant="outline">
              {strings.plugins.visibility[plugin.repository.visibility]}
            </Badge>
          </div>
          <CardDescription>{plugin.summary}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
