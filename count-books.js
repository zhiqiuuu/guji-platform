/**
 * 统计数据库中的书籍总数
 */

async function countBooks() {
  try {
    console.log('📊 正在统计书籍数量...\n');

    // 使用 count API
    const response = await fetch('http://localhost:3000/api/books/count');

    if (!response.ok) {
      // 如果没有 count API,则用其他方式
      console.log('使用备用方法统计...\n');

      let offset = 0;
      const limit = 1000;
      let total = 0;

      while (true) {
        const res = await fetch(`http://localhost:3000/api/books?limit=${limit}&offset=${offset}`);
        const books = await res.json();

        if (!Array.isArray(books) || books.length === 0) {
          break;
        }

        total += books.length;
        offset += limit;

        if (books.length < limit) {
          break;
        }
      }

      console.log(`=== 统计结果 ===`);
      console.log(`📚 书籍总数: ${total} 条\n`);
      console.log(`✅ 统计完成!`);

    } else {
      const result = await response.json();
      console.log(`=== 统计结果 ===`);
      console.log(`📚 书籍总数: ${result.total || result.count} 条\n`);
      console.log(`✅ 统计完成!`);
    }
  } catch (error) {
    console.error('❌ 统计失败:', error.message);
  }
}

countBooks();
