import { NextRequest, NextResponse } from 'next/server';
import { traceSource } from '@/lib/siku-rag-service';
import { chatBearer } from '@/lib/spark-bearer';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface SourceRequest {
  text: string;
  withContext?: boolean; // 是否需要AI提供背景说明
}

/**
 * 文献溯源API
 * 查找文本的出处来源
 */
export async function POST(request: NextRequest) {
  try {
    const body: SourceRequest = await request.json();
    const { text, withContext = true } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: '查询文本不能为空' },
        { status: 400 }
      );
    }

    console.log('[溯源API] 查询文本:', text.substring(0, 50));

    // 1. 在数据库中检索
    const sourceInfo = await traceSource(text);

    if (!sourceInfo || sourceInfo.sources.length === 0) {
      return NextResponse.json({
        success: true,
        found: false,
        message: '未在数据库中找到该文本的出处',
        suggestion: '该文本可能不在当前收录范围内,建议查阅更全面的古籍数据库'
      });
    }

    // 2. 如果需要AI提供背景说明
    let aiContext = '';
    if (withContext && sourceInfo.sources.length > 0) {
      const topSource = sourceInfo.sources[0];

      const prompt = `以下文本出自《${topSource.bookTitle}》,作者是${topSource.dynasty}${topSource.author}。
原文: "${text}"

请简要说明:
1. 这部作品的基本情况(2-3句话)
2. 这段文字在作品中的位置和重要性(1-2句话)
3. 相关的历史或文学背景(1-2句话)

请用简洁专业的语言回答,总字数控制在200字以内。`;

      try {
        aiContext = await chatBearer(prompt, [], {
          temperature: 0.5,
          max_tokens: 500,
        });
      } catch (error) {
        console.error('[溯源API] AI背景说明生成失败:', error);
        // 即使AI失败,也返回溯源结果
      }
    }

    return NextResponse.json({
      success: true,
      found: true,
      originalText: text,
      sources: sourceInfo.sources.map(s => ({
        bookTitle: s.bookTitle,
        author: s.author,
        dynasty: s.dynasty,
        chapter: s.chapter,
        pageNumber: s.pageNumber,
        confidence: s.confidence,
        confidenceLevel: s.confidence > 0.8 ? '高' : s.confidence > 0.5 ? '中' : '低'
      })),
      totalResults: sourceInfo.sources.length,
      aiContext: aiContext || undefined,
      model: 'database_search + deepseek-chat'
    });

  } catch (error: any) {
    console.error('[溯源API] 错误:', error);
    return NextResponse.json(
      { error: '溯源服务暂时不可用', details: error.message },
        { status: 500 }
    );
  }
}
