/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.blob.core.windows.net" },
      { protocol: "https", hostname: "*.azurewebsites.net" },
    ],
  },
};

export default nextConfig;
