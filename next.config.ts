import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages are read from disk at request time, so make sure the fetched
  // content ships with every server function.
  outputFileTracingIncludes: {
    "/*": ["./content/pages/**/*"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
