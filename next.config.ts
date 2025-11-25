import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 添加空的turbopack配置以消除警告
  turbopack: {},
  typescript: {
    // 暂时忽略构建时的类型错误
    ignoreBuildErrors: true,
  },
  experimental: {
    // 排除 OCR 相关的包
    serverComponentsExternalPackages: ['pdfjs-dist', 'tesseract.js', 'canvas'],
  },
  webpack: (config, { isServer }) => {
    // 禁止在服务端打包 pdfjs-dist 和 tesseract.js
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('pdfjs-dist', 'tesseract.js', 'canvas', '@/lib/ocr-service');
    }
    return config;
  },
};

export default nextConfig;
