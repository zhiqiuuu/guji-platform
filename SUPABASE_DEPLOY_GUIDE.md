# Supabase 在线数据库部署指南

## 🎯 快速部署步骤

### 步骤1: 执行数据库迁移 ⏳

1. **登录 Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   ```
   选择你的项目

2. **打开 SQL Editor**
   - 左侧菜单 → SQL Editor
   - 点击 "New query"

3. **复制并执行 SQL**
   - 打开文件: `supabase/migrations/20250125_create_book_paragraphs.sql`
   - 复制全部内容
   - 粘贴到 SQL Editor
   - 点击 "Run" 按钮执行

4. **验证是否成功**

   在 SQL Editor 中执行:
   ```sql
   -- 检查表是否创建
   SELECT * FROM book_paragraphs LIMIT 1;

   -- 测试搜索函数
   SELECT * FROM search_book_paragraphs('测试', 10);
   ```

   如果没有报错,说明成功! ✅

---

### 步骤2: 安装前端依赖 ⏳

```bash
cd guji-platform
npm install lucide-react
```

---

### 步骤3: 测试功能 ⏳

```bash
npm run dev
```

测试:
1. 访问 `http://localhost:3000/search`
2. 页面正常显示即可

---

### 步骤4: 部署到 Vercel ⏳

```bash
# 构建测试
npm run build

# 部署
vercel --prod
```

或者在 Vercel Dashboard 中点击 "Deploy" 按钮

---

## ✅ 完成!

现在你的系统已经支持段落级搜索了!

### 测试新功能:

1. **上传新书籍并进行 OCR**
   - 系统会自动保存段落数据
   - 查看浏览器控制台,应该会看到: `✅ 段落数据已保存到数据库`

2. **使用段落搜索**
   - 访问 `/search` 页面
   - 选择 "段落搜索"
   - 输入关键词

3. **验证数据库**
   ```sql
   -- 查看段落总数
   SELECT COUNT(*) FROM book_paragraphs;

   -- 查看某本书的段落
   SELECT * FROM book_paragraphs
   WHERE book_id = 'your-book-id'
   LIMIT 10;
   ```

---

## 🐛 常见问题

### Q: SQL执行失败?
**A:** 检查是否有语法错误,确保复制了完整的 SQL 内容

### Q: 搜索没有结果?
**A:** 需要先上传书籍并完成 OCR,系统才会有段落数据可搜索

### Q: 段落没有保存?
**A:** 查看浏览器控制台和 Supabase Logs,检查是否有错误信息

---

## 📞 需要帮助?

查看详细文档:
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - 完整部署清单
- [PARAGRAPH_SEARCH_GUIDE.md](PARAGRAPH_SEARCH_GUIDE.md) - 功能使用指南

---

**部署时间:** 约 10-15 分钟
**最后更新:** 2025-01-25
