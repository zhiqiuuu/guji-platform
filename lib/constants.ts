import type { Category, Dynasty } from '@/types';

export const CATEGORIES: Category[] = ['经学', '史学', '掌故', '算学', '舆地', '词章'];

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
  经学: '儒家经典及经学研究成果',
  史学: '历史研究及史学理论',
  掌故: '典章制度及历史掌故',
  算学: '数学计算及天文历法',
  舆地: '地理沿革及山川地貌',
  词章: '诗词文章及文学创作',
};
