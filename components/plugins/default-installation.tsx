import { strings } from "@/lib/strings"

export function DefaultInstallation() {
  return (
    <div className="flex flex-col gap-3">
      <p>{strings.plugins.defaultInstallIntro}</p>
      <ol className="flex list-decimal flex-col gap-2 pl-5">
        {strings.plugins.defaultInstallSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  )
}
