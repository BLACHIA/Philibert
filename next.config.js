/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; style-src 'unsafe-inline' 'self'; script-src 'unsafe-inline' 'self' 'unsafe-eval'; img-src 'self' data:; font-src 'self' data:;",
          },
        ],
      },
    ];
  },
  // Autoriser les images et polices à partir de sources externes si besoin
};

module.exports = nextConfig;