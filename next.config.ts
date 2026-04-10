import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  // Increase API route body size for image uploads (Vercel default is ~4.5MB)
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export default nextConfig;
