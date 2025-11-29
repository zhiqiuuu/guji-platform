import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// 六个标准类别
const VALID_CATEGORIES = ['经学', '史学', '掌故', '算学', '舆地', '词章'];

// 验证导入数据
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

function validateBookData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 必填字段验证
  if (!data.library_type || !['课题库', '课艺库'].includes(data.library_type)) {
    errors.push(`library_type必须是'课题库'或'课艺库'`);
  }

  if (!data.academy || typeof data.academy !== 'string' || data.academy.trim() === '') {
    errors.push('academy(书院)不能为空');
  }

  if (!data.year || typeof data.year !== 'string' || data.year.trim() === '') {
    errors.push('year(年份)不能为空');
  }

  if (!data.season || typeof data.season !== 'string' || data.season.trim() === '') {
    errors.push('season(季节)不能为空');
  }

  if (!data.category || !VALID_CATEGORIES.includes(data.category)) {
    errors.push(`category必须是以下之一: ${VALID_CATEGORIES.join('、')}`);
  }

  if (!data.subject || typeof data.subject !== 'string' || data.subject.trim() === '') {
    errors.push('subject(题目)不能为空');
  }

  // 课艺库特殊验证
  if (data.library_type === '课艺库' && data.has_full_text && !data.file_url) {
    errors.push('课艺库且has_full_text=true时必须提供file_url');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// 构建自定义层级结构
function buildCustomHierarchy(data: ImportBookData): Record<string, string> {
  const hierarchy: Record<string, string> = {
    level1: data.academy,
    level2: data.year,
    level3: data.season,
    level4: data.category,
  };

  // 课艺库添加第五级
  if (data.library_type === '课艺库') {
    hierarchy.level5 = data.subject;
  }

  return hierarchy;
}

// 生成标题
function generateTitle(data: ImportBookData): string {
  const parts = [
    data.academy,
    `${data.year}年`,
    data.season,
    data.category,
  ];

  if (data.subject) {
    parts.push(`- ${data.subject}`);
  }

  return parts.join(' ');
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    // 暂时注释掉权限检查,方便导入数据
    // // 验证用户身份
    // const {
    //   data: { user },
    //   error: authError,
    // } = await supabase.auth.getUser();

    // if (authError || !user) {
    //   return NextResponse.json({ error: '未授权' }, { status: 401 });
    // }

    // // 检查用户是否是管理员
    // const { data: profile } = await supabase
    //   .from('user_profiles')
    //   .select('role')
    //   .eq('id', user.id)
    //   .single();

    // if (!profile || profile.role !== 'admin') {
    //   return NextResponse.json({ error: '只有管理员可以导入数据' }, { status: 403 });
    // }

    // 解析请求体
    const { books, dryRun = false } = await request.json();

    if (!Array.isArray(books) || books.length === 0) {
      return NextResponse.json({ error: '请提供要导入的书籍数据数组' }, { status: 400 });
    }

    // 验证所有数据
    const validationResults = books.map((book, index) => ({
      index,
      data: book,
      validation: validateBookData(book),
    }));

    const invalidBooks = validationResults.filter((r) => !r.validation.valid);

    // 如果有验证失败的数据,返回错误
    if (invalidBooks.length > 0) {
      return NextResponse.json(
        {
          error: '数据验证失败',
          invalidBooks: invalidBooks.map((r) => ({
            index: r.index,
            data: r.data,
            errors: r.validation.errors,
          })),
        },
        { status: 400 }
      );
    }

    // 如果是预览模式,只返回验证结果
    if (dryRun) {
      return NextResponse.json({
        success: true,
        message: '数据验证通过',
        totalBooks: books.length,
        preview: books.slice(0, 5).map((book: ImportBookData) => ({
          ...book,
          title: generateTitle(book),
          custom_hierarchy: buildCustomHierarchy(book),
          has_full_text: book.library_type === '课艺库' && !!book.file_url,
        })),
      });
    }

    // 准备插入数据
    const booksToInsert = books.map((book: ImportBookData) => ({
      library_type: book.library_type,
      academy: book.academy.trim(),
      year: book.year.trim(),
      season: book.season.trim(),
      category: book.category,
      subject: book.subject.trim(),
      custom_hierarchy: buildCustomHierarchy(book),
      has_full_text: book.library_type === '课艺库' && !!book.file_url,
      title: generateTitle(book),
      author: book.author?.trim() || '未知',
      dynasty: book.dynasty?.trim() || '清',
      description: book.description?.trim() || null,
      file_url: book.file_url?.trim() || null,
      file_type: book.file_type?.trim() || null,
    }));

    // 批量插入数据
    const { data: insertedBooks, error: insertError } = await supabase
      .from('books')
      .insert(booksToInsert)
      .select();

    if (insertError) {
      console.error('导入失败:', insertError);
      return NextResponse.json(
        { error: '导入失败', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `成功导入 ${insertedBooks?.length || 0} 本书籍`,
      totalBooks: insertedBooks?.length || 0,
    });
  } catch (error: any) {
    console.error('导入错误:', error);
    return NextResponse.json(
      { error: '服务器错误', details: error.message },
      { status: 500 }
    );
  }
}
