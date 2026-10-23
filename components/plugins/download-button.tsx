import { DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { strings } from "@/lib/strings"

export function DownloadButton({
  href,
  className,
}: {
  href: string
  className?: string
}) {
  return (
    <Button
      size="lg"
      render={<a href={href} />}
      nativeButton={false}
      className={className}
    >
      <DownloadIcon data-icon="inline-start" />
      {strings.plugins.downloadLatest}
    </Button>
  )
}
