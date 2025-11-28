/**
 * 验证数据库中的总记录数
 */

const BASE_URL = 'http://localhost:3001';

async function verifyTotal() {
  try {
    // 查询课题库
    const topicRes = await fetch(`${BASE_URL}/api/books?library_type=课题库&limit=10000`);
    const topicBooks = await topicRes.json();

    // 查询课艺库
    const practiceRes = await fetch(`${BASE_URL}/api/books?library_type=课艺库&limit=10000`);
    const practiceBooks = await practiceRes.json();

    console.log('📊 数据库验证结果:');
    console.log(`课题库: ${topicBooks.length} 条`);
    console.log(`课艺库: ${practiceBooks.length} 条`);
    console.log(`总计: ${topicBooks.length + practiceBooks.length} 条`);

  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  }
}

verifyTotal();
