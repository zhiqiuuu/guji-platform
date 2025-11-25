import { createWorker, Worker } from 'tesseract.js';

// 动态导入PDF.js (仅在客户端)
let pdfjsLib: any = null;

async function loadPdfJs() {
  if (typeof window !== 'undefined' && !pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    // 使用unpkg CDN作为worker源
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
  return pdfjsLib;
}

export interface OCRProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

export interface OCROptions {
  onProgress?: (progress: OCRProgress) => void;
  signal?: AbortSignal;
}

export interface OCRResult {
  fullText: string;
  pageTexts: Array<{
    page_number: number;
    text: string;
  }>;
}

/**
 * 客户端OCR服务类
 */
export class ClientOCRService {
  private worker: Worker | null = null;
  private isInitialized = false;
  private isPaused = false;
  private shouldStop = false;

  /**
   * 初始化Tesseract Worker
   */
  async initialize(): Promise<void> {
    if (this.isInitialized && this.worker) {
      return;
    }

    this.worker = await createWorker('chi_sim+chi_tra+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR进度: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    this.isInitialized = true;
  }

  /**
   * 暂停OCR处理
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * 恢复OCR处理
   */
  resume(): void {
    this.isPaused = false;
  }

  /**
   * 停止OCR处理
   */
  stop(): void {
    this.shouldStop = true;
    this.isPaused = false;
  }

  /**
   * 检查是否应该暂停
   */
  private async waitIfPaused(): Promise<void> {
    while (this.isPaused && !this.shouldStop) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * 从单张图片提取文字
   */
  async extractTextFromImage(imageUrl: string): Promise<string> {
    if (!this.worker) {
      await this.initialize();
    }

    if (!this.worker) {
      throw new Error('Worker初始化失败');
    }

    await this.waitIfPaused();
    if (this.shouldStop) {
      throw new Error('OCR已取消');
    }

    const { data: { text } } = await this.worker.recognize(imageUrl);
    return text.trim();
  }

  /**
   * 从多张图片提取文字
   */
  async extractTextFromImages(
    imageUrls: string[],
    options?: OCROptions
  ): Promise<string> {
    if (!this.worker) {
      await this.initialize();
    }

    const texts: string[] = [];
    const total = imageUrls.length;

    for (let i = 0; i < imageUrls.length; i++) {
      await this.waitIfPaused();

      if (this.shouldStop) {
        throw new Error('OCR已取消');
      }

      // 检查AbortSignal
      if (options?.signal?.aborted) {
        throw new Error('OCR已取消');
      }

      const imageUrl = imageUrls[i];
      console.log(`处理图片 ${i + 1}/${total}: ${imageUrl}`);

      const text = await this.extractTextFromImage(imageUrl);
      texts.push(text);

      // 更新进度
      if (options?.onProgress) {
        options.onProgress({
          current: i + 1,
          total,
          percentage: Math.round(((i + 1) / total) * 100),
          status: `正在处理第 ${i + 1}/${total} 张图片`,
        });
      }
    }

    return texts.join('\n\n');
  }

  /**
   * 从多张图片提取文字 (返回详细结果)
   */
  async extractTextFromImagesDetailed(
    imageUrls: string[],
    options?: OCROptions
  ): Promise<OCRResult> {
    if (!this.worker) {
      await this.initialize();
    }

    const pageTexts: Array<{ page_number: number; text: string }> = [];
    const total = imageUrls.length;

    for (let i = 0; i < imageUrls.length; i++) {
      await this.waitIfPaused();

      if (this.shouldStop) {
        throw new Error('OCR已取消');
      }

      // 检查AbortSignal
      if (options?.signal?.aborted) {
        throw new Error('OCR已取消');
      }

      const imageUrl = imageUrls[i];
      console.log(`处理图片 ${i + 1}/${total}: ${imageUrl}`);

      const text = await this.extractTextFromImage(imageUrl);
      pageTexts.push({
        page_number: i + 1,
        text,
      });

      // 更新进度
      if (options?.onProgress) {
        options.onProgress({
          current: i + 1,
          total,
          percentage: Math.round(((i + 1) / total) * 100),
          status: `正在处理第 ${i + 1}/${total} 张图片`,
        });
      }
    }

    return {
      fullText: pageTexts.map(p => p.text).join('\n\n'),
      pageTexts,
    };
  }

  /**
   * 从PDF提取文字（包含文本层和OCR）
   */
  async extractTextFromPDF(
    pdfUrl: string,
    options?: OCROptions
  ): Promise<string> {
    if (!this.worker) {
      await this.initialize();
    }

    try {
      // 动态加载PDF.js
      const pdfjs = await loadPdfJs();
      if (!pdfjs) {
        throw new Error('PDF.js加载失败，请在浏览器环境中运行');
      }

      // 加载PDF文档
      const loadingTask = pdfjs.getDocument(pdfUrl);
      const pdfDocument = await loadingTask.promise;

      const texts: string[] = [];
      const numPages = pdfDocument.numPages;

      console.log(`PDF共有 ${numPages} 页`);

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        await this.waitIfPaused();

        if (this.shouldStop) {
          throw new Error('OCR已取消');
        }

        // 检查AbortSignal
        if (options?.signal?.aborted) {
          throw new Error('OCR已取消');
        }

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
          }).promise;

          // 将canvas转换为图片URL并进行OCR
          const imageUrl = canvas.toDataURL('image/png');
          const ocrText = await this.extractTextFromImage(imageUrl);

          if (ocrText) {
            texts.push(ocrText);
          }
        }

        // 更新进度
        if (options?.onProgress) {
          options.onProgress({
            current: pageNum,
            total: numPages,
            percentage: Math.round((pageNum / numPages) * 100),
            status: `正在处理第 ${pageNum}/${numPages} 页`,
          });
        }
      }

      return texts.join('\n\n');
    } catch (error) {
      console.error('PDF文字提取失败:', error);
      throw error;
    }
  }

  /**
   * 从PDF提取文字（包含文本层和OCR，返回详细结果）
   */
  async extractTextFromPDFDetailed(
    pdfUrl: string,
    options?: OCROptions
  ): Promise<OCRResult> {
    if (!this.worker) {
      await this.initialize();
    }

    try {
      // 动态加载PDF.js
      const pdfjs = await loadPdfJs();
      if (!pdfjs) {
        throw new Error('PDF.js加载失败，请在浏览器环境中运行');
      }

      // 加载PDF文档
      const loadingTask = pdfjs.getDocument(pdfUrl);
      const pdfDocument = await loadingTask.promise;

      const pageTexts: Array<{ page_number: number; text: string }> = [];
      const numPages = pdfDocument.numPages;

      console.log(`PDF共有 ${numPages} 页`);

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        await this.waitIfPaused();

        if (this.shouldStop) {
          throw new Error('OCR已取消');
        }

        // 检查AbortSignal
        if (options?.signal?.aborted) {
          throw new Error('OCR已取消');
        }

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
          pageTexts.push({
            page_number: pageNum,
            text: pageText,
          });
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
          }).promise;

          // 将canvas转换为图片URL并进行OCR
          const imageUrl = canvas.toDataURL('image/png');
          const ocrText = await this.extractTextFromImage(imageUrl);

          pageTexts.push({
            page_number: pageNum,
            text: ocrText || '',
          });
        }

        // 更新进度
        if (options?.onProgress) {
          options.onProgress({
            current: pageNum,
            total: numPages,
            percentage: Math.round((pageNum / numPages) * 100),
            status: `正在处理第 ${pageNum}/${numPages} 页`,
          });
        }
      }

      return {
        fullText: pageTexts.map(p => p.text).join('\n\n'),
        pageTexts,
      };
    } catch (error) {
      console.error('PDF文字提取失败:', error);
      throw error;
    }
  }

  /**
   * 根据文件类型提取文字
   */
  async extractTextFromBook(
    fileUrl: string,
    fileType: 'pdf' | 'images',
    imageUrls?: string[],
    options?: OCROptions
  ): Promise<string> {
    try {
      this.shouldStop = false;
      this.isPaused = false;

      if (fileType === 'pdf') {
        return await this.extractTextFromPDF(fileUrl, options);
      } else if (fileType === 'images' && imageUrls && imageUrls.length > 0) {
        return await this.extractTextFromImages(imageUrls, options);
      } else {
        throw new Error('不支持的文件类型或缺少必要参数');
      }
    } catch (error) {
      console.error('文字提取失败:', error);
      throw error;
    }
  }

  /**
   * 清理资源
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}

// 导出单例
let globalOCRService: ClientOCRService | null = null;

export function getOCRService(): ClientOCRService {
  if (!globalOCRService) {
    globalOCRService = new ClientOCRService();
  }
  return globalOCRService;
}
