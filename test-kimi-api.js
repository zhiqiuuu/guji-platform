/**
 * Kimi API 连接测试脚本
 * 用于验证 API key 是否有效以及基本功能测试
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const KIMI_API_KEY = process.env.KIMI_API_KEY;
const KIMI_API_BASE_URL = process.env.KIMI_API_BASE_URL || 'https://api.moonshot.cn/v1';

async function testKimiAPI() {
  console.log('🚀 开始测试 Kimi API 连接...\n');

  // 检查环境变量
  if (!KIMI_API_KEY) {
    console.error('❌ 错误: 未找到 KIMI_API_KEY 环境变量');
    process.exit(1);
  }

  console.log('✅ API Key 已加载:', KIMI_API_KEY.substring(0, 20) + '...');
  console.log('✅ API Base URL:', KIMI_API_BASE_URL);
  console.log('');

  // 测试 1: 检查模型列表
  console.log('📋 测试 1: 获取可用模型列表...');
  try {
    const modelsResponse = await fetch(`${KIMI_API_BASE_URL}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KIMI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!modelsResponse.ok) {
      throw new Error(`HTTP ${modelsResponse.status}: ${modelsResponse.statusText}`);
    }

    const modelsData = await modelsResponse.json();
    console.log('✅ 模型列表获取成功:');
    modelsData.data.forEach(model => {
      console.log(`   - ${model.id}`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ 获取模型列表失败:', error.message);
    return;
  }

  // 测试 2: 简单的对话请求
  console.log('💬 测试 2: 发送简单对话请求...');
  try {
    const chatResponse = await fetch(`${KIMI_API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIMI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: '你是一个古籍专家助手,擅长解答古籍相关问题。'
          },
          {
            role: 'user',
            content: '请用一句话介绍什么是古籍。'
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      throw new Error(`HTTP ${chatResponse.status}: ${errorText}`);
    }

    const chatData = await chatResponse.json();
    console.log('✅ 对话请求成功!');
    console.log('📝 AI 回复:', chatData.choices[0].message.content);
    console.log('📊 Token 使用:', JSON.stringify(chatData.usage, null, 2));
    console.log('');
  } catch (error) {
    console.error('❌ 对话请求失败:', error.message);
    return;
  }

  // 测试 3: 古籍相关场景测试
  console.log('📚 测试 3: 古籍场景 - 书籍摘要生成...');
  try {
    const summaryResponse = await fetch(`${KIMI_API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIMI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: '你是一个古籍专家,负责为古籍生成简洁的摘要。'
          },
          {
            role: 'user',
            content: '请为《论语》生成一段50字以内的摘要。'
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!summaryResponse.ok) {
      const errorText = await summaryResponse.text();
      throw new Error(`HTTP ${summaryResponse.status}: ${errorText}`);
    }

    const summaryData = await summaryResponse.json();
    console.log('✅ 摘要生成成功!');
    console.log('📝 生成的摘要:', summaryData.choices[0].message.content);
    console.log('');
  } catch (error) {
    console.error('❌ 摘要生成失败:', error.message);
    return;
  }

  console.log('🎉 所有测试完成! Kimi API 工作正常。');
}

// 运行测试
testKimiAPI().catch(console.error);
