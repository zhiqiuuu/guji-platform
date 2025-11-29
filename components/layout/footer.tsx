export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-gray-50">
      <div className="container px-4 py-8 mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-gray-600">
            © {currentYear} {process.env.NEXT_PUBLIC_SITE_NAME || '课艺典藏'}. 保留所有权利。
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              GitHub
            </a>
            <span>•</span>
            <span>基于 Next.js 构建</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
