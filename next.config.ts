import type { NextConfig } from "next"
import createMDX from "@next/mdx"

const noindexHeader = {
  key: "X-Robots-Tag",
  value: "noindex",
}

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  async headers() {
    return [
      {
        source: "/",
        headers: [noindexHeader],
      },
      {
        source: "/:path*",
        headers: [noindexHeader],
      },
    ]
  },
}

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
  },
})

export default withMDX(nextConfig)
