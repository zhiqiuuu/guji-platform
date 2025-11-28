/**
 * 检查数据库中的书籍总数
 */

const BASE_URL = 'http://localhost:3000';

async function checkTotalBooks() {
  try {
    console.log('📊 正在查询数据库...\n');

    const response = await fetch(`${BASE_URL}/api/books?limit=1&offset=0`);
    const result = await response.json();

    if (response.ok) {
      console.log('=== 数据库统计 ===\n');
      console.log(`📚 书籍总数: ${result.total} 条\n`);

      // 按类别统计
      console.log('按类别统计:');
      const categories = ['经学', '史学', '掌故', '算学', '舆地', '词章'];
      for (const category of categories) {
        const catResponse = await fetch(
          `${BASE_URL}/api/books?category=${encodeURIComponent(category)}&limit=1`
        );
        const catResult = await catResponse.json();
        if (catResponse.ok) {
          console.log(`  ${category}: ${catResult.total} 条`);
        }
      }

      // 按库类型统计
      console.log('\n按书库类型统计:');
      const types = ['课题库', '课艺库'];
      for (const type of types) {
        const typeResponse = await fetch(
          `${BASE_URL}/api/books?library_type=${encodeURIComponent(type)}&limit=1`
        );
        const typeResult = await typeResponse.json();
        if (typeResponse.ok) {
          console.log(`  ${type}: ${typeResult.total} 条`);
        }
      }

      console.log('\n✅ 查询完成!');
    } else {
      console.error('❌ 查询失败:', result.error);
    }
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

checkTotalBooks();
