'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

interface ImportBookData {
  library_type: '课题库' | '课艺库';
  academy: string;
  year: string;
  season: string;
  category: string;
  subject: string;
  author?: string;
  dynasty?: string;
  description?: string;
  file_url?: string;
  file_type?: string;
}

interface ValidationError {
  index: number;
  data: ImportBookData;
  errors: string[];
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportBookData[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'confirm'>('upload');

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage(null);
      setParsedData([]);
      setValidationErrors([]);
      setPreviewData([]);
      setStep('upload');
    }
  };

  // 解析文件
  const handleParseFile = async () => {
    if (!file) return;

    setLoading(true);
    setMessage(null);

    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          if (!data) throw new Error('文件读取失败');

          let parsedBooks: ImportBookData[] = [];

          // 解析CSV
          if (file.name.endsWith('.csv')) {
            const text = data as string;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map((h) => h.trim());

            for (let i = 1; i < lines.length; i++) {
              if (!lines[i].trim()) continue;
              const values = lines[i].split(',').map((v) => v.trim());
              const book: any = {};
              headers.forEach((header, index) => {
                book[header] = values[index] || '';
              });
              parsedBooks.push(book as ImportBookData);
            }
          }
          // 解析Excel
          else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const workbook = XLSX.read(data, { type: 'binary' });

            // 解析所有工作表
            workbook.SheetNames.forEach((sheetName) => {
              const worksheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet) as ImportBookData[];
              parsedBooks = parsedBooks.concat(jsonData);
            });
          }

          setParsedData(parsedBooks);

          // 验证数据
          const response = await fetch('/api/books/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ books: parsedBooks, dryRun: true }),
          });

          const result = await response.json();

          if (!response.ok) {
            if (result.invalidBooks) {
              setValidationErrors(result.invalidBooks);
              setMessage({ type: 'error', text: `发现 ${result.invalidBooks.length} 条数据验证失败` });
            } else {
              throw new Error(result.error || '验证失败');
            }
            setStep('upload');
          } else {
            setPreviewData(result.preview);
            setMessage({ type: 'success', text: `数据验证通过! 共 ${result.totalBooks} 条记录` });
            setStep('preview');
          }
        } catch (error: any) {
          setMessage({ type: 'error', text: error.message || '文件解析失败' });
        } finally {
          setLoading(false);
        }
      };

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '文件处理失败' });
      setLoading(false);
    }
  };

  // 确认导入
  const handleConfirmImport = async () => {
    if (parsedData.length === 0) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/books/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ books: parsedData, dryRun: false }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '导入失败');
      }

      setMessage({ type: 'success', text: result.message });
      setStep('confirm');

      // 重置状态
      setTimeout(() => {
        setFile(null);
        setParsedData([]);
        setPreviewData([]);
        setStep('upload');
      }, 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '导入失败' });
    } finally {
      setLoading(false);
    }
  };

  // 下载模板
  const handleDownloadTemplate = (type: 'topic' | 'essay') => {
    let csvContent = '';

    if (type === 'topic') {
      csvContent = 'library_type,academy,year,season,category,subject,author,dynasty\n';
      csvContent += '课题库,诂经精舍,1850,春,经学,论语·学而篇,未知,清\n';
      csvContent += '课题库,诂经精舍,1850,春,经学,孟子·梁惠王篇,未知,清\n';
    } else {
      csvContent = 'library_type,academy,year,season,category,subject,author,dynasty,description,file_url\n';
      csvContent += '课艺库,诂经精舍,1850,春,史学,史记·项羽本纪,张三,清,论项羽之兴亡...,/uploads/file1.pdf\n';
      csvContent += '课艺库,诂经精舍,1850,春,词章,登高赋,李四,清,秋日登高有感...,/uploads/file2.pdf\n';
    }

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = type === 'topic' ? '课题库导入模板.csv' : '课艺库导入模板.csv';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            📚 书籍数据导入
          </h1>
          <p className="text-gray-600">支持CSV和Excel格式批量导入课题库和课艺库数据</p>
        </div>

        {/* 消息提示 */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800'
                : 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 步骤指示器 */}
        <div className="mb-8 flex items-center justify-center space-x-4">
          <div className={`flex items-center ${step === 'upload' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              1
            </div>
            <span className="ml-2 font-medium">上传文件</span>
          </div>
          <div className="w-12 h-1 bg-gray-300"></div>
          <div className={`flex items-center ${step === 'preview' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              2
            </div>
            <span className="ml-2 font-medium">预览数据</span>
          </div>
          <div className="w-12 h-1 bg-gray-300"></div>
          <div className={`flex items-center ${step === 'confirm' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'confirm' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
              3
            </div>
            <span className="ml-2 font-medium">完成导入</span>
          </div>
        </div>

        {/* 模板下载 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">📋 课题库模板</h3>
            <p className="text-sm text-gray-600 mb-4">只有题目,没有正文的书目数据</p>
            <button
              onClick={() => handleDownloadTemplate('topic')}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              下载模板
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">📖 课艺库模板</h3>
            <p className="text-sm text-gray-600 mb-4">包含完整正文的课艺数据</p>
            <button
              onClick={() => handleDownloadTemplate('essay')}
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all"
            >
              下载模板
            </button>
          </div>
        </div>

        {/* 文件上传区域 */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="text-6xl mb-4">📂</div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                {file ? file.name : '点击选择文件或拖拽文件到此处'}
              </p>
              <p className="text-sm text-gray-500">支持 CSV, Excel (.xlsx, .xls) 格式</p>
            </label>
          </div>

          {file && step === 'upload' && (
            <button
              onClick={handleParseFile}
              disabled={loading}
              className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? '解析中...' : '解析并验证文件'}
            </button>
          )}
        </div>

        {/* 验证错误列表 */}
        {validationErrors.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-red-600 mb-4">❌ 验证失败的数据</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {validationErrors.map((error, idx) => (
                <div key={idx} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <p className="font-medium text-red-800 mb-2">第 {error.index + 2} 行数据:</p>
                  <pre className="text-xs bg-white p-2 rounded mb-2 overflow-x-auto">
                    {JSON.stringify(error.data, null, 2)}
                  </pre>
                  <ul className="list-disc list-inside text-sm text-red-700">
                    {error.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 数据预览 */}
        {step === 'preview' && previewData.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">👀 数据预览 (前5条)</h3>
            <div className="space-y-4 mb-6">
              {previewData.map((book, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">书库类型:</span> {book.library_type}</div>
                    <div><span className="font-medium">书院:</span> {book.academy}</div>
                    <div><span className="font-medium">年份:</span> {book.year}</div>
                    <div><span className="font-medium">季节:</span> {book.season}</div>
                    <div><span className="font-medium">类别:</span> {book.category}</div>
                    <div><span className="font-medium">题目:</span> {book.subject}</div>
                    <div className="col-span-2"><span className="font-medium">生成标题:</span> {book.title}</div>
                    <div className="col-span-2"><span className="font-medium">有正文:</span> {book.has_full_text ? '是' : '否'}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setStep('upload')}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all font-medium"
              >
                返回修改
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? '导入中...' : `确认导入 ${parsedData.length} 条记录`}
              </button>
            </div>
          </div>
        )}

        {/* 完成提示 */}
        {step === 'confirm' && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-green-600 mb-2">导入成功!</h3>
            <p className="text-gray-600">数据已成功导入到数据库</p>
          </div>
        )}
      </div>
    </div>
  );
}
