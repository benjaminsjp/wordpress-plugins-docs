import { InfoIcon, TriangleAlertIcon } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import type { ReactNode } from "react"

export function Callout({
  title,
  children,
  variant = "info",
}: {
  title?: string
  children?: ReactNode
  variant?: "info" | "warning"
}) {
  const Icon = variant === "warning" ? TriangleAlertIcon : InfoIcon

  return (
    <Alert variant={variant === "warning" ? "destructive" : "default"}>
      <Icon />
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      {children ? <AlertDescription>{children}</AlertDescription> : null}
    </Alert>
  )
}
