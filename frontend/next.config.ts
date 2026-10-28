import type { NextConfig } from "next";

// Production di shared hosting (cPanel Node app): Next.js melayani seluruh
// domain dan meneruskan /api serta /sanctum ke Laravel, sehingga frontend &
// API tetap satu origin (cookie sesi host-only). Kosongkan API_PROXY_TARGET
// di lokal - frontend memanggil NEXT_PUBLIC_API_URL langsung.
const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  // Hanya logo & ikon lokal; optimasi gambar butuh sharp versi server.
  images: { unoptimized: true },
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [
      { source: "/api/:path*", destination: `${apiProxyTarget}/api/:path*` },
      { source: "/sanctum/:path*", destination: `${apiProxyTarget}/sanctum/:path*` },
    ];
  },
};

export default nextConfig;
