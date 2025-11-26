# 通知偏好设置功能 - 数据库迁移指南

## 概述

本功能为用户设置页面添加了完整的通知偏好设置,允许用户控制以下通知类型:
- 邮件通知(账户和安全相关)
- 阅读提醒(每日定时提醒)
- 周报(每周阅读统计和推荐)

## 已完成的更改

### 1. 数据库迁移文件
已创建: `supabase/migrations/20250126_add_notification_preferences.sql`

### 2. API更新
已更新: `app/api/user/profile/route.ts`
- 添加了 `email_notifications`、`reading_reminders`、`weekly_report` 到允许更新的字段列表

### 3. 前端页面更新
已更新: `app/settings/page.tsx`
- 添加了 `handleSaveNotifications` 函数来单独保存通知偏好
- 从数据库加载通知偏好设置
- 通知选项卡的保存按钮现在调用专用的保存函数

## 执行数据库迁移步骤

### 方式一:使用 Supabase CLI (推荐)

如果您已经配置了 Supabase CLI:

```bash
cd guji-platform
supabase db push
```

### 方式二:在 Supabase Dashboard 中手动执行

1. 登录到您的 Supabase 项目: https://supabase.com/dashboard
2. 进入 **SQL Editor**
3. 复制并执行以下 SQL:

```sql
-- 添加通知偏好字段
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS reading_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS weekly_report BOOLEAN DEFAULT false;

-- 添加字段注释
COMMENT ON COLUMN public.user_profiles.email_notifications IS '是否接收邮件通知(账户和安全相关)';
COMMENT ON COLUMN public.user_profiles.reading_reminders IS '是否接收每日阅读提醒';
COMMENT ON COLUMN public.user_profiles.weekly_report IS '是否接收每周阅读统计和推荐';
```

4. 点击 **Run** 执行 SQL

### 方式三:使用本地 SQL 文件

```bash
cd guji-platform
psql YOUR_DATABASE_URL < supabase/migrations/20250126_add_notification_preferences.sql
```

## 验证迁移是否成功

执行以下 SQL 查询验证字段是否添加成功:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name IN ('email_notifications', 'reading_reminders', 'weekly_report');
```

应该返回三行数据,显示这三个字段的信息。

## 测试功能

1. 启动开发服务器(如果尚未运行):
   ```bash
   npm run dev
   ```

2. 在浏览器中打开: http://localhost:3000

3. 登录您的账户

4. 进入设置页面: http://localhost:3000/settings

5. 切换到"通知"选项卡

6. 测试以下功能:
   - 切换开关应该能立即改变状态
   - 点击"保存设置"按钮
   - 应该看到"通知设置已保存"的成功消息
   - 刷新页面,验证设置是否被保存

7. 可以打开浏览器开发者工具的 Network 标签页,查看 PATCH 请求到 `/api/user/profile`

## API 端点

### PATCH /api/user/profile

更新用户配置,包括通知偏好:

**请求体:**
```json
{
  "email_notifications": true,
  "reading_reminders": true,
  "weekly_report": false
}
```

**响应:**
```json
{
  "message": "更新成功",
  "profile": {
    "id": "...",
    "email_notifications": true,
    "reading_reminders": true,
    "weekly_report": false,
    ...
  }
}
```

## 数据库表结构

### user_profiles 表新增字段

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| email_notifications | BOOLEAN | true | 是否接收邮件通知(账户和安全相关) |
| reading_reminders | BOOLEAN | true | 是否接收每日阅读提醒 |
| weekly_report | BOOLEAN | false | 是否接收每周阅读统计和推荐 |

## 现有用户数据处理

对于现有用户:
- `email_notifications` 默认为 `true`(建议用户接收重要通知)
- `reading_reminders` 默认为 `true`(鼓励阅读习惯)
- `weekly_report` 默认为 `false`(避免过度打扰)

用户可以随时在设置页面中更改这些偏好。

## 故障排查

### 问题1: 保存后提示"未授权"

**原因:** 用户未登录或会话已过期

**解决方案:**
1. 确认用户已登录
2. 如果已登录,尝试退出并重新登录
3. 检查浏览器 Cookie 是否被禁用

### 问题2: 保存后提示"更新失败"

**原因:** 数据库字段可能未正确添加

**解决方案:**
1. 验证数据库迁移是否已执行
2. 检查数据库表结构
3. 查看服务器日志获取详细错误信息

### 问题3: 页面刷新后设置丢失

**原因:**
- 数据库保存失败
- 前端未正确从 profile 加载数据

**解决方案:**
1. 打开浏览器开发者工具,查看 Network 请求
2. 检查 PATCH 请求是否成功(状态码 200)
3. 检查 GET `/api/user/profile` 返回的数据是否包含通知字段

## 相关文件

- 数据库迁移: `supabase/migrations/20250126_add_notification_preferences.sql`
- API 路由: `app/api/user/profile/route.ts`
- 设置页面: `app/settings/page.tsx`
- 测试脚本: `test-user-apis.js`

## 下一步

执行完数据库迁移后,所有功能应该能够正常工作。您可以:

1. 测试通知偏好设置功能
2. 集成实际的邮件通知服务(如 SendGrid、Amazon SES)
3. 实现阅读提醒的定时任务(如使用 Cron Jobs 或 Supabase Edge Functions)
4. 实现周报生成和发送功能

如有任何问题,请查看日志或联系开发团队。
