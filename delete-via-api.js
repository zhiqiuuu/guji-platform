// 通过 API 路由删除所有书籍
async function deleteAllBooks() {
  try {
    console.log('🗑️  开始通过 API 删除所有书籍...');
    
    const response = await fetch('http://localhost:3001/api/books/clear-all', {
      method: 'POST',
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ 删除成功:', result);
    } else {
      console.error('❌ 删除失败:', result);
    }
  } catch (error) {
    console.error('❌ 请求失败:', error);
  }
}

deleteAllBooks();
