'use client';

import Link from 'next/link';
import { Book, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
        <Link href="/" className="flex items-center space-x-2">
          <Book className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">
            {process.env.NEXT_PUBLIC_SITE_NAME || '古籍典藏'}
          </span>
        </Link>

        <nav className="flex items-center space-x-6">
          <Link
            href="/"
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            首页
          </Link>
          <Link
            href="/books"
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            书库
          </Link>
          <Link
            href="/upload"
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            上传古籍
          </Link>
          <Button size="sm" variant="outline" asChild>
            <Link href="/books">
              <Search className="h-4 w-4 mr-2" />
              搜索
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
