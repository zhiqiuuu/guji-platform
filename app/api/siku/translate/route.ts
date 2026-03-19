import { NextRequest, NextResponse } from 'next/server';
import { chatBearer } from '@/lib/spark-bearer';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface TranslateRequest {
  text: string;
  targetLanguage: 'modern_chinese' | 'english';
  style?: 'literal' | 'free'; // 直译或意译
}

/**
 * 古文翻译API
 * 将文言文翻译为白话文或英文
 */
export async function POST(request: NextRequest) {
  try {
    const body: TranslateRequest = await request.json();
    const { text, targetLanguage, style = 'free' } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: '翻译文本不能为空' },
        { status: 400 }
      );
    }

    console.log(`[翻译API] 翻译文本(${targetLanguage}):`, text.substring(0, 50));

    // 构建翻译提示词
    let prompt = '';

    if (targetLanguage === 'modern_chinese') {
      prompt = `你是专业的古文翻译专家。请将以下文言文翻译成现代汉语。

要求:
1. 准确传达原文意思
2. 使用通俗易懂的现代汉语
3. ${style === 'literal' ? '采用直译方式,保持原文结构' : '采用意译方式,使译文流畅自然'}
4. 对于专有名词(人名、地名、官职等)保留原文并加注释
5. 如果是诗词,先给出${style === 'literal' ? '逐句直译' : '整体意译'},再简要说明意境

原文:
${text}

请直接给出译文,格式如下:

【译文】
(你的翻译)

【注释】(如果需要)
(专有名词的注释)`;

    } else {
      // 英文翻译
      prompt = `You are a professional translator specializing in classical Chinese literature. Please translate the following classical Chinese text into English.

Requirements:
1. Accurately convey the original meaning
2. Use clear and idiomatic English
3. ${style === 'literal' ? 'Provide literal translation, keeping the original structure' : 'Provide free translation with natural flow'}
4. Keep proper nouns in original Chinese with annotations
5. For poetry, provide both translation and brief explanation of artistic conception

Original text:
${text}

Please provide the translation in the following format:

【Translation】
(Your English translation)

【Notes】 (if needed)
(Annotations for proper nouns and cultural references)`;
    }

    // 调用大模型
    const response = await chatBearer(prompt, [], {
      temperature: 0.3, // 翻译任务使用较低温度,保证准确性
      max_tokens: 1500,
    });

    return NextResponse.json({
      success: true,
      originalText: text,
      translation: response,
      targetLanguage,
      translationStyle: style,
      model: 'deepseek-chat'
    });

  } catch (error: any) {
    console.error('[翻译API] 错误:', error);
    return NextResponse.json(
      { error: '翻译服务暂时不可用', details: error.message },
      { status: 500 }
    );
  }
}
