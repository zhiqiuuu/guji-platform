import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// 设置 PDF.js worker
if (typeof window === 'undefined') {
  // Node.js 环境
  pdfjsLib.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/build/pdf.worker.min.mjs');
}

/**
 * 从图片URL提取文字
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  const worker = await createWorker('chi_sim+chi_tra+eng', 1, {
    logger: (m) => console.log(m),
  });

  try {
    const { data: { text } } = await worker.recognize(imageUrl);
    return text.trim();
  } finally {
    await worker.terminate();
  }
}

/**
 * 从多张图片提取文字
 */
export async function extractTextFromImages(imageUrls: string[]): Promise<string> {
  const worker = await createWorker('chi_sim+chi_tra+eng', 1, {
    logger: (m) => console.log(m),
  });

  try {
    const texts: string[] = [];

    for (const imageUrl of imageUrls) {
      console.log(`处理图片: ${imageUrl}`);
      const { data: { text } } = await worker.recognize(imageUrl);
      texts.push(text.trim());
    }

    return texts.join('\n\n');
  } finally {
    await worker.terminate();
  }
}

/**
 * 从PDF提取文字（包含文本层和OCR）
 */
export async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  try {
    // 加载PDF文档
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdfDocument = await loadingTask.promise;

    const texts: string[] = [];
    const numPages = pdfDocument.numPages;

    console.log(`PDF共有 ${numPages} 页`);

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      console.log(`处理第 ${pageNum}/${numPages} 页`);

      const page = await pdfDocument.getPage(pageNum);

      // 1. 首先尝试提取文本层
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim();

      if (pageText) {
        // 如果有文本层，直接使用
        texts.push(pageText);
      } else {
        // 2. 如果没有文本层，进行OCR识别
        console.log(`第 ${pageNum} 页无文本层，开始OCR识别...`);

        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          console.error('无法创建canvas context');
          continue;
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        } as any).promise;

        // 将canvas转换为图片URL并进行OCR
        const imageUrl = canvas.toDataURL('image/png');
        const ocrText = await extractTextFromImage(imageUrl);

        if (ocrText) {
          texts.push(ocrText);
        }
      }
    }

    return texts.join('\n\n');
  } catch (error) {
    console.error('PDF文字提取失败:', error);
    throw error;
  }
}

/**
 * 根据文件类型提取文字
 */
export async function extractTextFromBook(
  fileUrl: string,
  fileType: 'pdf' | 'images',
  imageUrls?: string[]
): Promise<string> {
  try {
    if (fileType === 'pdf') {
      return await extractTextFromPDF(fileUrl);
    } else if (fileType === 'images' && imageUrls && imageUrls.length > 0) {
      return await extractTextFromImages(imageUrls);
    } else {
      throw new Error('不支持的文件类型或缺少必要参数');
    }
  } catch (error) {
    console.error('文字提取失败:', error);
    throw error;
  }
}
