/**
 * 测试星火 HTTP API HMAC 签名
 */

const crypto = require('crypto');

const SPARK_API_KEY = 'f230e82bb46c00d317d5c7702ca3732e';
const SPARK_API_SECRET = 'Njg4MDQ3ZDUzZWY2MTg4Y2VhNjMwOTc0';

function generateHmacSignature(data, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  return hmac.update(data).digest('base64');
}

async function testSparkHTTP() {
  const host = 'spark-api-open.xf-yun.com';
  const path = '/v1/chat/completions';
  const date = new Date().toUTCString();

  console.log('=== 请求信息 ===');
  console.log('Host:', host);
  console.log('Path:', path);
  console.log('Date:', date);

  // 构建签名原文
  const signatureOrigin = `host: ${host}\ndate: ${date}\nPOST ${path} HTTP/1.1`;
  console.log('\n签名原文:');
  console.log(signatureOrigin);

  // 使用 HMAC-SHA256 进行加密
  const signature = generateHmacSignature(signatureOrigin, SPARK_API_SECRET);
  console.log('\nHMAC Signature:', signature);

  // 构建 authorization
  const authorizationOrigin = `api_key="${SPARK_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  console.log('\nAuthorization Origin:');
  console.log(authorizationOrigin);

  const authorization = Buffer.from(authorizationOrigin).toString('base64');
  console.log('\nAuthorization (Base64):', authorization);

  const requestBody = {
    model: 'lite',
    messages: [
      { role: 'user', content: '你好' }
    ],
    temperature: 0.7,
    max_tokens: 2048,
  };

  console.log('\n=== 发送请求 ===');

  const response = await fetch(`https://${host}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'host': host,
      'date': date,
      'authorization': authorization,
    },
    body: JSON.stringify(requestBody),
  });

  console.log('状态码:', response.status);

  const text = await response.text();
  console.log('\n响应:');
  console.log(text);

  if (response.ok) {
    const data = JSON.parse(text);
    if (data.choices && data.choices[0]) {
      console.log('\n✓ 成功! 回复:', data.choices[0].message.content);
      return true;
    }
  }

  return false;
}

testSparkHTTP()
  .then(success => {
    if (success) {
      console.log('\n✓✓✓ 测试成功!');
      process.exit(0);
    } else {
      console.log('\n✗✗✗ 测试失败!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n✗ 错误:', error);
    process.exit(1);
  });
