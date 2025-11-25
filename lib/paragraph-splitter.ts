/**
 * 段落分割工具
 * 按照句号、问号、感叹号等标点符号分割文本
 */

export interface Paragraph {
  content: string;
  page_number: number;
  paragraph_index: number;
  position_start: number;
  position_end: number;
}

export interface PageText {
  page_number: number;
  text: string;
}

/**
 * 按标点符号分割段落
 * 支持: 。！？;;\n\n
 */
function splitByPunctuation(text: string): string[] {
  // 按照句号、问号、感叹号、分号、双换行分割
  // 保留标点符号
  const segments = text.split(/([。!?!?;;]+|\n\n+)/);

  const paragraphs: string[] = [];
  let current = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    if (!segment || segment.trim() === '') {
      continue;
    }

    // 如果是标点符号,拼接到当前段落
    if (/^[。!?!?;;]+$/.test(segment) || /^\n\n+$/.test(segment)) {
      current += segment;
      // 段落结束,保存
      if (current.trim()) {
        paragraphs.push(current.trim());
      }
      current = '';
    } else {
      current += segment;
    }
  }

  // 处理最后一个段落
  if (current.trim()) {
    paragraphs.push(current.trim());
  }

  return paragraphs.filter(p => p.length > 0);
}

/**
 * 从页面文本列表中提取段落
 * @param pageTexts 页面文本数组
 * @returns 段落数组
 */
export function extractParagraphs(pageTexts: PageText[]): Paragraph[] {
  const allParagraphs: Paragraph[] = [];
  let globalPosition = 0;

  for (const pageText of pageTexts) {
    const { page_number, text } = pageText;

    if (!text || text.trim() === '') {
      continue;
    }

    // 分割段落
    const paragraphTexts = splitByPunctuation(text);

    // 为每个段落创建元数据
    paragraphTexts.forEach((content, index) => {
      const position_start = globalPosition;
      const position_end = globalPosition + content.length;

      allParagraphs.push({
        content,
        page_number,
        paragraph_index: index,
        position_start,
        position_end,
      });

      // 更新全局位置 (包括段落间的换行符)
      globalPosition = position_end + 2; // +2 for '\n\n'
    });
  }

  return allParagraphs;
}

/**
 * 从单个文本提取段落 (用于已有的 full_text)
 * @param fullText 完整文本
 * @returns 段落数组 (page_number 设为 0)
 */
export function extractParagraphsFromFullText(fullText: string): Paragraph[] {
  if (!fullText || fullText.trim() === '') {
    return [];
  }

  const paragraphTexts = splitByPunctuation(fullText);
  let globalPosition = 0;

  return paragraphTexts.map((content, index) => {
    const position_start = globalPosition;
    const position_end = globalPosition + content.length;

    globalPosition = position_end + 2; // +2 for '\n\n'

    return {
      content,
      page_number: 0, // 未知页码
      paragraph_index: index,
      position_start,
      position_end,
    };
  });
}

/**
 * 高亮文本中的关键词
 * @param text 原文本
 * @param keyword 关键词
 * @returns 高亮后的HTML字符串
 */
export function highlightKeyword(text: string, keyword: string): string {
  if (!keyword || keyword.trim() === '') {
    return text;
  }

  // 转义特殊字符
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedKeyword})`, 'gi');

  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
}

/**
 * 获取段落预览 (截取固定长度)
 * @param content 段落内容
 * @param maxLength 最大长度
 * @returns 预览文本
 */
export function getParagraphPreview(content: string, maxLength: number = 150): string {
  if (content.length <= maxLength) {
    return content;
  }

  return content.substring(0, maxLength) + '...';
}
