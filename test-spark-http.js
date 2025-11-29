/**
 * 测试讯飞星火 HTTP API
 */

const SPARK_API_KEY = 'f230e82bb46c00d317d5c7702ca3732e';
const SPARK_API_SECRET = 'Njg4MDQ3ZDUzZWY2MTg4Y2VhNjMwOTc0';

// 方法 1: 使用 apiKey:apiSecret
async function testMethod1() {
  console.log('\n=== 测试方法 1: apiKey:apiSecret ===');

  const apiPassword = Buffer.from(`${SPARK_API_KEY}:${SPARK_API_SECRET}`).toString('base64');
  console.log('APIPassword:', apiPassword);

  const requestBody = {
    model: 'lite',
    messages: [
      { role: 'user', content: '你好' }
    ],
    temperature: 0.7,
    max_tokens: 2048,
  };

  try {
    const response = await fetch('https://spark-api-open.xf-yun.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiPassword}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('状态码:', response.status);
    const data = await response.json();
    console.log('响应:', JSON.stringify(data, null, 2));

    if (data.choices && data.choices[0]) {
      console.log('✓ 成功! 回复:', data.choices[0].message.content);
      return true;
    }
  } catch (error) {
    console.error('✗ 错误:', error.message);
  }
  return false;
}

// 方法 2: 直接使用 API_KEY
async function testMethod2() {
  console.log('\n=== 测试方法 2: 直接使用 API_KEY ===');

  const requestBody = {
    model: 'lite',
    messages: [
      { role: 'user', content: '你好' }
    ],
    temperature: 0.7,
    max_tokens: 2048,
  };

  try {
    const response = await fetch('https://spark-api-open.xf-yun.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SPARK_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('状态码:', response.status);
    const data = await response.json();
    console.log('响应:', JSON.stringify(data, null, 2));

    if (data.choices && data.choices[0]) {
      console.log('✓ 成功! 回复:', data.choices[0].message.content);
      return true;
    }
  } catch (error) {
    console.error('✗ 错误:', error.message);
  }
  return false;
}

// 方法 3: 使用 API_SECRET
async function testMethod3() {
  console.log('\n=== 测试方法 3: 直接使用 API_SECRET ===');

  const requestBody = {
    model: 'lite',
    messages: [
      { role: 'user', content: '你好' }
    ],
    temperature: 0.7,
    max_tokens: 2048,
  };

  try {
    const response = await fetch('https://spark-api-open.xf-yun.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SPARK_API_SECRET}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('状态码:', response.status);
    const data = await response.json();
    console.log('响应:', JSON.stringify(data, null, 2));

    if (data.choices && data.choices[0]) {
      console.log('✓ 成功! 回复:', data.choices[0].message.content);
      return true;
    }
  } catch (error) {
    console.error('✗ 错误:', error.message);
  }
  return false;
}

// 运行所有测试
(async () => {
  const result1 = await testMethod1();
  if (result1) {
    console.log('\n✓✓✓ 方法 1 成功!使用这种方法。');
    process.exit(0);
  }

  const result2 = await testMethod2();
  if (result2) {
    console.log('\n✓✓✓ 方法 2 成功!使用这种方法。');
    process.exit(0);
  }

  const result3 = await testMethod3();
  if (result3) {
    console.log('\n✓✓✓ 方法 3 成功!使用这种方法。');
    process.exit(0);
  }

  console.log('\n✗✗✗ 所有方法都失败了!');
  process.exit(1);
})();
