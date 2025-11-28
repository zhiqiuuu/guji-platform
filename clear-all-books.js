/**
 * 清空所有书籍数据的脚本
 *
 * 使用方法:
 * node clear-all-books.js
 */

async function clearAllBooks() {
  try {
    console.log('🗑️  准备清空所有书籍数据...\n');
    console.log('⚠️  警告: 此操作不可逆!');
    console.log('⚠️  将删除所有书籍及相关数据(阅读历史、书架、笔记等)\n');

    const response = await fetch('http://localhost:3000/api/books/clear-all', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ 删除成功!\n');
      console.log('删除结果:');
      console.log(`  - 剩余书籍: ${result.result.books} 条`);
      console.log(`  - 剩余段落: ${result.result.paragraphs} 条`);
      console.log(`  - 剩余书架: ${result.result.bookshelf} 条`);
      console.log('\n所有书籍数据已清空!');
    } else {
      console.error('❌ 删除失败:', result.error);
      if (result.details) {
        console.error('详情:', result.details);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 发生错误:', error.message);
    console.error('\n请确保:');
    console.error('1. 开发服务器正在运行 (npm run dev)');
    console.error('2. 数据库连接正常');
    process.exit(1);
  }
}

// 执行清空操作
clearAllBooks();
