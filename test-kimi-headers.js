/**
 * Kimi API 请求头测试
 * 尝试不同的请求头格式
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const KIMI_API_KEY = process.env.KIMI_API_KEY;
const KIMI_API_BASE_URL = process.env.KIMI_API_BASE_URL || 'https://api.moonshot.cn/v1';

console.log('🧪 测试不同的 Kimi API 请求头格式\n');
console.log('='.repeat(70));
console.log(`API Key: ${KIMI_API_KEY.substring(0, 20)}...`);
console.log(`Base URL: ${KIMI_API_BASE_URL}\n`);

// 测试配置列表
const testConfigs = [
  {
    name: '标准 Bearer Token',
    headers: {
      'Authorization': `Bearer ${KIMI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  },
  {
    name: 'Bearer Token + User-Agent',
    headers: {
      'Authorization': `Bearer ${KIMI_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  },
  {
    name: 'Authorization 不带 Bearer 前缀',
    headers: {
      'Authorization': KIMI_API_KEY,
      'Content-Type': 'application/json'
    }
  },
  {
    name: 'api-key 请求头',
    headers: {
      'api-key': KIMI_API_KEY,
      'Content-Type': 'application/json'
    }
  },
  {
    name: 'X-API-Key 请求头',
    headers: {
      'X-API-Key': KIMI_API_KEY,
      'Content-Type': 'application/json'
    }
  },
  {
    name: 'Bearer + Accept 头',
    headers: {
      'Authorization': `Bearer ${KIMI_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }
];

async function testHeaders() {
  for (let i = 0; i < testConfigs.length; i++) {
    const config = testConfigs[i];
    console.log(`\n测试 ${i + 1}/${testConfigs.length}: ${config.name}`);
    console.log('-'.repeat(70));

    try {
      const response = await fetch(`${KIMI_API_BASE_URL}/models`, {
        method: 'GET',
        headers: config.headers
      });

      console.log(`状态码: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ 成功!');
        console.log(`可用模型数量: ${data.data?.length || 0}`);
        if (data.data && data.data.length > 0) {
          console.log('模型列表:');
          data.data.forEach(model => {
            console.log(`  - ${model.id}`);
          });
        }

        console.log('\n' + '='.repeat(70));
        console.log('🎉 找到正确的请求头格式!');
        console.log('='.repeat(70));
        console.log('\n正确的配置:');
        console.log(JSON.stringify(config.headers, null, 2));

        return config;
      } else {
        const errorText = await response.text();
        console.log('❌ 失败');
        try {
          const errorJson = JSON.parse(errorText);
          console.log(`错误: ${errorJson.error?.message || errorText}`);
        } catch (e) {
          console.log(`错误: ${errorText.substring(0, 200)}`);
        }
      }
    } catch (error) {
      console.log('❌ 请求异常:', error.message);
    }

    // 等待一下,避免请求太频繁
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(70));
  console.log('⚠️  所有请求头格式都失败了');
  console.log('='.repeat(70));
  return null;
}

// 如果找到正确的格式,测试聊天功能
async function testChat(headers) {
  if (!headers) return;

  console.log('\n\n📝 测试聊天功能...');
  console.log('='.repeat(70));

  try {
    const response = await fetch(`${KIMI_API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          {
            role: 'system',
            content: '你是一个古籍专家助手。'
          },
          {
            role: 'user',
            content: '请用一句话介绍《论语》。'
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ 聊天功能正常!');
      console.log('\nAI 回复:');
      console.log(data.choices[0].message.content);
      console.log('\nToken 使用:');
      console.log(JSON.stringify(data.usage, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ 聊天功能失败:', errorText);
    }
  } catch (error) {
    console.log('❌ 聊天测试异常:', error.message);
  }
}

async function main() {
  const successConfig = await testHeaders();

  if (successConfig) {
    await testChat(successConfig.headers);
  } else {
    console.log('\n建议:');
    console.log('1. 确认 API key 是否有效');
    console.log('2. 检查 Kimi 平台账户状态');
    console.log('3. 查看官方文档: https://platform.moonshot.cn/docs');
  }

  console.log('\n测试完成!\n');
}

main().catch(console.error);
