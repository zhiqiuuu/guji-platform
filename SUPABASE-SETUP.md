# Supabase 配置指南

## 第一步：创建 Supabase 项目

1. 访问 [Supabase官网](https://supabase.com)
2. 点击 "Start your project" 或 "Sign In"
3. 使用 GitHub 账号登录（推荐）或创建新账号
4. 点击 "New Project" 创建新项目
5. 填写项目信息：
   - **Name**: `guji-platform` (或你喜欢的名字)
   - **Database Password**: 设置一个强密码（请记住这个密码）
   - **Region**: 选择 `Northeast Asia (Tokyo)` (离中国最近)
   - **Pricing Plan**: 选择 `Free` (免费版)
6. 点击 "Create new project"，等待项目创建完成（大约2分钟）

## 第二步：获取 API 密钥

1. 项目创建完成后，进入项目面板
2. 点击左侧菜单的 "Settings" (设置图标)
3. 点击 "API" 选项
4. 找到以下两个重要信息：
   - **Project URL**: 类似 `https://xxxxx.supabase.co`
   - **anon public**: 以 `eyJ` 开头的长字符串（这是公开密钥）

## 第三步：创建数据库表

1. 点击左侧菜单的 "SQL Editor" (SQL编辑器图标)
2. 点击 "New query" 创建新查询
3. 打开项目根目录的 `supabase-schema.sql` 文件
4. 复制所有内容并粘贴到 Supabase SQL 编辑器中
5. 点击右下角的 "Run" 按钮执行 SQL
6. 如果显示 "Success. No rows returned" 表示执行成功

## 第四步：配置环境变量

1. 打开项目根目录的 `.env.local` 文件
2. 将以下内容替换为你的实际信息：

\`\`\`env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=你的Project_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon_public密钥

# 网站配置
NEXT_PUBLIC_SITE_NAME=古籍典藏
NEXT_PUBLIC_SITE_DESCRIPTION=个人古籍数字图书馆
\`\`\`

例如：
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

## 第五步：验证数据库表

1. 在 Supabase 面板中，点击左侧菜单的 "Table Editor"
2. 你应该能看到 `books` 表
3. 如果插入了示例数据，你会看到3条记录（论语、道德经、史记）

## 第六步：重启开发服务器

1. 在终端中停止当前运行的服务器（按 Ctrl+C）
2. 重新启动：
\`\`\`bash
npm run dev
\`\`\`

## 第七步：测试功能

1. 访问 http://localhost:3000 (或 http://localhost:3002)
2. 点击 "上传古籍"
3. 填写书籍信息并上传文件
4. 如果成功，你应该能在 Supabase Table Editor 中看到新添加的记录

## 常见问题

### Q: 无法连接到 Supabase
**A**: 检查以下几点：
- 确保 `.env.local` 中的 URL 和密钥正确
- 确保重启了开发服务器
- 检查网络连接

### Q: 添加书籍时显示 500 错误
**A**:
1. 打开浏览器开发者工具（F12）查看控制台错误
2. 检查 Supabase 中的表是否正确创建
3. 检查 RLS (行级安全策略) 是否正确设置

### Q: 如何查看 Supabase 数据库中的数据？
**A**:
1. 登录 Supabase 面板
2. 点击 "Table Editor"
3. 选择 `books` 表查看所有记录

### Q: 如何删除示例数据？
**A**:
1. 进入 Supabase "Table Editor"
2. 选择要删除的行
3. 点击右侧的删除按钮

## 数据库结构说明

### books 表字段：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键，自动生成 |
| title | TEXT | 书名（必填） |
| author | TEXT | 作者（必填） |
| dynasty | TEXT | 朝代（必填） |
| category | TEXT | 分类（必填） |
| description | TEXT | 简介（可选） |
| cover_url | TEXT | 封面图片URL（可选） |
| file_url | TEXT | 文件URL（必填） |
| file_type | TEXT | 文件类型：pdf 或 images（必填） |
| page_count | INTEGER | 页数（可选） |
| view_count | INTEGER | 浏览次数（默认0） |
| created_at | TIMESTAMPTZ | 创建时间（自动） |
| updated_at | TIMESTAMPTZ | 更新时间（自动） |

## 优势说明

相比 Excel 数据库，使用 Supabase 有以下优势：

1. ✅ **稳定性更高** - 不会出现文件锁定或写入失败的问题
2. ✅ **性能更好** - 支持索引和复杂查询
3. ✅ **可扩展性强** - 轻松处理大量数据
4. ✅ **自动备份** - Supabase 提供自动备份功能
5. ✅ **实时更新** - 支持实时数据同步
6. ✅ **多用户支持** - 可以同时多人使用
7. ✅ **云端存储** - 数据保存在云端，更安全

## 下一步

配置完成后，你可以：
- 开始上传古籍
- 自定义界面样式
- 添加更多功能（如用户认证、评论等）
