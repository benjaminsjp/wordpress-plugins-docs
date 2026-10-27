import { strings } from "@/lib/strings"
import { cn } from "@/lib/utils"

const LOGO_WIDTH = 277
const LOGO_HEIGHT = 64

const defaultLogoHeight = "h-11 w-auto max-w-full sm:h-12"

export function SiteLogo({
  className,
  heightClass = defaultLogoHeight,
}: {
  className?: string
  /** Tailwind classes for logo height/width, e.g. `h-12 md:h-14 w-auto max-w-full` */
  heightClass?: string
}) {
  const imgClass = cn(heightClass)

  return (
    <span className={cn("inline-flex min-w-0 max-w-full items-center", className)}>
      <img
        src="/brand/kodekassa-maskot-logo-lys.png"
        alt=""
        aria-hidden
        className={cn(imgClass, "dark:hidden")}
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        decoding="async"
      />
      <img
        src="/brand/kodekassa-maskot-logo-mork.png"
        alt=""
        aria-hidden
        className={cn("hidden dark:block", imgClass)}
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        decoding="async"
      />
      <span className="sr-only">{strings.site.logoAlt}</span>
    </span>
  )
}
