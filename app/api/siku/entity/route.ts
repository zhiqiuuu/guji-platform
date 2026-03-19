import { NextRequest, NextResponse } from 'next/server';
import { extractEntities } from '@/lib/siku-rag-service';
import { chatBearer } from '@/lib/spark-bearer';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface EntityRequest {
  text: string;
  entityTypes?: string[]; // 指定要提取的实体类型
  withAnnotation?: boolean; // 是否需要AI为实体添加注释
}

/**
 * 实体提取API
 * 从古文中提取人名、地名、职官、事件等实体
 */
export async function POST(request: NextRequest) {
  try {
    const body: EntityRequest = await request.json();
    const { text, entityTypes, withAnnotation = false } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: '文本不能为空' },
        { status: 400 }
      );
    }

    console.log('[实体提取API] 提取文本:', text.substring(0, 50));

    // 1. 执行实体提取
    const entities = await extractEntities(text);

    // 2. 过滤用户指定的实体类型
    let filteredEntities = entities;
    if (entityTypes && entityTypes.length > 0) {
      filteredEntities = {
        persons: entityTypes.includes('person') ? entities.persons : [],
        places: entityTypes.includes('place') ? entities.places : [],
        officials: entityTypes.includes('official') ? entities.officials : [],
        events: entityTypes.includes('event') ? entities.events : [],
        works: entityTypes.includes('work') ? entities.works : [],
        dynasties: entityTypes.includes('dynasty') ? entities.dynasties : [],
        concepts: entityTypes.includes('concept') ? entities.concepts : []
      };
    }

    // 3. 如果需要AI注释
    let annotations: Record<string, string> = {};
    if (withAnnotation) {
      // 收集所有需要注释的实体
      const allEntities = [
        ...filteredEntities.persons,
        ...filteredEntities.places,
        ...filteredEntities.officials,
        ...filteredEntities.works
      ].slice(0, 10); // 最多注释10个实体,避免token消耗过大

      if (allEntities.length > 0) {
        const prompt = `请为以下古文中的实体提供简要注释(每个20字以内):

原文: ${text}

实体列表:
${allEntities.map((e, i) => `${i + 1}. ${e}`).join('\n')}

请按以下格式输出(只输出有信息的实体):
实体名: 简要注释

例如:
王安石: 北宋政治家、文学家,主持熙宁变法
金陵: 今南京,六朝古都`;

        try {
          const response = await chatBearer(prompt, [], {
            temperature: 0.3,
            max_tokens: 1000,
          });

          // 简单解析AI返回的注释
          const lines = response.split('\n');
          lines.forEach(line => {
            const match = line.match(/^(.+?)[::](.+)$/);
            if (match) {
              const [, entity, annotation] = match;
              annotations[entity.trim()] = annotation.trim();
            }
          });
        } catch (error) {
          console.error('[实体提取API] AI注释生成失败:', error);
        }
      }
    }

    // 4. 统计结果
    const totalCount = Object.values(filteredEntities).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

    return NextResponse.json({
      success: true,
      originalText: text,
      entities: filteredEntities,
      annotations: Object.keys(annotations).length > 0 ? annotations : undefined,
      statistics: {
        total: totalCount,
        persons: filteredEntities.persons.length,
        places: filteredEntities.places.length,
        officials: filteredEntities.officials.length,
        events: filteredEntities.events.length,
        works: filteredEntities.works.length,
        dynasties: filteredEntities.dynasties.length,
        concepts: filteredEntities.concepts.length
      },
      model: 'rule_based' + (withAnnotation ? ' + deepseek-chat' : '')
    });

  } catch (error: any) {
    console.error('[实体提取API] 错误:', error);
    return NextResponse.json(
      { error: '实体提取服务暂时不可用', details: error.message },
      { status: 500 }
    );
  }
}
