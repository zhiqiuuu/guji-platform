'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, User, Palette, Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ReadingTheme = 'default' | 'sepia' | 'dark';

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 用户信息设置
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [defaultTheme, setDefaultTheme] = useState<ReadingTheme>('sepia');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setDefaultTheme(profile.default_theme as ReadingTheme || 'sepia');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_name: displayName,
          username: username,
          default_theme: defaultTheme,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '保存失败');
      }

      // 刷新用户信息
      await refreshProfile();

      setMessage({ type: 'success', text: '设置已保存' });
    } catch (err) {
      console.error('Error saving profile:', err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : '保存失败，请重试',
      });
    } finally {
      setSaving(false);
    }
  };

  const getThemeLabel = (theme: string) => {
    const labels: Record<string, string> = {
      default: '默认',
      sepia: '护眼',
      dark: '夜间',
    };
    return labels[theme] || theme;
  };

  const getThemeColor = (theme: string) => {
    const colors: Record<string, string> = {
      default: 'bg-gray-100',
      sepia: 'bg-amber-50',
      dark: 'bg-gray-900',
    };
    return colors[theme] || 'bg-gray-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 页面头部 */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">设置</h1>
            <p className="text-gray-600 mt-1">管理你的账户和偏好设置</p>
          </div>
        </div>

        {/* 消息提示 */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* 个人信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-amber-600" />
                个人信息
              </CardTitle>
              <CardDescription>更新你的个人资料信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">电子邮件</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">邮箱地址无法修改</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="设置一个唯一的用户名"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500">
                  用户名用于URL和@提及，只能包含字母、数字和下划线
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">显示名称</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="你希望别人如何称呼你"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500">这是在平台上显示的名字</p>
              </div>
            </CardContent>
          </Card>

          {/* 阅读偏好 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-amber-600" />
                阅读偏好
              </CardTitle>
              <CardDescription>自定义你的阅读体验</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>默认主题</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border ${getThemeColor(defaultTheme)}`}></div>
                        {getThemeLabel(defaultTheme)}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    <DropdownMenuItem onClick={() => setDefaultTheme('default')}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-100 border rounded"></div>
                        默认
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDefaultTheme('sepia')}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-amber-50 border rounded"></div>
                        护眼
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDefaultTheme('dark')}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-900 border rounded"></div>
                        夜间
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <p className="text-xs text-gray-500">
                  选择你喜欢的默认阅读主题，你仍可以在阅读时随时切换
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 账户统计 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-600" />
                账户统计
              </CardTitle>
              <CardDescription>你的阅读数据概览</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">已读书籍</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {profile.books_read || 0}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">阅读时长</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {Math.floor((profile.total_reading_time || 0) / 60)}h
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">用户角色</p>
                  <p className="text-lg font-bold text-green-700 capitalize">
                    {profile.role}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">注册时间</p>
                  <p className="text-sm font-medium text-purple-700">
                    {new Date(profile.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 保存按钮 */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              取消
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? '保存中...' : '保存设置'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
