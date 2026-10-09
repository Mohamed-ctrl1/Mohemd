import type { NextConfig } from "next";

/**
 * عند النشر على GitHub Pages يكون الموقع داخل مجلد باسم الريبو
 * (https://<user>.github.io/Mohemd)، فنحتاج basePath.
 * محليًا يبقى فارغًا فيعمل الموقع على http://localhost:3000 مباشرة.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // تصدير ثابت: الموقع كله ملفات HTML/JS، بلا خادم — وهذا ما يحتاجه GitHub Pages.
  output: "export",
  basePath,
  // GitHub Pages يخدم المجلدات، فنحتاج شرطة في نهاية المسار.
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
