import { DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { strings } from "@/lib/strings"

export function DownloadButton({
  href,
  className,
  label = strings.plugins.downloadLatest,
  variant = "default",
}: {
  href: string
  className?: string
  label?: string
  variant?: "default" | "outline"
}) {
  return (
    <Button
      variant={variant}
      size="lg"
      render={<a href={href} />}
      nativeButton={false}
      className={className}
    >
      <DownloadIcon data-icon="inline-start" />
      {label}
    </Button>
  )
}
