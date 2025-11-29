'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Library, Hash, Loader2 } from 'lucide-react';
import { LibraryType } from '@/types';
import { cn } from '@/lib/utils';

interface HierarchyNode {
  id: string;
  label: string;
  value: string;
  level: number;
  count?: number;
  children?: HierarchyNode[];
  libraryType?: LibraryType;
}

interface HierarchyNavigationProps {
  selectedFilters: {
    libraryType?: LibraryType;
    academy?: string;
    year?: string;
    season?: string;
    category?: string;
    subject?: string;
  };
  onFilterChange: (filters: HierarchyNavigationProps['selectedFilters']) => void;
}

export function HierarchyNavigation({
  selectedFilters,
  onFilterChange,
}: HierarchyNavigationProps) {
  const [hierarchy, setHierarchy] = useState<HierarchyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [cache, setCache] = useState<Map<string, HierarchyNode[]>>(new Map());
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());

  // 初始加载顶级层级
  useEffect(() => {
    const loadHierarchy = async () => {
      const data = await fetchHierarchy();
      // 保持嵌套结构，但书院节点预设可展开
      setHierarchy(data);

      // 预展开所有顶级节点（课题库、课艺库）
      const topLevelIds = data.map(node => node.id);
      setExpandedNodes(new Set(topLevelIds));

      setLoading(false);
    };
    loadHierarchy();
  }, []);

  // 自动展开已选择的层级 - 只添加节点ID，不移除已存在的
  useEffect(() => {
    const path = new Set(expandedNodes); // 从当前展开的节点开始

    // 查找书院节点ID（需要递归查找嵌套的children）
    if (selectedFilters.academy) {
      const findAcademyNode = (nodes: HierarchyNode[]): HierarchyNode | undefined => {
        for (const node of nodes) {
          if (node.value === selectedFilters.academy &&
              (node.id.startsWith('practice-academy-') || node.id.startsWith('topic-academy-'))) {
            return node;
          }
          if (node.children) {
            const found = findAcademyNode(node.children);
            if (found) return found;
          }
        }
        return undefined;
      };
      const academyNode = findAcademyNode(hierarchy);
      if (academyNode) path.add(academyNode.id);
    }

    // 添加其他层级的节点ID
    if (selectedFilters.year) path.add(`year-${selectedFilters.year}`);
    if (selectedFilters.season) path.add(`season-${selectedFilters.season}`);
    if (selectedFilters.category) path.add(`category-${selectedFilters.category}`);

    // 始终包含顶级节点（课题库、课艺库）
    if (hierarchy.length > 0) {
      hierarchy.forEach(node => path.add(node.id));
    }

    setExpandedNodes(path);
  }, [selectedFilters, hierarchy]);

  const fetchHierarchy = async (params?: Record<string, string>) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const cacheKey = queryString || 'root';

    // 检查缓存
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    try {
      const response = await fetch(`/api/books/hierarchy${queryString}`);
      const data = await response.json();

      // 更新缓存
      setCache(prev => new Map(prev).set(cacheKey, data));
      return data;
    } catch (error) {
      console.error('Failed to fetch hierarchy:', error);
      return [];
    }
  };

  const toggleNode = async (nodeId: string, node: HierarchyNode) => {
    const isExpanded = expandedNodes.has(nodeId);

    if (isExpanded) {
      // 如果节点已展开，则直接收起
      setExpandedNodes(prev => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
      return;
    }

    // 如果已经有children,直接展开不需要加载
    if (node.children && node.children.length > 0) {
      setExpandedNodes(prev => new Set(prev).add(nodeId));
      return;
    }

    // 标记节点为加载中
    setLoadingNodes(prev => new Set(prev).add(nodeId));

    try {
      // 如果节点未展开，需要加载子节点并展开
      let children: HierarchyNode[] = [];

      if (node.level === 2) {
        // 点击书院时，获取年份数据
        const libraryType = selectedFilters.libraryType || node.libraryType;
        const params: Record<string, string> = { academy: node.value };
        if (libraryType) params.library_type = libraryType;
        children = await fetchHierarchy(params);
      } else if (node.level === 3) {
        // 点击年份时，获取季节数据
        const academy = selectedFilters.academy || getNodeAcademy(node) || '';
        const libraryType = selectedFilters.libraryType;
        const params: Record<string, string> = { academy, year: node.value };
        if (libraryType) params.library_type = libraryType;
        children = await fetchHierarchy(params);
      } else if (node.level === 4) {
        // 点击季节时，获取类别数据
        const academy = selectedFilters.academy || getNodeAcademy(node) || '';
        const year = selectedFilters.year || getNodeYear(node) || '';
        const libraryType = selectedFilters.libraryType;
        const params: Record<string, string> = { academy, year, season: node.value };
        if (libraryType) params.library_type = libraryType;
        children = await fetchHierarchy(params);
      } else if (node.level === 5) {
        // 点击类别时，获取题目数据
        const academy = selectedFilters.academy || getNodeAcademy(node) || '';
        const year = selectedFilters.year || getNodeYear(node) || '';
        const season = selectedFilters.season || getNodeSeason(node) || '';
        const libraryType = selectedFilters.libraryType;
        const params: Record<string, string> = { academy, year, season, category: node.value };
        if (libraryType) params.library_type = libraryType;
        children = await fetchHierarchy(params);
      }

      // 更新层级结构
      const updatedNode = { ...node, children };
      updateNodeInHierarchy(nodeId, updatedNode);

      // 展开当前节点(不自动展开子节点,避免卡顿)
      setExpandedNodes(prev => new Set(prev).add(nodeId));
    } finally {
      // 移除加载状态
      setLoadingNodes(prev => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
    }
  };

  const updateNodeInHierarchy = (nodeId: string, updatedNode: HierarchyNode): void => {
    const update = (nodes: HierarchyNode[]): HierarchyNode[] => {
      return nodes.map(n => {
        if (n.id === nodeId) {
          return updatedNode;
        }
        if (n.children && n.children.length > 0) {
          return { ...n, children: update(n.children) };
        }
        return n;
      });
    };

    setHierarchy(update(hierarchy));
  };

  const handleNodeClick = (node: HierarchyNode) => {
    const filters: HierarchyNavigationProps['selectedFilters'] = {};

    // 根据节点层级构建过滤器
    if (node.level === 1) {
      // 点击课题库或课艺库时，只设置书库类型
      filters.libraryType = node.libraryType;
    } else if (node.level === 2) {
      // 点击书院时，设置书库类型和书院
      filters.libraryType = selectedFilters.libraryType || node.libraryType;
      filters.academy = node.value;
    } else if (node.level === 3) {
      // 点击年份时，设置书库类型、书院、年份
      filters.libraryType = selectedFilters.libraryType;
      filters.academy = selectedFilters.academy || getNodeAcademy(node);
      filters.year = node.value;
    } else if (node.level === 4) {
      // 点击季节时，设置书库类型、书院、年份、季节
      filters.libraryType = selectedFilters.libraryType;
      filters.academy = selectedFilters.academy || getNodeAcademy(node);
      filters.year = selectedFilters.year || getNodeYear(node);
      filters.season = node.value;
    } else if (node.level === 5) {
      // 点击类别时，设置完整的层级链
      filters.libraryType = selectedFilters.libraryType;
      filters.academy = selectedFilters.academy || getNodeAcademy(node);
      filters.year = selectedFilters.year || getNodeYear(node);
      filters.season = selectedFilters.season || getNodeSeason(node);
      filters.category = node.value;
    } else if (node.level === 6) {
      // 点击题目时，设置完整的层级链
      filters.libraryType = selectedFilters.libraryType;
      filters.academy = selectedFilters.academy || getNodeAcademy(node);
      filters.year = selectedFilters.year || getNodeYear(node);
      filters.season = selectedFilters.season || getNodeSeason(node);
      filters.category = selectedFilters.category || getParentNodeValue(node, 5);
      filters.subject = node.value;
    }

    onFilterChange(filters);
  };

  // 从节点路径中推断上级节点信息
  const getParentNodeValue = (node: HierarchyNode, targetLevel: number): string | undefined => {
    // 递归查找指定层级的父节点
    const findParentByLevel = (nodes: HierarchyNode[], targetId: string, targetLevel: number, path: HierarchyNode[] = []): HierarchyNode | null => {
      for (const n of nodes) {
        const currentPath = [...path, n];

        // 如果当前节点的子节点中包含目标节点
        if (n.children && n.children.length > 0) {
          for (const child of n.children) {
            if (child.id === targetId) {
              // 如果找到的是书院节点（level 2）
              if (n.level === targetLevel) {
                return n;
              }

              // 否则继续向上查找
              const found = findParentByLevel(hierarchy, n.id, targetLevel, currentPath);
              if (found) return found;
            }

            // 递归搜索更深层级的节点
            if (child.children && child.children.length > 0) {
              const found = findParentByLevel([child], targetId, targetLevel, currentPath);
              if (found) return found;
            }
          }
        }
      }
      return null;
    };

    // 从根层级开始搜索
    const parentNode = findParentByLevel(hierarchy, node.id, targetLevel);
    return parentNode?.value;
  };

  // 从节点路径中推断书院名称
  const getNodeAcademy = (node: HierarchyNode): string | undefined => {
    return getParentNodeValue(node, 2);
  };

  // 从节点路径中推断年份
  const getNodeYear = (node: HierarchyNode): string | undefined => {
    return getParentNodeValue(node, 3);
  };

  // 从节点路径中推断季节
  const getNodeSeason = (node: HierarchyNode): string | undefined => {
    return getParentNodeValue(node, 4);
  };

  const renderNode = (node: HierarchyNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = getNodeSelection(node);
    const hasChildren = node.children && node.children.length > 0;
    const canExpand = node.level <= 5; // 层级<=5的节点都可以展开
    const isLoading = loadingNodes.has(node.id);

    // 根据层级确定样式
    const getNodeStyles = () => {
      if (node.level === 1) {
        // 顶级库类型节点 - 大标题样式
        return {
          container: 'mb-2',
          button: cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all group',
            'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200',
            'hover:from-amber-100 hover:to-orange-100 hover:border-amber-300 hover:shadow-sm',
            isSelected && 'from-amber-100 to-orange-100 border-amber-400 shadow-md'
          ),
          text: cn(
            'font-semibold text-base',
            isSelected ? 'text-amber-900' : 'text-amber-800'
          ),
          icon: 'text-amber-600 group-hover:text-amber-700',
          badge: 'bg-amber-200 text-amber-900 font-medium'
        };
      } else if (node.level === 2) {
        // 书院节点 - 次级标题样式
        return {
          container: 'mb-1',
          button: cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all',
            'hover:bg-amber-50 hover:shadow-sm',
            isSelected && 'bg-amber-100 shadow-sm ring-1 ring-amber-300'
          ),
          text: cn(
            'font-medium text-sm',
            isSelected ? 'text-amber-900' : 'text-gray-700'
          ),
          icon: 'text-amber-500',
          badge: 'bg-amber-100 text-amber-800'
        };
      } else {
        // 其他层级节点 - 普通样式
        return {
          container: '',
          button: cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors',
            'hover:bg-gray-50',
            isSelected && 'bg-amber-50 text-amber-900'
          ),
          text: cn(
            'text-sm',
            isSelected ? 'text-amber-900 font-medium' : 'text-gray-600'
          ),
          icon: isSelected ? 'text-amber-600' : 'text-gray-400',
          badge: isSelected ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
        };
      }
    };

    const styles = getNodeStyles();

    return (
      <div key={node.id} className={cn('select-none', styles.container)}>
        <div
          className={styles.button}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => {
            handleNodeClick(node);
          }}
        >
          {canExpand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id, node);
              }}
              disabled={isLoading}
              className={cn(
                'p-1 rounded-md transition-colors',
                node.level === 1
                  ? 'hover:bg-amber-200'
                  : 'hover:bg-gray-200',
                isLoading && 'opacity-50 cursor-wait'
              )}
            >
              {isLoading ? (
                <Loader2 className={cn('h-4 w-4 animate-spin', styles.icon)} />
              ) : isExpanded ? (
                <ChevronDown className={cn('h-4 w-4', styles.icon)} />
              ) : (
                <ChevronRight className={cn('h-4 w-4', styles.icon)} />
              )}
            </button>
          )}

          {!canExpand && node.level > 0 && (
            <div className="w-5 h-5 flex items-center justify-center">
              {node.level <= 2 ? (
                <Library className={cn('h-4 w-4', styles.icon)} />
              ) : node.level <= 4 ? (
                <BookOpen className={cn('h-4 w-4', styles.icon)} />
              ) : (
                <Hash className={cn('h-4 w-4', styles.icon)} />
              )}
            </div>
          )}

          <span className={cn('flex-1 truncate', styles.text)}>{node.label}</span>

          {node.count !== undefined && (
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium transition-colors',
              styles.badge
            )}>
              {node.count}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className={node.level === 1 ? 'mt-1 space-y-0.5' : 'space-y-0.5'}>
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const getNodeSelection = (node: HierarchyNode): boolean => {
    if (node.level === 1 && node.libraryType === selectedFilters.libraryType) return true;
    if (node.level === 2 && node.value === selectedFilters.academy) return true;
    if (node.level === 3 && node.value === selectedFilters.year) return true;
    if (node.level === 4 && node.value === selectedFilters.season) return true;
    if (node.level === 5 && node.value === selectedFilters.category) return true;
    if (node.level === 6 && node.value === selectedFilters.subject) return true;
    return false;
  };

  if (loading) {
    return (
      <div className="space-y-3 p-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-10 bg-gradient-to-r from-gray-100 to-gray-50 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-4 pr-2 hierarchy-scrollbar" style={{ scrollBehavior: 'smooth' }}>
      <div className="space-y-2 p-3">
        {hierarchy.map((node) => renderNode(node))}
      </div>
    </div>
  );
}
