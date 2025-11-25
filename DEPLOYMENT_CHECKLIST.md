# 段落搜索功能部署清单

## ✅ 部署前检查清单

### 1. 数据库迁移 ⬜
```bash
cd guji-platform
supabase db push
```

**验证:**
```sql
-- 在 Supabase Dashboard 执行
SELECT * FROM book_paragraphs LIMIT 1;
SELECT * FROM search_book_paragraphs('测试', 10);
```

---

### 2. 修改 OCR 集成代码 ⬜

**文件:** `contexts/ocr-task-context.tsx`

参考: [OCR_INTEGRATION_GUIDE.md](OCR_INTEGRATION_GUIDE.md)

需要修改:
- [ ] `uploadOCRResult` 函数签名
- [ ] `startTaskInternal` 中的OCR调用
- [ ] 所有使用 `extractTextFromBook` 的地方

---

### 3. 安装前端依赖 ⬜

```bash
npm install lucide-react
```

---

### 4. 类型检查 ⬜

```bash
npm run type-check
# 或
npx tsc --noEmit
```

---

### 5. 本地测试 ⬜

```bash
npm run dev
```

测试项目:
- [ ] 访问 `/search` 页面正常显示
- [ ] 搜索功能可用(即使没有数据也应该正常运行)
- [ ] API `/api/search/paragraphs?query=测试` 返回正确格式

---

### 6. 构建测试 ⬜

```bash
npm run build
```

确保构建无错误

---

### 7. 部署到生产环境 ⬜

```bash
# Vercel
vercel --prod

# 或其他部署平台
```

---

## 🧪 功能测试清单

### 测试1: 新书籍OCR + 段落保存

- [ ] 上传新书籍
- [ ] 启动OCR处理
- [ ] OCR完成后检查数据库:
  ```sql
  SELECT COUNT(*) FROM book_paragraphs
  WHERE book_id = 'your-book-id';
  ```
- [ ] 确认有段落记录

---

### 测试2: 段落搜索

- [ ] 访问 `/search`
- [ ] 选择"段落搜索"
- [ ] 输入关键词(如书中存在的词语)
- [ ] 确认搜索结果:
  - [ ] 显示匹配段落
  - [ ] 显示上下文
  - [ ] 关键词高亮
  - [ ] 显示页码和书籍信息

---

### 测试3: 搜索结果跳转

- [ ] 点击搜索结果中的"查看原文"
- [ ] 确认跳转到正确的书籍详情页
- [ ] URL包含 `page` 和 `paragraph` 参数

---

### 测试4: 性能测试

- [ ] 搜索常见关键词,响应时间 < 2秒
- [ ] 数据库查询使用索引(检查 EXPLAIN ANALYZE)
- [ ] 前端渲染流畅

---

## 📊 监控指标

### 数据库监控

```sql
-- 段落总数
SELECT COUNT(*) FROM book_paragraphs;

-- 每本书的段落数
SELECT
  b.title,
  COUNT(p.id) as paragraph_count
FROM books b
LEFT JOIN book_paragraphs p ON b.id = p.book_id
GROUP BY b.id, b.title
ORDER BY paragraph_count DESC
LIMIT 10;

-- 搜索性能
EXPLAIN ANALYZE
SELECT * FROM search_book_paragraphs('常见关键词', 50);
```

---

## 🔄 回滚计划

如果部署出现问题:

### 1. 回滚代码
```bash
git revert HEAD
git push
vercel --prod
```

### 2. 保留数据库表

**不要删除 `book_paragraphs` 表!** 即使功能不可用,表中的数据依然有价值。

### 3. 禁用新功能

如果需要暂时禁用,在 `app/api/ocr/complete/route.ts` 中注释段落保存代码:

```typescript
// 2. 保存段落(如果提供了 pageTexts)
// let paragraphsSaved = false;
// if (pageTexts && Array.isArray(pageTexts) && pageTexts.length > 0) {
//   try {
//     paragraphsSaved = await saveParagraphs(bookId, pageTexts);
//     console.log(`段落保存${paragraphsSaved ? '成功' : '失败'}`);
//   } catch (error) {
//     console.error('保存段落失败:', error);
//     // 段落保存失败不影响主流程
//   }
// }
```

---

## 📞 支持

遇到问题时检查:

1. **Supabase Dashboard**
   - 数据库日志
   - 表结构
   - 权限设置

2. **Vercel Dashboard** (或你的部署平台)
   - 构建日志
   - 运行时日志
   - 环境变量

3. **浏览器控制台**
   - 网络请求
   - JavaScript错误
   - 响应数据

---

## 📝 部署记录

| 日期 | 操作 | 结果 | 备注 |
|------|------|------|------|
| 2025-01-25 | 创建部署清单 | - | 初始版本 |
|  |  |  |  |
|  |  |  |  |

---

**最后更新:** 2025-01-25
