import { getSearchIndex } from "@/lib/content"

export const dynamic = "force-static"

export async function GET() {
  const index = await getSearchIndex()
  return Response.json(index)
}
