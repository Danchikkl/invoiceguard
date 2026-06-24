/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['nodemailer', '@react-pdf/renderer'],
  },
}

module.exports = nextConfig
