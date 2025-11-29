/**
 * 测试讯飞星火 API 集成
 */

async function testSparkAPI() {
  console.log('🧪 测试讯飞星火 API 集成\n');

  try {
    // 测试 1: 简单问答
    console.log('📝 测试 1: 简单问答');
    console.log('发送消息: "你好,请介绍一下自己"');

    const response1 = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '你好,请介绍一下自己',
        stream: false,
      }),
    });

    const result1 = await response1.json();

    if (response1.ok) {
      console.log('✅ 成功!');
      console.log('模型:', result1.model);
      console.log('回复:', result1.message);
      console.log('');
    } else {
      console.log('❌ 失败:', result1.error);
      console.log('详情:', result1.details || '无');
      return;
    }

    // 测试 2: 带历史记录的对话
    console.log('📝 测试 2: 带历史记录的对话');
    console.log('发送消息: "请用一句话总结《论语》的核心思想"');

    const response2 = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '请用一句话总结《论语》的核心思想',
        history: [
          { role: 'user', content: '你好,请介绍一下自己' },
          { role: 'assistant', content: result1.message },
        ],
        stream: false,
      }),
    });

    const result2 = await response2.json();

    if (response2.ok) {
      console.log('✅ 成功!');
      console.log('回复:', result2.message);
      console.log('');
    } else {
      console.log('❌ 失败:', result2.error);
      console.log('详情:', result2.details || '无');
      return;
    }

    // 测试 3: 流式响应
    console.log('📝 测试 3: 流式响应');
    console.log('发送消息: "请解释什么是古籍数字化"');

    const response3 = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '请解释什么是古籍数字化',
        stream: true,
      }),
    });

    if (response3.ok) {
      console.log('✅ 开始接收流式响应:');
      console.log('---');

      const reader = response3.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let fullText = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((line) => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.chunk) {
                fullText += data.chunk;
                process.stdout.write(data.chunk);
              } else if (data.error) {
                console.log('\n❌ 流式错误:', data.error);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
        console.log('\n---');
        console.log('✅ 流式响应完成!');
        console.log('');
      }
    } else {
      const result3 = await response3.json();
      console.log('❌ 失败:', result3.error);
      console.log('详情:', result3.details || '无');
      return;
    }

    console.log('✅ 所有测试通过!');
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('\n请确保:');
    console.error('1. 开发服务器正在运行 (npm run dev)');
    console.error('2. .env.local 中配置了正确的星火 API 凭证');
    console.error('3. 网络连接正常');
  }
}

// 执行测试
testSparkAPI();
