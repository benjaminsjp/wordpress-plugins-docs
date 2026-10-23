import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ReleaseRecord } from "@/lib/content/load-plugins"
import { strings } from "@/lib/strings"

export function RequirementsList({ release }: { release: ReleaseRecord }) {
  const items = [
    {
      label: strings.plugins.wordpress,
      requirement: release.requirements.wordpress,
    },
    {
      label: strings.plugins.php,
      requirement: release.requirements.php,
    },
    release.requirements.flatsome
      ? {
          label: strings.plugins.flatsome,
          requirement: release.requirements.flatsome,
        }
      : null,
  ].filter((item) => item !== null)

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} className="border-t-2 border-t-chart-3">
          <CardHeader>
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold">
              {strings.plugins.minLabel(item.requirement.min)}
            </CardTitle>
            {item.requirement.tested ? (
              <CardDescription>
                {strings.plugins.testedLabel(item.requirement.tested)}
              </CardDescription>
            ) : null}
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
