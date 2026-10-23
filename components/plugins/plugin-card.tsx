import Link from "next/link"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PluginBadges } from "@/components/plugins/plugin-badges"
import { selectLatestRelease } from "@/lib/content/versions"
import { formatDate } from "@/lib/format"
import { strings } from "@/lib/strings"
import type { PluginRecord } from "@/lib/content/load-plugins"

export function PluginCard({ plugin }: { plugin: PluginRecord }) {
  const latest = selectLatestRelease(plugin.releases, plugin.versionScheme)

  return (
    <Link href={`/plugins/${plugin.slug}`} className="block h-full">
      <Card className="h-full border-t-2 border-t-chart-3 transition-colors hover:bg-muted/40">
        <CardHeader>
          <CardTitle>{plugin.name}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <PluginBadges plugin={plugin} version={latest?.version} />
          </div>
          <CardDescription>{plugin.summary}</CardDescription>
        </CardHeader>
        <CardFooter className="mt-auto justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {latest
              ? strings.plugins.updatedOn(formatDate(latest.releaseDate))
              : null}
          </span>
          <span className="text-sm font-medium text-primary">
            {strings.plugins.seeDetails}
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
}
