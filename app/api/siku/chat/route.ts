import { NextRequest, NextResponse } from 'next/server';
import { chatBearer } from '@/lib/spark-bearer';
import {
  retrieveSikuContext,
  formatSikuContext,
  buildSystemPrompt,
  analyzeQuestionType,
  QuestionType
} from '@/lib/siku-rag-service';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface SikuChatRequest {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  functionType?: QuestionType; // 可选:用户指定功能类型
  temperature?: number;
  max_tokens?: number;
}

/**
 * 云四库风格的智能问答API
 *
 * 支持六大核心功能:
 * 1. 古文翻译 (文言文→白话文/英文)
 * 2. 文献溯源 (定位出处)
 * 3. 古文标点
 * 4. 诗文赏析
 * 5. 实体提取 (人名、地名、职官等)
 * 6. 知识问答 (文史哲问题)
 */
export async function POST(request: NextRequest) {
  try {
    const body: SikuChatRequest = await request.json();
    const { message, history = [], functionType, temperature, max_tokens } = body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json(
        { error: '消息内容不能为空' },
        { status: 400 }
      );
    }

    console.log('[云四库AI] 收到问题:', message);

    // 1. 分析问题类型
    const analysis = functionType
      ? { type: functionType, needsRAG: true }
      : analyzeQuestionType(message);

    console.log('[云四库AI] 问题类型:', analysis.type);

    // 2. 执行RAG检索(如果需要)
    let contextPrompt = '';
    let hasContext = false;

    if (analysis.needsRAG || analysis.type !== QuestionType.TRANSLATION) {
      console.log('[云四库AI] 开始RAG检索...');
      const context = await retrieveSikuContext(message);

      if (context.relevantInfo && context.relevantInfo.trim() !== '') {
        contextPrompt = context.relevantInfo;
        hasContext = true;
        console.log('[云四库AI] 检索到相关上下文');
      }
    }

    // 3. 构建系统提示词
    const systemPrompt = buildSystemPrompt(analysis.type);

    // 4. 构建增强后的消息
    let enhancedMessage = message;

    if (hasContext) {
      enhancedMessage = `${contextPrompt}\n\n---\n\n${systemPrompt}\n\n用户问题: ${message}`;
    } else {
      enhancedMessage = `${systemPrompt}\n\n用户问题: ${message}`;
    }

    // 5. 调用大语言模型
    console.log('[云四库AI] 调用大模型...');
    const response = await chatBearer(enhancedMessage, history, {
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens ?? 2000,
    });

    // 6. 返回结果
    return NextResponse.json({
      success: true,
      message: response,
      model: 'deepseek-chat',
      questionType: analysis.type,
      hasContext,
      systemInfo: {
        version: '1.0.0',
        name: '识典古籍智能问答系统',
        description: '基于大语言模型的文史领域专业问答服务'
      }
    });

  } catch (error: any) {
    console.error('[云四库AI] 错误:', error);
    return NextResponse.json(
      {
        error: 'AI服务暂时不可用',
        details: error.message,
        suggestion: '请稍后重试或联系技术支持'
      },
      { status: 500 }
    );
  }
}
