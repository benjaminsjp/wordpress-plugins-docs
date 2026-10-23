import Link from "next/link"
import { InfoIcon, TriangleAlertIcon } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import type { PluginRecord, ReleaseRecord } from "@/lib/content/load-plugins"
import { strings } from "@/lib/strings"

export function PluginAlerts({
  plugin,
  latest,
  replacedByName,
}: {
  plugin: PluginRecord
  latest: ReleaseRecord | undefined
  replacedByName?: string
}) {
  return (
    <div className="flex flex-col gap-3">
      {plugin.status === "deprecated" ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>{strings.plugins.deprecatedTitle}</AlertTitle>
          <AlertDescription>
            {plugin.replacedBy ? (
              <>
                {strings.plugins.replacedBy}{" "}
                <Link href={`/plugins/${plugin.replacedBy}`}>
                  {replacedByName ?? plugin.replacedBy}
                </Link>
                .
              </>
            ) : (
              strings.plugins.deprecatedDescription
            )}
          </AlertDescription>
        </Alert>
      ) : null}
      {latest?.channel === "beta" ? (
        <Alert>
          <TriangleAlertIcon />
          <AlertTitle>{strings.plugins.betaTitle}</AlertTitle>
          <AlertDescription>{strings.plugins.betaDescription}</AlertDescription>
        </Alert>
      ) : null}
      {plugin.repository.visibility === "private" ? (
        <Alert>
          <InfoIcon />
          <AlertTitle>{strings.plugins.visibility.private}</AlertTitle>
          <AlertDescription>
            {strings.plugins.privateDownloadNote}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
