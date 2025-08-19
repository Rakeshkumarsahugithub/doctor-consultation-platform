/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
     //NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://doctor-consultation-platform.vercel.app' : 'http://localhost:5000')
    NEXT_PUBLIC_API_URL: 'http://10.139.241.113:5000'
  },
  images: {
    domains: ['images.unsplash.com', 'static.oxinis.com', 'media.istockphoto.com', 't4.ftcdn.net', 'www.kyd.co.in', 'via.placeholder.com', 'i.pinimg.com'],
  },
}

module.exports = nextConfig




