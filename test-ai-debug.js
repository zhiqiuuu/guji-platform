/**
 * AI 功能调试脚本
 * 用于测试讯飞星火 API 连接
 */

// 模拟环境变量
const SPARK_APP_ID = '603775a0';
const SPARK_API_SECRET = 'Njg4MDQ3ZDUzZWY2MTg4Y2VhNjMwOTc0';
const SPARK_API_KEY = 'f230e82bb46c00d317d5c7702ca3732e';

console.log('=== 环境变量检查 ===');
console.log('SPARK_APP_ID:', SPARK_APP_ID ? '✓ 已设置' : '✗ 未设置');
console.log('SPARK_API_SECRET:', SPARK_API_SECRET ? '✓ 已设置' : '✗ 未设置');
console.log('SPARK_API_KEY:', SPARK_API_KEY ? '✓ 已设置' : '✗ 未设置');

const crypto = require('crypto');
const WebSocket = require('ws');

function generateAuthUrl() {
  const host = 'spark-api.xf-yun.com';
  const path = '/v1.1/chat';
  const date = new Date().toUTCString();

  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
  const hmac = crypto.createHmac('sha256', SPARK_API_SECRET);
  const signature = hmac.update(signatureOrigin).digest('base64');

  const authorizationOrigin = `api_key="${SPARK_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = Buffer.from(authorizationOrigin).toString('base64');

  const url = `wss://spark-api.xf-yun.com/v1.1/chat?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${encodeURIComponent(host)}`;

  return url;
}

function buildRequestBody(message) {
  return {
    header: {
      app_id: SPARK_APP_ID,
      uid: 'user-' + Date.now(),
    },
    parameter: {
      chat: {
        domain: 'lite',
        temperature: 0.7,
        max_tokens: 2048,
      },
    },
    payload: {
      message: {
        text: [
          { role: 'user', content: message }
        ],
      },
    },
  };
}

async function testSparkAPI() {
  console.log('\n=== 开始测试星火 API ===');

  return new Promise((resolve, reject) => {
    try {
      const authUrl = generateAuthUrl();
      console.log('正在连接 WebSocket...');

      const ws = new WebSocket(authUrl);
      let fullResponse = '';

      ws.on('open', () => {
        console.log('✓ WebSocket 连接成功');
        const requestBody = buildRequestBody('你好');
        console.log('发送请求:', JSON.stringify(requestBody, null, 2));
        ws.send(JSON.stringify(requestBody));
      });

      ws.on('message', (data) => {
        try {
          const response = JSON.parse(data);
          console.log('收到响应:', JSON.stringify(response, null, 2));

          if (response.header?.code !== 0) {
            console.error('✗ API 返回错误:', response.header);
            ws.close();
            reject(new Error(`API 错误 (${response.header?.code}): ${response.header?.message}`));
            return;
          }

          const text = response.payload?.choices?.text || [];
          if (text.length > 0) {
            fullResponse += text[0].content || '';
          }

          if (response.header?.status === 2) {
            console.log('✓ 响应完成');
            console.log('完整响应内容:', fullResponse);
            ws.close();
            resolve(fullResponse);
          }
        } catch (error) {
          console.error('✗ 解析响应错误:', error);
          ws.close();
          reject(error);
        }
      });

      ws.on('error', (error) => {
        console.error('✗ WebSocket 错误:', error.message);
        reject(error);
      });

      ws.on('close', (code, reason) => {
        console.log('WebSocket 已关闭:', code, reason.toString());
      });

      setTimeout(() => {
        if (ws.readyState !== WebSocket.CLOSED) {
          console.error('✗ 请求超时');
          ws.close();
          reject(new Error('请求超时'));
        }
      }, 10000);

    } catch (error) {
      console.error('✗ 测试异常:', error);
      reject(error);
    }
  });
}

// 运行测试
testSparkAPI()
  .then(() => {
    console.log('\n=== 测试成功 ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n=== 测试失败 ===');
    console.error('错误:', error.message);
    process.exit(1);
  });
