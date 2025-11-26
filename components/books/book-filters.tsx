'use client';

import { useEffect, useState } from 'react';
import { Category, Dynasty } from '@/types';
import { CATEGORIES, DYNASTIES, CATEGORY_DESCRIPTIONS } from '@/lib/constants';
import { BookOpen, Library } from 'lucide-react';

interface BookFiltersProps {
  selectedCategory?: Category;
  selectedDynasty?: Dynasty;
  onCategoryChange: (category?: Category) => void;
  onDynastyChange: (dynasty?: Dynasty) => void;
}

export function BookFilters({
  selectedCategory,
  selectedDynasty,
  onCategoryChange,
  onDynastyChange,
}: BookFiltersProps) {
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [dynastyCounts, setDynastyCounts] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const response = await fetch('/api/books');
      const books = await response.json();

      if (Array.isArray(books)) {
        setTotalCount(books.length);

        const catCounts: Record<string, number> = {};
        books.forEach((book) => {
          catCounts[book.category] = (catCounts[book.category] || 0) + 1;
        });
        setCategoryCounts(catCounts);

        const dynCounts: Record<string, number> = {};
        books.forEach((book) => {
          dynCounts[book.dynasty] = (dynCounts[book.dynasty] || 0) + 1;
        });
        setDynastyCounts(dynCounts);
      }
    } catch (error) {
      console.error('Failed to fetch counts:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border-2 border-amber-200">
        <div className="flex items-center gap-2 mb-4">
          <Library className="h-5 w-5 text-amber-700" />
          <h3 className="font-bold text-gray-900 text-lg">课程分类</h3>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => onCategoryChange(undefined)}
            className={`group block w-full text-left px-4 py-3 rounded-md text-sm transition-all ${
              !selectedCategory
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">全部古籍</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                !selectedCategory
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-600 group-hover:bg-amber-200'
              }`}>
                {totalCount}
              </span>
            </div>
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`group block w-full text-left px-4 py-3 rounded-md text-sm transition-all ${
                selectedCategory === category
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{category}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedCategory === category
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-amber-200'
                }`}>
                  {categoryCounts[category] || 0}
                </span>
              </div>
              <p className={`text-xs ${
                selectedCategory === category
                  ? 'text-amber-100'
                  : 'text-gray-500 group-hover:text-amber-700'
              }`}>
                {CATEGORY_DESCRIPTIONS[category]}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-amber-700" />
          <h3 className="font-bold text-gray-900 text-lg">朝代筛选</h3>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => onDynastyChange(undefined)}
            className={`group block w-full text-left px-4 py-2 rounded-md text-sm transition-all ${
              !selectedDynasty
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-amber-100 border border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">全部朝代</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                !selectedDynasty
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-600 group-hover:bg-amber-200'
              }`}>
                {totalCount}
              </span>
            </div>
          </button>
          {DYNASTIES.map((dynasty) => (
            <button
              key={dynasty}
              onClick={() => onDynastyChange(dynasty)}
              className={`group block w-full text-left px-4 py-2 rounded-md text-sm transition-all ${
                selectedDynasty === dynasty
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-amber-100 border border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{dynasty}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedDynasty === dynasty
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-amber-200'
                }`}>
                  {dynastyCounts[dynasty] || 0}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
