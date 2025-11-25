# 古籍典藏平台

个人古籍数字图书馆，基于 Next.js 14 构建

## ✨ 功能特性

- 📚 古籍管理：上传、分类、检索
- 🔍 智能搜索：按书名、作者、朝代筛选
- 📖 在线阅读：支持 PDF 和图片格式
- 📱 响应式设计：完美适配各种设备
- 💾 Excel 数据库：零配置，立即可用
- 🚀 快速部署：一键部署到 Vercel

## 🛠️ 技术栈

- **前端框架**：Next.js 14 (App Router)
- **UI 库**：Tailwind CSS + Lucide Icons
- **数据库**：Excel (本地) / Supabase (可选)
- **文件存储**：本地存储 / Supabase Storage (可选)
- **部署平台**：Vercel

## 📋 前置要求

- Node.js 18+
- npm 或 yarn

## 🎉 已开箱即用！

**本项目已配置为使用 Excel 作为数据库**，无需任何额外配置即可使用！

### 快速开始（3 步）

1. **安装依赖并启动**：
   ```bash
   cd d:\work\keyi\guji-platform
   npm install
   npm run dev
   ```

2. **打开浏览器**：
   访问 [http://localhost:3000](http://localhost:3000)

3. **开始使用**：
   - 点击"上传古籍"添加您的第一本古籍
   - 或查看 [Excel 数据库使用指南](./EXCEL_DATABASE_GUIDE.md) 了解如何批量导入数据

## 📚 文档导航

- **[Excel 数据库使用指南](./EXCEL_DATABASE_GUIDE.md)** - 如何使用 Excel 管理古籍数据（推荐阅读）
- **[快速开始指南](./QUICKSTART.md)** - 升级到 Supabase 的步骤
- **[项目总结](./PROJECT_SUMMARY.md)** - 完整的项目架构和功能说明

---

## 🚀 升级到 Supabase（可选）

如果您需要云端存储、多人协作或公网访问，可以升级到 Supabase。

### 1. 配置 Supabase

#### 2.1 创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 注册并创建新项目
3. 等待项目初始化完成（约2分钟）

#### 2.2 创建数据表

在 Supabase Dashboard 的 SQL Editor 中执行以下 SQL：

```sql
-- 创建 books 表
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  dynasty TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('pdf', 'images')) NOT NULL,
  page_count INTEGER,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提升查询性能
CREATE INDEX idx_books_category ON books(category);
CREATE INDEX idx_books_dynasty ON books(dynasty);
CREATE INDEX idx_books_created_at ON books(created_at DESC);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_books_updated_at BEFORE UPDATE
ON books FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

#### 2.3 配置存储桶

1. 在 Supabase Dashboard 中进入 Storage
2. 创建新的 bucket，命名为 `books`
3. 设置为 Public（公开访问）

#### 2.4 获取 API 密钥

1. 进入 Project Settings > API
2. 复制 `Project URL` 和 `anon public` 密钥
3. 在项目根目录的 `.env.local` 文件中填入：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

NEXT_PUBLIC_SITE_NAME=古籍典藏
NEXT_PUBLIC_SITE_DESCRIPTION=个人古籍数字图书馆
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看效果

## 📦 部署到 Vercel

### 方式一：通过 GitHub（推荐）

1. 将代码推送到 GitHub
2. 在 Vercel 中导入 GitHub 仓库
3. 配置环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_NAME`
   - `NEXT_PUBLIC_SITE_DESCRIPTION`
4. 点击 Deploy

### 方式二：通过 CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署
vercel

# 添加环境变量
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# 重新部署
vercel --prod
```

## 📖 使用指南

### 上传古籍

1. 点击导航栏的"上传古籍"
2. 填写书籍信息（书名、作者、朝代、分类）
3. 上传 PDF 文件或图片
4. 提交保存

### 浏览和搜索

1. 在"书库"页面查看所有古籍
2. 使用左侧筛选器按分类或朝代过滤
3. 使用搜索框搜索书名或作者
4. 点击书籍卡片查看详情

## 🔧 项目结构

```
guji-platform/
├── app/                  # Next.js App Router
│   ├── api/             # API 路由
│   ├── books/           # 书库页面
│   ├── upload/          # 上传页面
│   └── layout.tsx       # 根布局
├── components/          # React 组件
│   ├── ui/             # 通用 UI 组件
│   ├── layout/         # 布局组件
│   └── books/          # 书籍相关组件
├── lib/                # 工具库
│   ├── supabase.ts    # Supabase 客户端
│   ├── constants.ts   # 常量定义
│   └── utils.ts       # 工具函数
└── types/              # TypeScript 类型定义
```

## 🐛 常见问题

### 1. Supabase 连接失败

- 检查 `.env.local` 中的 URL 和密钥是否正确
- 确保 Supabase 项目已启动且可访问

### 2. 数据库表不存在

- 确保已在 Supabase SQL Editor 中执行了建表语句

### 3. 部署后样式错乱

- 清除浏览器缓存
- 检查 Vercel 构建日志是否有错误

## 📝 后续开发计划

- [ ] 完整的文件上传功能（集成 Supabase Storage）
- [ ] PDF 在线阅读器（使用 react-pdf）
- [ ] 书籍详情页
- [ ] 用户认证系统
- [ ] 书签和笔记功能
- [ ] 批量上传
- [ ] 导出功能

## 📄 许可证

MIT License
