import { DefaultInstallation } from "@/components/plugins/default-installation"
import { MdxProse } from "@/components/mdx/prose"
import { loadPluginDoc } from "@/lib/content/load-mdx"
import { strings } from "@/lib/strings"

export async function PluginDocs({ slug }: { slug: string }) {
  const [Overview, Installation, Usage] = await Promise.all([
    loadPluginDoc(slug, "overview"),
    loadPluginDoc(slug, "installation"),
    loadPluginDoc(slug, "usage"),
  ])

  return (
    <div className="flex flex-col gap-8">
      {Overview ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">{strings.plugins.overview}</h2>
          <MdxProse>
            <Overview />
          </MdxProse>
        </section>
      ) : null}
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          {strings.plugins.installation}
        </h2>
        {Installation ? (
          <MdxProse>
            <Installation />
          </MdxProse>
        ) : (
          <DefaultInstallation />
        )}
      </section>
      {Usage ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">{strings.plugins.usage}</h2>
          <MdxProse>
            <Usage />
          </MdxProse>
        </section>
      ) : null}
    </div>
  )
}
