'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORIES, DYNASTIES } from '@/lib/constants';
import { Upload as UploadIcon } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCover, setSelectedCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    dynasty: '',
    category: '',
    description: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedCover(file);
      // 创建预览
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedFile) {
        alert('请选择文件');
        setLoading(false);
        return;
      }

      // 第一步：上传文件
      const fileFormData = new FormData();
      fileFormData.append('file', selectedFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: fileFormData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        console.error('文件上传失败:', error);
        alert(`文件上传失败: ${error.error || '未知错误'}`);
        setLoading(false);
        return;
      }

      const uploadResult = await uploadResponse.json();
      console.log('文件上传成功:', uploadResult);

      // 第二步：上传封面(如果有)
      let cover_url = null;
      if (selectedCover) {
        const coverFormData = new FormData();
        coverFormData.append('file', selectedCover);

        const coverResponse = await fetch('/api/upload', {
          method: 'POST',
          body: coverFormData,
        });

        if (coverResponse.ok) {
          const coverResult = await coverResponse.json();
          cover_url = coverResult.file_url;
          console.log('封面上传成功:', coverResult);
        }
      }

      // 第三步：创建书籍记录
      const bookData = {
        ...formData,
        file_url: uploadResult.file_url,
        file_type: uploadResult.file_type,
        cover_url: cover_url,
      };

      console.log('准备创建书籍记录:', bookData);

      const bookResponse = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookData),
      });

      if (bookResponse.ok) {
        const result = await bookResponse.json();
        console.log('书籍创建成功:', result);

        // 第四步：触发异步OCR处理
        try {
          const ocrResponse = await fetch('/api/ocr/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              bookId: result.id,
              fileUrl: uploadResult.file_url,
              fileType: uploadResult.file_type,
              imageUrls: uploadResult.image_urls, // 如果是图片类型
            }),
          });

          if (ocrResponse.ok) {
            console.log('OCR处理已启动');
          } else {
            console.warn('OCR处理启动失败，但不影响上传');
          }
        } catch (ocrError) {
          console.warn('OCR处理请求失败:', ocrError);
        }

        alert('上传成功！OCR文字识别正在后台处理...');
        router.push('/books');
      } else {
        const error = await bookResponse.json();
        console.error('创建书籍记录失败:', error, '响应状态:', bookResponse.status);
        alert(`创建书籍记录失败: ${error.error || '未知错误'}\n状态码: ${bookResponse.status}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('上传失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container px-4 py-8 mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">上传古籍</h1>
        <p className="text-gray-600">添加新的古籍到您的典藏</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>古籍信息</CardTitle>
          <CardDescription>
            请填写古籍的基本信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                书名 *
              </label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例如：论语"
              />
            </div>

            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
                作者 *
              </label>
              <Input
                id="author"
                required
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="例如：孔子"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dynasty" className="block text-sm font-medium text-gray-700 mb-1">
                  朝代 *
                </label>
                <select
                  id="dynasty"
                  required
                  value={formData.dynasty}
                  onChange={(e) => setFormData({ ...formData, dynasty: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择朝代</option>
                  {DYNASTIES.map((dynasty) => (
                    <option key={dynasty} value={dynasty}>
                      {dynasty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  分类 *
                </label>
                <select
                  id="category"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择分类</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                简介
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="简要描述这部古籍..."
                rows={4}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                封面图片 (可选)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  {coverPreview ? (
                    <div className="space-y-2">
                      <img
                        src={coverPreview}
                        alt="封面预览"
                        className="w-full h-48 object-cover rounded-md"
                      />
                      <p className="text-xs text-gray-500">已选择封面</p>
                    </div>
                  ) : (
                    <>
                      <UploadIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-1">
                        上传封面图片
                      </p>
                      <p className="text-xs text-gray-500">
                        支持 JPG、PNG 格式
                      </p>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="cover-upload"
                    onChange={handleCoverChange}
                  />
                  <label
                    htmlFor="cover-upload"
                    className="inline-block mt-3 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium cursor-pointer transition-colors"
                  >
                    {coverPreview ? '更换封面' : '选择封面'}
                  </label>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <p className="text-sm font-medium text-gray-700 mb-2">封面说明:</p>
                  <ul className="text-xs text-gray-600 space-y-1.5">
                    <li>• 如果不上传封面,系统会自动生成默认封面</li>
                    <li>• 默认封面会显示书名、作者和朝代</li>
                    <li>• 建议上传尺寸: 300×400 像素</li>
                    <li>• 自定义封面可让古籍更具辨识度</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                文件上传 *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  {selectedFile ? `已选择：${selectedFile.name}` : '点击上传或拖拽文件到此处'}
                </p>
                <p className="text-xs text-gray-500">
                  支持 PDF 或图片文件
                </p>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  id="file-upload"
                  onChange={handleFileChange}
                  required
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium cursor-pointer transition-colors"
                >
                  {selectedFile ? '重新选择文件' : '选择文件'}
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? '上传中...' : '上传古籍'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
