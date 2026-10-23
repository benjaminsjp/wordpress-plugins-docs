import Link from "next/link"
import { FileQuestionIcon } from "lucide-react"
import { PageShell } from "@/components/layout/page-shell"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { strings } from "@/lib/strings"

export default function NotFound() {
  return (
    <PageShell>
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileQuestionIcon />
          </EmptyMedia>
          <EmptyTitle>{strings.notFound.title}</EmptyTitle>
          <EmptyDescription>{strings.notFound.description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/" />} nativeButton={false}>
            {strings.notFound.backHome}
          </Button>
        </EmptyContent>
      </Empty>
    </PageShell>
  )
}
