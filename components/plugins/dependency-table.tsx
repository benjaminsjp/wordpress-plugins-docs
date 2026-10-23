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
          <TableHead>{strings.plugins.dependencies}</TableHead>
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
                  <Badge variant="outline">
                    {dependency.type === "required"
                      ? strings.plugins.required
                      : strings.plugins.optional}
                  </Badge>
                </TableCell>
                <TableCell>{dependency.minVersion ?? "—"}</TableCell>
                <TableCell>
                  {satisfied === null
                    ? strings.plugins.unknownSatisfaction
                    : satisfied
                      ? strings.plugins.satisfies
                      : strings.plugins.unsatisfied}
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
                <Badge variant="outline">
                  {dependency.type === "required"
                    ? strings.plugins.required
                    : strings.plugins.optional}
                </Badge>
              </TableCell>
              <TableCell>{dependency.minVersion ?? "—"}</TableCell>
              <TableCell>{strings.plugins.unknownSatisfaction}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
