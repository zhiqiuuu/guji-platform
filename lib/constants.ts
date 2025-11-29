import type { Category, Dynasty } from '@/types';

export const CATEGORIES: Category[] = ['经学', '史学', '掌故', '算学', '舆地', '词章', '性理'];

export const DYNASTIES: Dynasty[] = [
  '先秦',
  '秦汉',
  '魏晋南北朝',
  '隋唐',
  '宋元',
  '明清',
  '近现代',
  '清',
  '未知',
];

export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  经学: '儒家经典及经学研究成果',
  史学: '历史研究及史学理论',
  掌故: '典章制度及历史掌故',
  算学: '数学计算及天文历法',
  舆地: '地理沿革及山川地貌',
  词章: '诗词文章及文学创作',
  性理: '性理之学及理学研究',
};

// 求志书院相关常量
export const ACADEMIES = ['求志书院'] as const;
export type Academy = typeof ACADEMIES[number];

export const SEASONS = ['春', '夏', '秋', '冬'] as const;
export type Season = typeof SEASONS[number];

export const LIBRARY_TYPES = ['课题库', '课艺库'] as const;
export type LibraryType = typeof LIBRARY_TYPES[number];

// 年份范围 (1876-1904)
export const YEAR_RANGE = {
  min: 1876,
  max: 1904,
} as const;
