import type { Category, Dynasty } from '@/types';

export const CATEGORIES: Category[] = ['经部', '史部', '子部', '集部', '其他'];

export const DYNASTIES: Dynasty[] = [
  '先秦',
  '秦汉',
  '魏晋南北朝',
  '隋唐',
  '宋元',
  '明清',
  '近现代',
  '未知',
];

export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  经部: '儒家经典及其注疏',
  史部: '历史典籍、纪传体史书',
  子部: '诸子百家、术数方技',
  集部: '诗词文集、总集别集',
  其他: '未分类古籍',
};
