'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Save,
  User,
  Palette,
  Bell,
  Download,
  Shield,
  Settings,
  Type,
  Layout,
  Clock,
  Lock,
  Database,
  FileText,
  CheckCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type ReadingTheme = 'default' | 'sepia' | 'dark';
type FontSize = 'small' | 'medium' | 'large' | 'extra-large';
type LineHeight = 'compact' | 'normal' | 'relaxed' | 'loose';

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  // 用户信息设置
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [defaultTheme, setDefaultTheme] = useState<ReadingTheme>('sepia');
  const [defaultFontSize, setDefaultFontSize] = useState<FontSize>('medium');
  const [defaultLineHeight, setDefaultLineHeight] = useState<LineHeight>('normal');

  // 通知偏好设置
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [readingReminders, setReadingReminders] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  // 密码修改
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // 数据导出
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setDefaultTheme(profile.default_theme as ReadingTheme || 'sepia');
      setDefaultFontSize((profile.default_font_size as FontSize) || 'medium');
      setDefaultLineHeight((profile.default_line_height as LineHeight) || 'normal');
      // 加载通知偏好设置
      setEmailNotifications(profile.email_notifications ?? true);
      setReadingReminders(profile.reading_reminders ?? true);
      setWeeklyReport(profile.weekly_report ?? false);
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
          bio: bio,
          default_theme: defaultTheme,
          default_font_size: defaultFontSize,
          default_line_height: defaultLineHeight,
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

  // 保存通知偏好设置
  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_notifications: emailNotifications,
          reading_reminders: readingReminders,
          weekly_report: weeklyReport,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '保存失败');
      }

      // 刷新用户信息
      await refreshProfile();

      setMessage({ type: 'success', text: '通知设置已保存' });
    } catch (err) {
      console.error('Error saving notifications:', err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : '保存失败,请重试',
      });
    } finally {
      setSaving(false);
    }
  };

  // 修改密码
  const handleChangePassword = async () => {
    try {
      setChangingPassword(true);
      setMessage(null);

      if (newPassword !== confirmPassword) {
        throw new Error('新密码和确认密码不一致');
      }

      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '密码修改失败');
      }

      setMessage({ type: 'success', text: '密码修改成功' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error changing password:', err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : '密码修改失败，请重试',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  // 导出数据
  const handleExportData = async () => {
    try {
      setExporting(true);
      setMessage(null);

      const response = await fetch(`/api/user/export?format=${exportFormat}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '导出失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `guji-user-data-${Date.now()}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: '数据导出成功' });
    } catch (err) {
      console.error('Error exporting data:', err);
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : '导出失败，请重试',
      });
    } finally {
      setExporting(false);
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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
            <Settings className="h-8 w-8 text-white animate-spin" />
          </div>
          <div className="text-gray-600 text-lg">加载中...</div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 页面头部 - 增强设计 */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="border-amber-300 hover:bg-amber-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
              设置中心
            </h1>
            <p className="text-gray-600 mt-2">管理你的账户、偏好和高级功能</p>
          </div>
        </div>

        {/* 消息提示 - 增强样式 */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 shadow-lg ${
              message.type === 'success'
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-2 border-green-200'
                : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-2 border-red-200'
            }`}
          >
            <CheckCircle className="h-6 w-6" />
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* 选项卡式设置 - 增强样式 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white border border-amber-200 p-2 rounded-xl shadow-md mb-8">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-100 data-[state=active]:to-amber-50 data-[state=active]:text-amber-900 rounded-lg transition-all duration-300"
            >
              <User className="h-4 w-4 mr-2" />
              个人信息
            </TabsTrigger>
            <TabsTrigger
              value="reading"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-100 data-[state=active]:to-purple-50 data-[state=active]:text-purple-900 rounded-lg transition-all duration-300"
            >
              <Palette className="h-4 w-4 mr-2" />
              阅读偏好
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-100 data-[state=active]:to-blue-50 data-[state=active]:text-blue-900 rounded-lg transition-all duration-300"
            >
              <Bell className="h-4 w-4 mr-2" />
              通知
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-100 data-[state=active]:to-red-50 data-[state=active]:text-red-900 rounded-lg transition-all duration-300"
            >
              <Shield className="h-4 w-4 mr-2" />
              安全
            </TabsTrigger>
            <TabsTrigger
              value="data"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-100 data-[state=active]:to-green-50 data-[state=active]:text-green-900 rounded-lg transition-all duration-300"
            >
              <Database className="h-4 w-4 mr-2" />
              数据管理
            </TabsTrigger>
          </TabsList>

          {/* 个人信息选项卡 - 增强样式 */}
          <TabsContent value="profile" className="space-y-6 mt-6">
            <Card className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <User className="h-5 w-5 text-amber-600" />
                  </div>
                  个人资料
                </CardTitle>
                <CardDescription>更新你的个人资料信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="email">电子邮件</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">��箱地址无法修改</p>
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

                <div className="space-y-2">
                  <Label htmlFor="bio">个人简介</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="介绍一下你自己..."
                    maxLength={500}
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-gray-500">介绍一下你的阅读偏好或兴趣爱好</p>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? '保存中...' : '保存更改'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 账户统计 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-600" />
                  账户统计
                </CardTitle>
                <CardDescription>你的阅读数据概览</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          </TabsContent>

          {/* 阅读偏好选项卡 */}
          <TabsContent value="reading" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-amber-600" />
                  阅读偏好设置
                </CardTitle>
                <CardDescription>自定义你的阅读体验</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 主题设置 */}
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
                    选择你喜欢的默认阅读主题
                  </p>
                </div>

                {/* 字体大小 */}
                <div className="space-y-2">
                  <Label>默认字体大小</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <Type className="h-4 w-4 mr-2" />
                        {defaultFontSize === 'small' && '小'}
                        {defaultFontSize === 'medium' && '中'}
                        {defaultFontSize === 'large' && '大'}
                        {defaultFontSize === 'extra-large' && '超大'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      <DropdownMenuItem onClick={() => setDefaultFontSize('small')}>小</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDefaultFontSize('medium')}>中</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDefaultFontSize('large')}>大</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDefaultFontSize('extra-large')}>超大</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <p className="text-xs text-gray-500">设置默认的阅读字体大小</p>
                </div>

                {/* 行高 */}
                <div className="space-y-2">
                  <Label>默认行高</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <Layout className="h-4 w-4 mr-2" />
                        {defaultLineHeight === 'compact' && '紧凑'}
                        {defaultLineHeight === 'normal' && '正常'}
                        {defaultLineHeight === 'relaxed' && '适中'}
                        {defaultLineHeight === 'loose' && '宽松'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      <DropdownMenuItem onClick={() => setDefaultLineHeight('compact')}>紧凑</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDefaultLineHeight('normal')}>正常</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDefaultLineHeight('relaxed')}>适��</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDefaultLineHeight('loose')}>宽松</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <p className="text-xs text-gray-500">设置默认的行间距</p>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? '保存中...' : '保存设置'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 通知选项卡 */}
          <TabsContent value="notifications" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-600" />
                  通知偏好
                </CardTitle>
                <CardDescription>管理你接收的通知类型</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>邮件通知</Label>
                    <p className="text-sm text-gray-500">接收重要的账户和安全通知</p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>阅读提醒</Label>
                    <p className="text-sm text-gray-500">每天定时提醒你阅读</p>
                  </div>
                  <Switch
                    checked={readingReminders}
                    onCheckedChange={setReadingReminders}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>周报</Label>
                    <p className="text-sm text-gray-500">每周接收阅读统计和推荐</p>
                  </div>
                  <Switch
                    checked={weeklyReport}
                    onCheckedChange={setWeeklyReport}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? '保存中...' : '保存设置'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 安全选项卡 */}
          <TabsContent value="security" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-amber-600" />
                  修改密码
                </CardTitle>
                <CardDescription>定期更新密码以保证账户安全</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">当前密码</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="输入当前密码"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">新密码</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="输入新密码（至少6位）"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">确认新密码</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入新密码"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {changingPassword ? '修改中...' : '修改密码'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 数据管理选项卡 */}
          <TabsContent value="data" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-amber-600" />
                  数据导出
                </CardTitle>
                <CardDescription>导出你的所有数据</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>导出格式</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {exportFormat === 'json' ? 'JSON' : 'CSV'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      <DropdownMenuItem onClick={() => setExportFormat('json')}>
                        JSON (完整数据)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setExportFormat('csv')}>
                        CSV (简化格式)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <p className="text-xs text-gray-500">
                    {exportFormat === 'json'
                      ? 'JSON格式包含完整的数据结构'
                      : 'CSV格式便于在Excel中打开'}
                  </p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      导出我的数据
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认导出数据</AlertDialogTitle>
                      <AlertDialogDescription>
                        这将下载包含你所有书架、阅读历史、笔记等数据的文件。确认继续吗？
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={handleExportData}>
                        确认导出
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {exporting && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 animate-spin" />
                    正在导出数据，请稍候...
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
