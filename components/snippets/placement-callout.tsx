import { MapPinIcon } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import type { PlacementLocation } from "@/lib/content/schemas"
import { headingId } from "@/lib/plugin-view"
import { strings } from "@/lib/strings"

export function PlacementCallout({
  location,
  notes,
}: {
  location: PlacementLocation
  notes?: string
}) {
  const placement = strings.snippets.placement[location]

  return (
    <Alert id={headingId(strings.snippets.placementTitle)} className="scroll-mt-24">
      <MapPinIcon />
      <AlertTitle>{strings.snippets.placementTitle}</AlertTitle>
      <AlertDescription>
        <p className="font-medium text-foreground">{placement.label}</p>
        <ol className="mt-2 flex list-decimal flex-col gap-1 pl-4">
          {placement.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {notes ? <p className="mt-2">{notes}</p> : null}
      </AlertDescription>
    </Alert>
  )
}
