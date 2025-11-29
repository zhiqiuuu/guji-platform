import { NextRequest, NextResponse } from 'next/server';
import { chatBearer } from '@/lib/spark-bearer';
import { retrieveContext, formatContextForAI } from '@/lib/rag-service';

export const runtime = 'nodejs';
export const maxDuration = 60; // 最长60秒超时

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

/**
 * AI 聊天 API
 * 使用讯飞星火 Lite 模型 + RAG (检索增强生成)
 */
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

    const { message, history = [], stream: isStream = false, temperature, max_tokens } = body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json(
        { error: '消息内容不能为空' },
        { status: 400 }
      );
    }

    // RAG: 从数据库检索相关上下文
    console.log('[RAG] 开始检索相关上下文...');
    const context = await retrieveContext(message);
    const contextPrompt = formatContextForAI(context);

    console.log('[RAG] 检索到的上下文:', contextPrompt ? '有相关信息' : '无相关信息');

    // 构建增强后的消息
    let enhancedMessage = message;
    if (contextPrompt) {
      // 将检索到的上下文添加到用户消息前面
      enhancedMessage = `${contextPrompt}\n\n用户问题: ${message}`;
    }

    // 使用星火 HTTP API - Bearer Token
    const response = await chatBearer(enhancedMessage, history, {
      temperature,
      max_tokens,
    });

    return NextResponse.json({
      success: true,
      message: response,
      model: 'spark-lite',
      hasContext: !!contextPrompt, // 告诉前端是否使用了数据库上下文
    });
  } catch (error: any) {
    console.error('AI 聊天错误:', error);
    return NextResponse.json(
      { error: 'AI服务暂时不可用', details: error.message },
      { status: 500 }
    );
  }
}
