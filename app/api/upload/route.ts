import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// 配置最大文件大小 (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// POST: 上传文件
export async function POST(request: NextRequest) {
  try {
    console.log('开始处理文件上传请求');

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('上传失败: 没有文件');
      return NextResponse.json({ error: '没有文件' }, { status: 400 });
    }

    console.log('接收到文件:', {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      console.error('上传失败: 文件过大', { size: file.size, maxSize: MAX_FILE_SIZE });
      return NextResponse.json(
        { error: `文件太大,最大支持 ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // 检查文件类型
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    // 支持通过文件扩展名和MIME type判断
    const isPdf = fileType === 'application/pdf' || fileName.endsWith('.pdf');
    const isImage = fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/.test(fileName);
    const isValidType = isPdf || isImage;

    if (!isValidType) {
      console.error('上传失败: 不支持的文件类型', { fileType, fileName });
      return NextResponse.json(
        { error: `只支持 PDF 和图片文件,当前文件类型: ${fileType}` },
        { status: 400 }
      );
    }

    // 创建上传目录
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      console.log('创建上传目录:', uploadsDir);
      await mkdir(uploadsDir, { recursive: true });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const originalName = file.name;
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    const safeFileName = `${nameWithoutExt}-${timestamp}${ext}`;

    console.log('保存文件:', safeFileName);

    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadsDir, safeFileName);

    await writeFile(filePath, buffer);
    console.log('文件保存成功:', filePath);

    // 返回文件 URL
    const fileUrl = `/uploads/${safeFileName}`;
    const fileTypeResult = isPdf ? 'pdf' : 'images';

    const result = {
      file_url: fileUrl,
      file_type: fileTypeResult,
      original_name: originalName,
    };

    console.log('上传成功:', result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: '文件上传失败',
        details: error.message || '未知错误',
      },
      { status: 500 }
    );
  }
}

// 配置route segment以支持大文件上传
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};
