# OCR段落集成指导

## 📝 需要修改的文件

### 文件: `contexts/ocr-task-context.tsx`

需要修改两处OCR调用代码,使其使用详细版本的OCR方法,以便获取 `pageTexts` 数据。

---

## 🔧 修改步骤

### 修改1: 更新 `uploadOCRResult` 函数签名

**原代码 (第415-436行):**
```typescript
// 上传OCR结果到服务器
async function uploadOCRResult(bookId: string, fullText: string): Promise<void> {
  try {
    const response = await fetch('/api/ocr/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookId,
        fullText,
      }),
    });

    if (!response.ok) {
      throw new Error('上传OCR结果失败');
    }
  } catch (error) {
    console.error('上传OCR结果失败:', error);
    throw error;
  }
}
```

**新代码:**
```typescript
import { PageText } from '@/lib/paragraph-splitter';

// 上传OCR结果到服务器
async function uploadOCRResult(
  bookId: string,
  fullText: string,
  pageTexts?: PageText[]
): Promise<void> {
  try {
    const response = await fetch('/api/ocr/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookId,
        fullText,
        pageTexts, // 新增: 传递页面文本数据
      }),
    });

    if (!response.ok) {
      throw new Error('上传OCR结果失败');
    }

    const result = await response.json();
    console.log('OCR结果上传成功:', result);
  } catch (error) {
    console.error('上传OCR结果失败:', error);
    throw error;
  }
}
```

---

### 修改2: 更新 `startTaskInternal` 函数中的OCR调用

**原代码 (第256-266行):**
```typescript
// 开始OCR处理
const extractedText = await task.ocrService.extractTextFromBook(
  task.fileUrl,
  task.fileType,
  task.imageUrls,
  {
    onProgress: (progress) => updateProgress(taskId, progress),
  }
);

// 完成后上传到服务器
await uploadOCRResult(task.bookId, extractedText);
```

**新代码:**
```typescript
// 开始OCR处理 - 根据文件类型选择方法
let ocrResult;
if (task.fileType === 'pdf') {
  // PDF文件使用详细版本方法
  ocrResult = await task.ocrService.extractTextFromPDFDetailed(
    task.fileUrl,
    {
      onProgress: (progress) => updateProgress(taskId, progress),
    }
  );
} else if (task.fileType === 'images' && task.imageUrls) {
  // 图片文件使用详细版本方法
  ocrResult = await task.ocrService.extractTextFromImagesDetailed(
    task.imageUrls,
    {
      onProgress: (progress) => updateProgress(taskId, progress),
    }
  );
} else {
  throw new Error('不支持的文件类型');
}

// 完成后上传到服务器(包含 pageTexts)
await uploadOCRResult(task.bookId, ocrResult.fullText, ocrResult.pageTexts);

// 注意: 后续代码中使用 ocrResult.fullText 替代 extractedText
```

**同时修改后续的 updateTask 调用:**
```typescript
// 更新任务为完成
updateTask(taskId, {
  status: 'completed',
  extractedText: ocrResult.fullText, // 改用 ocrResult.fullText
  endTime: Date.now(),
  progress: {
    current: task.progress.total || 1,
    total: task.progress.total || 1,
    percentage: 100,
    statusText: '处理完成',
  },
});
```

---

### 修改3: 批处理OCR中的相同逻辑

在文件第120-150行左右,如果有另一个OCR处理逻辑(可能是批处理相关),需要做同样的修改。

查找代码中所有调用 `extractTextFromBook` 的地方,改为使用:
- `extractTextFromPDFDetailed` (PDF文件)
- `extractTextFromImagesDetailed` (图片文件)

---

## ✅ 修改验证

修改完成后,测试:

1. **上传新书籍并进行OCR**
   - 确认OCR完成后数据库中有段落记录

2. **查询段落数据**
   ```sql
   -- 在 Supabase Dashboard 执行
   SELECT COUNT(*) FROM book_paragraphs WHERE book_id = 'your-book-id';
   ```

3. **测试搜索功能**
   - 访问 `/search` 页面
   - 输入关键词搜索
   - 确认能看到段落级搜索结果

---

## 🐛 常见问题

### Q1: OCR完成后段落没有保存?

**检查:**
1. 浏览器控制台是否有错误
2. 服务器日志中 `uploadOCRResult` 的输出
3. API响应中 `paragraphsSaved` 字段的值

### Q2: 段落保存失败但OCR成功?

这是正常的!段落保存失败不会影响主流程。检查:
- 数据库表是否创建成功
- Supabase 权限是否正确

### Q3: 类型错误?

确保在文件顶部添加导入:
```typescript
import { PageText } from '@/lib/paragraph-splitter';
import { OCRResult } from '@/lib/ocr-client-service';
```

---

## 📚 相关文件

- OCR服务: [lib/ocr-client-service.ts](lib/ocr-client-service.ts)
- 段落工具: [lib/paragraph-splitter.ts](lib/paragraph-splitter.ts)
- API接口: [app/api/ocr/complete/route.ts](app/api/ocr/complete/route.ts)

---

**更新日期:** 2025-01-25
