import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 获取书籍的段落数据,按页码分组
    const { data: paragraphs, error } = await supabase
      .from('book_paragraphs')
      .select('page_number, paragraph_index, content')
      .eq('book_id', id)
      .order('page_number', { ascending: true })
      .order('paragraph_index', { ascending: true });

    if (error) {
      console.error('Error fetching paragraphs:', error);
      return NextResponse.json({ chapters: [] });
    }

    if (!paragraphs || paragraphs.length === 0) {
      return NextResponse.json({ chapters: [] });
    }

    // 按页码分组生成章节
    const pageMap = new Map<number, any[]>();
    paragraphs.forEach(p => {
      if (!pageMap.has(p.page_number)) {
        pageMap.set(p.page_number, []);
      }
      pageMap.get(p.page_number)!.push(p);
    });

    // 生成章节结构
    const chapters = [];
    const pages = Array.from(pageMap.keys()).sort((a, b) => a - b);

    // 每10页作为一个章节
    for (let i = 0; i < pages.length; i += 10) {
      const startPage = pages[i];
      const endPage = pages[Math.min(i + 9, pages.length - 1)];

      chapters.push({
        id: `chapter-${i / 10 + 1}`,
        title: `第 ${Math.floor(i / 10) + 1} 章`,
        page_start: startPage,
        page_end: endPage,
        children: pages.slice(i, Math.min(i + 10, pages.length)).map(pageNum => {
          const pageParas = pageMap.get(pageNum) || [];
          // 使用第一个段落的内容作为标题(取前20字)
          const title = pageParas[0]?.content?.slice(0, 20) || `第 ${pageNum} 页`;

          return {
            id: `page-${pageNum}`,
            title: title + (pageParas[0]?.content?.length > 20 ? '...' : ''),
            page_start: pageNum,
            page_end: pageNum,
          };
        }),
      });
    }

    return NextResponse.json({ chapters });
  } catch (error) {
    console.error('Error in chapters API:', error);
    return NextResponse.json(
      { error: '获取章节失败' },
      { status: 500 }
    );
  }
}
