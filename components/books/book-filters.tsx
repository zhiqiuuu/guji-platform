'use client';

import { useEffect, useState } from 'react';
import { Category, Dynasty } from '@/types';
import {
  CATEGORIES,
  DYNASTIES,
  CATEGORY_DESCRIPTIONS,
  ACADEMIES,
  SEASONS,
  LIBRARY_TYPES,
  YEAR_RANGE,
  Academy,
  Season,
  LibraryType,
} from '@/lib/constants';
import { BookOpen, Library, Calendar, Leaf, Building2 } from 'lucide-react';

interface BookFiltersProps {
  selectedCategory?: Category;
  selectedDynasty?: Dynasty;
  selectedAcademy?: Academy;
  selectedYear?: string;
  selectedSeason?: Season;
  selectedLibraryType?: LibraryType;
  onCategoryChange: (category?: Category) => void;
  onDynastyChange: (dynasty?: Dynasty) => void;
  onAcademyChange: (academy?: Academy) => void;
  onYearChange: (year?: string) => void;
  onSeasonChange: (season?: Season) => void;
  onLibraryTypeChange: (type?: LibraryType) => void;
}

export function BookFilters({
  selectedCategory,
  selectedDynasty,
  selectedAcademy,
  selectedYear,
  selectedSeason,
  selectedLibraryType,
  onCategoryChange,
  onDynastyChange,
  onAcademyChange,
  onYearChange,
  onSeasonChange,
  onLibraryTypeChange,
}: BookFiltersProps) {
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [dynastyCounts, setDynastyCounts] = useState<Record<string, number>>({});
  const [academyCounts, setAcademyCounts] = useState<Record<string, number>>({});
  const [yearCounts, setYearCounts] = useState<Record<string, number>>({});
  const [seasonCounts, setSeasonCounts] = useState<Record<string, number>>({});
  const [libraryTypeCounts, setLibraryTypeCounts] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const response = await fetch('/api/books');
      const books = await response.json();

      if (Array.isArray(books)) {
        setTotalCount(books.length);

        // 统计分类
        const catCounts: Record<string, number> = {};
        books.forEach((book) => {
          catCounts[book.category] = (catCounts[book.category] || 0) + 1;
        });
        setCategoryCounts(catCounts);

        // 统计朝代
        const dynCounts: Record<string, number> = {};
        books.forEach((book) => {
          dynCounts[book.dynasty] = (dynCounts[book.dynasty] || 0) + 1;
        });
        setDynastyCounts(dynCounts);

        // 统计书院
        const acadCounts: Record<string, number> = {};
        books.forEach((book) => {
          if (book.academy) {
            acadCounts[book.academy] = (acadCounts[book.academy] || 0) + 1;
          }
        });
        setAcademyCounts(acadCounts);

        // 统计年份
        const yrCounts: Record<string, number> = {};
        const years = new Set<string>();
        books.forEach((book) => {
          if (book.year) {
            yrCounts[book.year] = (yrCounts[book.year] || 0) + 1;
            years.add(book.year);
          }
        });
        setYearCounts(yrCounts);
        setAvailableYears(Array.from(years).sort());

        // 统计季节
        const seasCounts: Record<string, number> = {};
        books.forEach((book) => {
          if (book.season) {
            seasCounts[book.season] = (seasCounts[book.season] || 0) + 1;
          }
        });
        setSeasonCounts(seasCounts);

        // 统计书库类型
        const libCounts: Record<string, number> = {};
        books.forEach((book) => {
          if (book.library_type) {
            libCounts[book.library_type] = (libCounts[book.library_type] || 0) + 1;
          }
        });
        setLibraryTypeCounts(libCounts);
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

      {/* 书库类型筛选 */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border-2 border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <Library className="h-5 w-5 text-blue-700" />
          <h3 className="font-bold text-gray-900 text-lg">书库类型</h3>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => onLibraryTypeChange(undefined)}
            className={`group block w-full text-left px-4 py-2 rounded-md text-sm transition-all ${
              !selectedLibraryType
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">全部类型</span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  !selectedLibraryType
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-blue-200'
                }`}
              >
                {totalCount}
              </span>
            </div>
          </button>
          {LIBRARY_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onLibraryTypeChange(type)}
              className={`group block w-full text-left px-4 py-2 rounded-md text-sm transition-all ${
                selectedLibraryType === type
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{type}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    selectedLibraryType === type
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-blue-200'
                  }`}
                >
                  {libraryTypeCounts[type] || 0}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 书院筛选 */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-purple-700" />
          <h3 className="font-bold text-gray-900 text-lg">书院</h3>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => onAcademyChange(undefined)}
            className={`group block w-full text-left px-4 py-2 rounded-md text-sm transition-all ${
              !selectedAcademy
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">全部书院</span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  !selectedAcademy
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-purple-200'
                }`}
              >
                {totalCount}
              </span>
            </div>
          </button>
          {ACADEMIES.map((academy) => (
            <button
              key={academy}
              onClick={() => onAcademyChange(academy)}
              className={`group block w-full text-left px-4 py-2 rounded-md text-sm transition-all ${
                selectedAcademy === academy
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{academy}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    selectedAcademy === academy
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-purple-200'
                  }`}
                >
                  {academyCounts[academy] || 0}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 季节筛选 */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
        <div className="flex items-center gap-2 mb-4">
          <Leaf className="h-5 w-5 text-green-700" />
          <h3 className="font-bold text-gray-900 text-lg">季节</h3>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => onSeasonChange(undefined)}
            className={`group block w-full text-left px-4 py-2 rounded-md text-sm transition-all ${
              !selectedSeason
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-green-100 border border-green-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">全部季节</span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  !selectedSeason
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-green-200'
                }`}
              >
                {totalCount}
              </span>
            </div>
          </button>
          {SEASONS.map((season) => (
            <button
              key={season}
              onClick={() => onSeasonChange(season)}
              className={`group block w-full text-left px-4 py-2 rounded-md text-sm transition-all ${
                selectedSeason === season
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-green-100 border border-green-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{season}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    selectedSeason === season
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-green-200'
                  }`}
                >
                  {seasonCounts[season] || 0}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 年份筛选 */}
      <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-lg p-4 border-2 border-rose-200">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-rose-700" />
          <h3 className="font-bold text-gray-900 text-lg">年份</h3>
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          <button
            onClick={() => onYearChange(undefined)}
            className={`group block w-full text-left px-4 py-2 rounded-md text-sm transition-all sticky top-0 z-10 ${
              !selectedYear
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">全部年份</span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  !selectedYear
                    ? 'bg-rose-500 text-white'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-rose-200'
                }`}
              >
                {totalCount}
              </span>
            </div>
          </button>
          {availableYears.map((year) => (
            <button
              key={year}
              onClick={() => onYearChange(year)}
              className={`group block w-full text-left px-4 py-2 rounded-md text-sm transition-all ${
                selectedYear === year
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{year}年</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    selectedYear === year
                      ? 'bg-rose-500 text-white'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-rose-200'
                  }`}
                >
                  {yearCounts[year] || 0}
                </span>
              </div>
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
