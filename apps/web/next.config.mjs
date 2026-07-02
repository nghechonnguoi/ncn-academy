/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "@sparticuz/chromium", "puppeteer-core"],
    outputFileTracingIncludes: {
      "/api/**/*": ["./node_modules/**/*.wasm", "./node_modules/@sparticuz/chromium/bin/**/*"],
    },
  },
  images: {
    domains: ["lh3.googleusercontent.com", "avatars.githubusercontent.com"],
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
