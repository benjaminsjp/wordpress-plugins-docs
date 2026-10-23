import { DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { strings } from "@/lib/strings"

export function DownloadButton({
  href,
  version,
}: {
  href: string
  version: string
}) {
  return (
    <Button render={<a href={href} />} nativeButton={false}>
      <DownloadIcon data-icon="inline-start" />
      {strings.plugins.downloadLatest(version)}
    </Button>
  )
}
