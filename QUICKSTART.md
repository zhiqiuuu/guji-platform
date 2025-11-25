# 快速开始指南

## 🎯 15分钟搭建你的古籍典藏平台

### 第一步：配置 Supabase（5分钟）

#### 1. 注册并创建项目
1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 "Start your project" 注册账号
3. 创建新组织（Organization）
4. 点击 "New Project"，填写：
   - Name: `guji-platform`
   - Database Password: 输入一个强密码并保存
   - Region: 选择 `Northeast Asia (Seoul)`（最接近中国）
5. 点击 "Create new project"，等待2分钟初始化

#### 2. 创建数据表
1. 在左侧菜单点击 "SQL Editor"
2. 点击 "New query"
3. 复制并粘贴以下 SQL：

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

-- 创建索引
CREATE INDEX idx_books_category ON books(category);
CREATE INDEX idx_books_dynasty ON books(dynasty);
CREATE INDEX idx_books_created_at ON books(created_at DESC);

-- 创建触发器
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

4. 点击 "Run" 执行

#### 3. 创建存储桶
1. 在左侧菜单点击 "Storage"
2. 点击 "Create a new bucket"
3. 填写：
   - Name: `books`
   - Public bucket: ✅ 勾选
4. 点击 "Create bucket"

#### 4. 获取 API 密钥
1. 在左侧菜单点击 "Project Settings"（齿轮图标）
2. 点击 "API"
3. 找到并复制以下信息：
   - `Project URL`（例如：https://abcdefgh.supabase.co）
   - `anon public` Key（一长串字符）

---

### 第二步：配置项目（3分钟）

#### 1. 配置环境变量
打开项目中的 `.env.local` 文件，填入刚才复制的信息：

```env
NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon-key

NEXT_PUBLIC_SITE_NAME=古籍典藏
NEXT_PUBLIC_SITE_DESCRIPTION=个人古籍数字图书馆
```

#### 2. 安装依赖（如果还没有）

```bash
npm install
```

---

### 第三步：启动项目（1分钟）

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

---

### 第四步：测试功能（5分钟）

#### 1. 浏览首页
- 查看设计和布局
- 点击 "浏览书库" 按钮

#### 2. 测试搜索（暂时没有数据）
- 页面显示 "暂无古籍"
- 这是正常的，因为还没有上传任何书籍

#### 3. 手动添加测试数据
回到 Supabase Dashboard：
1. 点击 "Table Editor"
2. 选择 `books` 表
3. 点击 "Insert row"
4. 填写测试数据：

```
title: 论语
author: 孔子
dynasty: 先秦
category: 经部
description: 儒家经典著作
file_url: https://example.com/test.pdf
file_type: pdf
```

5. 点击 "Save"

#### 4. 刷新书库页面
- 现在应该能看到刚才添加的测试书籍了！
- 尝试使用筛选器和搜索功能

---

### 第五步：部署到 Vercel（5分钟，可选）

#### 前提条件
- 有 GitHub 账号
- 代码已推送到 GitHub

#### 部署步骤
1. 访问 [https://vercel.com](https://vercel.com)
2. 使用 GitHub 登录
3. 点击 "Import Project"
4. 选择你的 GitHub 仓库
5. 配置环境变量：
   - 点击 "Environment Variables"
   - 添加 `NEXT_PUBLIC_SUPABASE_URL`
   - 添加 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - 添加 `NEXT_PUBLIC_SITE_NAME`
   - 添加 `NEXT_PUBLIC_SITE_DESCRIPTION`
6. 点击 "Deploy"
7. 等待2-3分钟，部署完成！

---

## ✅ 完成！

恭喜你已经成功搭建了自己的古籍典藏平台！

### 下一步做什么？

#### 🎨 自定义样式
- 修改 `lib/constants.ts` 添加更多分类和朝代
- 修改颜色主题（在 Tailwind 配置中）

#### 📚 添加古籍
- 使用 "上传古籍" 功能添加书籍
- 或通过 Supabase Dashboard 批量导入

#### 🚀 完善功能
- 实现完整的文件上传
- 添加 PDF 阅读器
- 开发书籍详情页

---

## 🐛 遇到问题？

### 问题1：npm install 失败
**解决方案**：
```bash
# 清除缓存
npm cache clean --force
# 删除 node_modules
rm -rf node_modules
# 重新安装
npm install
```

### 问题2：无法连接到 Supabase
**检查清单**：
- [ ] `.env.local` 文件是否存在？
- [ ] URL 和 Key 是否正确复制？
- [ ] Supabase 项目是否已完成初始化？

### 问题3：页面显示空白
**解决方案**：
```bash
# 停止开发服务器（Ctrl+C）
# 重新启动
npm run dev
```

### 问题4：部署失败
**检查清单**：
- [ ] 环境变量是否在 Vercel 中配置？
- [ ] 构建日志中有什么错误信息？
- [ ] 代码是否成功推送到 GitHub？

---

## 📞 需要帮助？

- 查看完整文档：[README.md](./README.md)
- 检查 Supabase 文档：[https://supabase.com/docs](https://supabase.com/docs)
- 查看 Next.js 文档：[https://nextjs.org/docs](https://nextjs.org/docs)

---

**祝你使用愉快！** 🎉
