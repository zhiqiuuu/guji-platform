import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { Book } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const EXCEL_FILE = path.join(DATA_DIR, 'books.xlsx');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// 确保目录存在
export function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

// 初始化 Excel 文件
export function initializeExcel() {
  ensureDirectories();

  if (!fs.existsSync(EXCEL_FILE)) {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['id', 'title', 'author', 'dynasty', 'category', 'description', 'cover_url', 'file_url', 'file_type', 'page_count', 'view_count', 'created_at', 'updated_at']
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Books');
    XLSX.writeFile(wb, EXCEL_FILE);
  }
}

// 读取所有书籍
export function getAllBooks(): Book[] {
  initializeExcel();

  try {
    const wb = XLSX.readFile(EXCEL_FILE);
    const ws = wb.Sheets['Books'];
    const data = XLSX.utils.sheet_to_json(ws) as any[];

    return data.map((row: any) => ({
      id: row.id || '',
      title: row.title || '',
      author: row.author || '',
      dynasty: row.dynasty || '',
      category: row.category || '',
      description: row.description || null,
      keywords: row.keywords || null,
      cover_url: row.cover_url || null,
      file_url: row.file_url || '',
      file_type: row.file_type || 'pdf',
      page_count: row.page_count || null,
      view_count: row.view_count || 0,
      full_text: row.full_text || null,
      ocr_status: row.ocr_status || 'pending',
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString()
    }));
  } catch (error) {
    console.error('读取 Excel 失败:', error);
    return [];
  }
}

// 添加书籍
export function addBook(book: Omit<Book, 'id' | 'view_count' | 'created_at' | 'updated_at'>): Book {
  try {
    console.log('开始添加书籍, 输入数据:', book);
    const books = getAllBooks();
    console.log('当前书籍数量:', books.length);

    const newBook: Book = {
      id: generateUUID(),
      ...book,
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('新书籍对象:', newBook);
    books.push(newBook);

    console.log('准备保存到Excel文件:', EXCEL_FILE);
    saveBooks(books);
    console.log('保存成功!');

    return newBook;
  } catch (error) {
    console.error('addBook 发生错误:', error);
    throw new Error(`添加书籍失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 更新书籍
export function updateBook(id: string, updates: Partial<Book>): Book | null {
  const books = getAllBooks();
  const index = books.findIndex(b => b.id === id);

  if (index === -1) return null;

  books[index] = {
    ...books[index],
    ...updates,
    updated_at: new Date().toISOString()
  };

  saveBooks(books);
  return books[index];
}

// 删除书籍
export function deleteBook(id: string): boolean {
  const books = getAllBooks();
  const filteredBooks = books.filter(b => b.id !== id);

  if (filteredBooks.length === books.length) return false;

  saveBooks(filteredBooks);
  return true;
}

// 保存书籍到 Excel
function saveBooks(books: Book[]) {
  try {
    console.log('saveBooks: 开始保存', books.length, '本书籍');
    console.log('Excel文件路径:', EXCEL_FILE);

    const wb = XLSX.utils.book_new();
    const wsData = [
      ['id', 'title', 'author', 'dynasty', 'category', 'description', 'cover_url', 'file_url', 'file_type', 'page_count', 'view_count', 'created_at', 'updated_at'],
      ...books.map(b => [
        b.id,
        b.title,
        b.author,
        b.dynasty,
        b.category,
        b.description || '',
        b.cover_url || '',
        b.file_url,
        b.file_type,
        b.page_count || '',
        b.view_count,
        b.created_at,
        b.updated_at
      ])
    ];

    console.log('wsData 生成成功, 行数:', wsData.length);
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Books');

    console.log('准备写入文件...');
    XLSX.writeFile(wb, EXCEL_FILE);
    console.log('文件写入成功!');

    // 验证文件是否真的写入成功
    if (fs.existsSync(EXCEL_FILE)) {
      const stats = fs.statSync(EXCEL_FILE);
      console.log('文件大小:', stats.size, 'bytes');
    } else {
      console.error('警告: 文件写入后不存在!');
    }
  } catch (error) {
    console.error('saveBooks 发生错误:', error);
    console.error('错误详情:', error instanceof Error ? error.stack : String(error));
    throw new Error(`保存Excel文件失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 生成简单的 UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 筛选书籍
export function filterBooks(params: {
  search?: string;
  category?: string;
  dynasty?: string;
}): Book[] {
  let books = getAllBooks();

  if (params.search) {
    const searchLower = params.search.toLowerCase();
    books = books.filter(b =>
      b.title.toLowerCase().includes(searchLower) ||
      b.author.toLowerCase().includes(searchLower)
    );
  }

  if (params.category) {
    books = books.filter(b => b.category === params.category);
  }

  if (params.dynasty) {
    books = books.filter(b => b.dynasty === params.dynasty);
  }

  return books;
}
