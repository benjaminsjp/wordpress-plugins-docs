import { SectionHeading } from "@/components/layout/section-heading"
import { MdxProse } from "@/components/mdx/prose"
import { DefaultInstallation } from "@/components/plugins/default-installation"
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
          <SectionHeading>{strings.plugins.overview}</SectionHeading>
          <MdxProse>
            <Overview />
          </MdxProse>
        </section>
      ) : null}
      <section className="flex flex-col gap-4">
        <SectionHeading>{strings.plugins.installation}</SectionHeading>
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
          <SectionHeading>{strings.plugins.usage}</SectionHeading>
          <MdxProse>
            <Usage />
          </MdxProse>
        </section>
      ) : null}
    </div>
  )
}
