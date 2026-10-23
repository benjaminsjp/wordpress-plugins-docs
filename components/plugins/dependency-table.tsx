import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { PluginRecord, ReleaseRecord } from "@/lib/content/load-plugins"
import { isInternalDependency } from "@/lib/content/schemas"
import { selectLatestRelease } from "@/lib/content/versions"
import { minVersionSatisfied } from "@/lib/plugin-view"
import { strings } from "@/lib/strings"

function SatisfactionBadge({ satisfied }: { satisfied: boolean | null }) {
  if (satisfied === true) {
    return (
      <Badge variant="default">
        <span className="size-1.5 bg-primary-foreground" aria-hidden />
        {strings.plugins.satisfies}
      </Badge>
    )
  }

  if (satisfied === false) {
    return (
      <Badge variant="destructive">
        <span className="size-1.5 bg-destructive" aria-hidden />
        {strings.plugins.unsatisfied}
      </Badge>
    )
  }

  return (
    <Badge variant="outline">{strings.plugins.unknownSatisfaction}</Badge>
  )
}

export function DependencyTable({
  release,
  plugins,
}: {
  release: ReleaseRecord
  plugins: PluginRecord[]
}) {
  if (release.dependencies.length === 0) {
    return <p className="text-muted-foreground">{strings.plugins.noDependencies}</p>
  }

  const bySlug = new Map(plugins.map((plugin) => [plugin.slug, plugin]))

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{strings.plugins.dependencyName}</TableHead>
          <TableHead>{strings.plugins.required}</TableHead>
          <TableHead>{strings.plugins.min}</TableHead>
          <TableHead>{strings.plugins.satisfies}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {release.dependencies.map((dependency) => {
          if (isInternalDependency(dependency)) {
            const target = bySlug.get(dependency.plugin)
            const latest = target
              ? selectLatestRelease(target.releases, target.versionScheme)
              : undefined
            const satisfied = target
              ? minVersionSatisfied(
                  latest?.version,
                  dependency.minVersion,
                  target.versionScheme
                )
              : null

            return (
              <TableRow key={`plugin-${dependency.plugin}`}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {target ? (
                      <Link href={`/plugins/${target.slug}`} className="underline-offset-3 hover:underline">
                        {target.name}
                      </Link>
                    ) : (
                      dependency.plugin
                    )}
                    {dependency.reason ? (
                      <span className="text-muted-foreground">{dependency.reason}</span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  {dependency.type === "required"
                    ? strings.plugins.yes
                    : strings.plugins.no}
                </TableCell>
                <TableCell>{dependency.minVersion ?? "—"}</TableCell>
                <TableCell>
                  <SatisfactionBadge satisfied={satisfied} />
                </TableCell>
              </TableRow>
            )
          }

          return (
            <TableRow key={`external-${dependency.external.name}`}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {dependency.external.url ? (
                    <a
                      href={dependency.external.url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline-offset-3 hover:underline"
                    >
                      {dependency.external.name}
                    </a>
                  ) : (
                    dependency.external.name
                  )}
                  {dependency.reason ? (
                    <span className="text-muted-foreground">{dependency.reason}</span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                {dependency.type === "required"
                  ? strings.plugins.yes
                  : strings.plugins.no}
              </TableCell>
              <TableCell>{dependency.minVersion ?? "—"}</TableCell>
              <TableCell>
                <SatisfactionBadge satisfied={null} />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
