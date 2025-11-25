import Link from 'next/link';
import { Book as BookType } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { BookCover } from './book-cover';

interface BookCardProps {
  book: BookType;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Card className="h-full hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col overflow-hidden rounded-none border-0 shadow-lg">
      {/* 封面区域 */}
      <Link href={`/books/${book.id}`} className="block">
        <div className="w-full aspect-[3/4] relative overflow-hidden bg-gray-100">
          <BookCover book={book} width={300} height={400} className="w-full h-full object-cover" />
        </div>
      </Link>

      {/* 信息区域 */}
      <CardContent className="flex-1 flex flex-col p-4">
        <div className="flex-1 space-y-2">
          <Link href={`/books/${book.id}`} className="block">
            <h3 className="font-bold text-lg line-clamp-2 hover:text-amber-600 transition-colors">
              {book.title}
            </h3>
          </Link>
          <p className="text-sm text-gray-600">
            {book.author} · {book.dynasty}
          </p>
          {book.description && (
            <p className="text-sm text-gray-500 line-clamp-2">
              {book.description}
            </p>
          )}
        </div>

        <div className="mt-4">
          <Link href={`/books/${book.id}`}>
            <Button className="w-full bg-amber-600 hover:bg-amber-700" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              在线阅读
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
