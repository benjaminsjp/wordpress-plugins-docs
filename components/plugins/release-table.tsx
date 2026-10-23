import { Fragment } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CopyButton } from "@/components/code/copy-button"
import { Changelog } from "@/components/plugins/changelog"
import type { PluginRecord } from "@/lib/content/load-plugins"
import { formatDate } from "@/lib/format"
import { sortReleasesNewestFirst, versionAnchor } from "@/lib/plugin-view"
import { strings } from "@/lib/strings"

export function ReleaseTable({ plugin }: { plugin: PluginRecord }) {
  const releases = sortReleasesNewestFirst(plugin.releases, plugin.versionScheme)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{strings.plugins.versionColumn}</TableHead>
          <TableHead>{strings.plugins.dateColumn}</TableHead>
          <TableHead>{strings.plugins.channelColumn}</TableHead>
          <TableHead>{strings.plugins.wordpress}</TableHead>
          <TableHead>{strings.plugins.php}</TableHead>
          <TableHead>{strings.plugins.flatsome}</TableHead>
          <TableHead>{strings.plugins.downloadAsset}</TableHead>
          <TableHead>{strings.plugins.sha256}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {releases.map((release) => {
          const anchor = versionAnchor(release.version)
          return (
            <Fragment key={release.version}>
              <TableRow id={anchor}>
                <TableCell>
                  <a href={`#${anchor}`} className="font-medium underline-offset-3 hover:underline">
                    {strings.version(release.version)}
                  </a>
                </TableCell>
                <TableCell>{formatDate(release.releaseDate)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={release.channel === "beta" ? "secondary" : "outline"}>
                      {strings.plugins.channel[release.channel]}
                    </Badge>
                    {release.yanked ? (
                      <Badge variant="destructive">{strings.plugins.yanked}</Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  {strings.plugins.minLabel(release.requirements.wordpress.min)}
                </TableCell>
                <TableCell>
                  {strings.plugins.minLabel(release.requirements.php.min)}
                </TableCell>
                <TableCell>
                  {release.requirements.flatsome
                    ? strings.plugins.minLabel(release.requirements.flatsome.min)
                    : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <a
                      href={release.resolved.downloadUrl}
                      className="underline-offset-3 hover:underline"
                    >
                      {strings.plugins.downloadAsset}
                    </a>
                    <a
                      href={release.resolved.releasePageUrl}
                      className="text-muted-foreground underline-offset-3 hover:underline"
                    >
                      {strings.plugins.releasePage}
                    </a>
                  </div>
                </TableCell>
                <TableCell>
                  {release.download?.sha256 ? (
                    <div className="flex items-center gap-2">
                      <code className="max-w-28 truncate font-mono text-xs">
                        {release.download.sha256}
                      </code>
                      <CopyButton
                        text={release.download.sha256}
                        label={strings.plugins.copySha}
                      />
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
              {release.changelog ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Accordion>
                      <AccordionItem value={release.version}>
                        <AccordionTrigger>{strings.plugins.changelog}</AccordionTrigger>
                        <AccordionContent>
                          <Changelog release={release} />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </TableCell>
                </TableRow>
              ) : null}
            </Fragment>
          )
        })}
      </TableBody>
    </Table>
  )
}
