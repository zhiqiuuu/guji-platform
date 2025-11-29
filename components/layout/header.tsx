'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Book, Search, User, LogOut, BookMarked, History, Settings, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/auth-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { user, profile, signOut, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  function handleLogin() {
    setAuthMode('login');
    setShowAuthModal(true);
  }

  function handleRegister() {
    setAuthMode('register');
    setShowAuthModal(true);
  }

  async function handleLogout() {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
          <Link href="/" className="flex items-center space-x-2">
            <Book className="h-6 w-6 text-amber-600" />
            <span className="text-lg sm:text-xl font-bold text-gray-900 whitespace-nowrap">
              {process.env.NEXT_PUBLIC_SITE_NAME || '古籍典藏'}
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-sm font-medium text-gray-700 hover:text-amber-600 transition-colors"
            >
              首页
            </Link>
            <Link
              href="/books"
              className="text-sm font-medium text-gray-700 hover:text-amber-600 transition-colors"
            >
              书库
            </Link>
            <Link
              href="/upload"
              className="text-sm font-medium text-gray-700 hover:text-amber-600 transition-colors"
            >
              上传古籍
            </Link>
            <Button size="sm" variant="outline" asChild>
              <Link href="/books">
                <Search className="h-4 w-4 mr-2" />
                搜索
              </Link>
            </Button>

            {/* 用户菜单 */}
            {loading ? (
              <div className="w-20 h-9 bg-gray-100 animate-pulse rounded-md" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    {profile?.display_name || profile?.username || '我的'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      个人中心
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookshelf" className="cursor-pointer">
                      <BookMarked className="h-4 w-4 mr-2" />
                      我的书架
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/history" className="cursor-pointer">
                      <History className="h-4 w-4 mr-2" />
                      阅读历史
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      设置
                    </Link>
                  </DropdownMenuItem>
                  {profile?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin/import" className="cursor-pointer text-blue-600">
                          <Upload className="h-4 w-4 mr-2" />
                          批量导入
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    登出
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleLogin}>
                  登录
                </Button>
                <Button size="sm" onClick={handleRegister}>
                  注册
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile Menu Icon */}
          <div className="md:hidden">
            {loading ? (
              <div className="w-16 h-9 bg-gray-100 animate-pulse rounded-md" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      个人中心
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookshelf" className="cursor-pointer">
                      <BookMarked className="h-4 w-4 mr-2" />
                      我的书架
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/history" className="cursor-pointer">
                      <History className="h-4 w-4 mr-2" />
                      阅读历史
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      设置
                    </Link>
                  </DropdownMenuItem>
                  {profile?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin/import" className="cursor-pointer text-blue-600">
                          <Upload className="h-4 w-4 mr-2" />
                          批量导入
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    登出
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={handleLogin}>
                登录
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          <Link
            href="/"
            className="flex flex-col items-center justify-center flex-1 h-full text-xs text-gray-600 hover:text-amber-600 transition-colors"
          >
            <Book className="h-5 w-5 mb-1" />
            <span className="whitespace-nowrap">首页</span>
          </Link>
          <Link
            href="/books"
            className="flex flex-col items-center justify-center flex-1 h-full text-xs text-gray-600 hover:text-amber-600 transition-colors"
          >
            <BookMarked className="h-5 w-5 mb-1" />
            <span className="whitespace-nowrap">书库</span>
          </Link>
          <Link
            href="/search"
            className="flex flex-col items-center justify-center flex-1 h-full text-xs text-gray-600 hover:text-amber-600 transition-colors"
          >
            <Search className="h-5 w-5 mb-1" />
            <span className="whitespace-nowrap">搜索</span>
          </Link>
          <Link
            href="/upload"
            className="flex flex-col items-center justify-center flex-1 h-full text-xs text-gray-600 hover:text-amber-600 transition-colors"
          >
            <Upload className="h-5 w-5 mb-1" />
            <span className="whitespace-nowrap">上传古籍</span>
          </Link>
        </div>
      </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
    </>
  );
}
