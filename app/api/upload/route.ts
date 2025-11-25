import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// POST: 上传文件
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '没有文件' }, { status: 400 });
    }

    // 检查文件类型
    const fileType = file.type;
    const isValidType = fileType === 'application/pdf' || fileType.startsWith('image/');

    if (!isValidType) {
      return NextResponse.json({ error: '只支持 PDF 和图片文件' }, { status: 400 });
    }

    // 创建上传目录
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const originalName = file.name;
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    const safeFileName = `${nameWithoutExt}-${timestamp}${ext}`;

    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadsDir, safeFileName);

    await writeFile(filePath, buffer);

    // 返回文件 URL
    const fileUrl = `/uploads/${safeFileName}`;
    const fileTypeResult = fileType === 'application/pdf' ? 'pdf' : 'images';

    return NextResponse.json({
      file_url: fileUrl,
      file_type: fileTypeResult,
      original_name: originalName
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: '文件上传失败' }, { status: 500 });
  }
}
