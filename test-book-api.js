// 测试书籍API的脚本
const bookId = '79c7039a-74b3-4cef-bd82-fc4ca061f90c';

console.log('正在测试书籍API...');
console.log('书籍ID:', bookId);

fetch(`http://localhost:3000/api/books/${bookId}`)
  .then(response => {
    console.log('响应状态码:', response.status);
    console.log('响应状态文本:', response.statusText);
    return response.json();
  })
  .then(data => {
    console.log('响应数据:', JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error('请求失败:', error);
  });
