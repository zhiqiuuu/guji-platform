'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Library, Hash } from 'lucide-react';
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
    console.log('[toggleNode] 节点ID:', nodeId, '层级:', node.level, '是否展开:', isExpanded, '当前筛选器:', selectedFilters);

    if (isExpanded) {
      // 如果节点已展开，则直接收起
      setExpandedNodes(prev => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
      return;
    }

    // 如果节点未展开，需要加载子节点并展开
    let children: HierarchyNode[] = [];

    if (node.level === 2) {
      // 点击书院时，获取年份数据
      children = await fetchHierarchy({ academy: node.value });
      console.log('[toggleNode] 书院节点获取到年份数据:', children.length, '个');
    } else if (node.level === 3) {
      // 点击年份时，获取季节数据
      const academy = selectedFilters.academy || getNodeAcademy(node) || '';
      children = await fetchHierarchy({
        academy,
        year: node.value
      });
      console.log('[toggleNode] 年份节点获取到季节数据:', children.length, '个', children);
    } else if (node.level === 4) {
      // 点击季节时，获取类别数据
      const academy = selectedFilters.academy || getNodeAcademy(node) || '';
      const year = selectedFilters.year || getNodeYear(node) || '';
      console.log('[toggleNode] 季节节点参数 - academy:', academy, 'year:', year, 'season:', node.value);

      children = await fetchHierarchy({
        academy,
        year,
        season: node.value
      });
      console.log('[toggleNode] 季节节点获取到类别数据:', children.length, '个', children);
    } else if (node.level === 5) {
      // 点击类别时，获取题目数据
      const academy = selectedFilters.academy || getNodeAcademy(node) || '';
      const year = selectedFilters.year || getNodeYear(node) || '';
      const season = selectedFilters.season || getNodeSeason(node) || '';

      console.log('[toggleNode] 类别节点参数 - academy:', academy, 'year:', year, 'season:', season, 'category:', node.value);

      children = await fetchHierarchy({
        academy,
        year,
        season,
        category: node.value
      });
      console.log('[toggleNode] 类别节点获取到题目数据:', children.length, '个', children);
    } else {
      // 节点已经有 children，只是展开
      children = node.children || [];
    }

    // 更新层级结构
    const updatedNode = { ...node, children };
    console.log('[toggleNode] 更新节点:', nodeId, 'children数量:', children.length);
    updateNodeInHierarchy(nodeId, updatedNode);

    // 展开当前节点和所有子节点
    setExpandedNodes(prev => {
      const next = new Set(prev);
      next.add(nodeId);
      // 自动展开所有子节点
      children.forEach(child => next.add(child.id));
      console.log('[toggleNode] 展开节点:', nodeId, '子节点:', children.map(c => c.id));
      return next;
    });
  };

  const updateNodeInHierarchy = (nodeId: string, updatedNode: HierarchyNode): HierarchyNode[] => {
    console.log('[updateNodeInHierarchy] 查找并更新节点:', nodeId);
    const update = (nodes: HierarchyNode[]): HierarchyNode[] => {
      return nodes.map(n => {
        console.log('[updateNodeInHierarchy] 检查节点:', n.id, 'level:', n.level);
        if (n.id === nodeId) {
          console.log('[updateNodeInHierarchy] 找到节点，更新children数量:', updatedNode.children?.length);
          return updatedNode;
        }
        if (n.children && n.children.length > 0) {
          const updatedChildren = update(n.children);
          return { ...n, children: updatedChildren };
        }
        return n;
      });
    };

    const newHierarchy = update(hierarchy);
    setHierarchy(newHierarchy);
    console.log('[updateNodeInHierarchy] 层级结构已更新');
    return newHierarchy;
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

    console.log('[handleNodeClick] 点击节点:', node.level, node.label, '筛选器:', filters);
    onFilterChange(filters);
  };

  // 从节点路径中推断上级节点信息
  const getParentNodeValue = (node: HierarchyNode, targetLevel: number): string | undefined => {
    console.log('[getParentNodeValue] 查找节点:', node.id, '目标层级:', targetLevel);

    // 递归查找指定层级的父节点
    const findParentByLevel = (nodes: HierarchyNode[], targetId: string, targetLevel: number, path: HierarchyNode[] = []): HierarchyNode | null => {
      console.log('[getParentNodeValue] 搜索路径长度:', path.length, '当前搜索目标:', targetId);

      for (const n of nodes) {
        const currentPath = [...path, n];
        console.log('[getParentNodeValue] 检查节点:', n.id, '值:', n.value, '层级:', n.level);

        // 如果当前节点的子节点中包含目标节点
        if (n.children && n.children.length > 0) {
          for (const child of n.children) {
            console.log('[getParentNodeValue] 检查子节点:', child.id);

            if (child.id === targetId) {
              console.log('[getParentNodeValue] 找到父节点:', n.id, '值:', n.value, '层级:', n.level, '目标层级:', targetLevel);

              // 如果找到的是书院节点（level 2）
              if (n.level === targetLevel) {
                console.log('[getParentNodeValue] 返回节点:', n.value);
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
    const value = parentNode?.value;

    console.log('[getParentNodeValue] 最终结果:', value, 'for level', targetLevel);
    return value;
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

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm transition-all',
            'hover:bg-amber-50',
            isSelected
              ? 'bg-amber-100 text-amber-900 font-medium'
              : 'text-gray-700'
          )}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
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
              className="p-0.5 hover:bg-amber-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}

          {!canExpand && node.level > 0 && (
            <div className="w-4 h-4 flex items-center justify-center">
              {node.level <= 2 ? (
                <Library className="h-3 w-3 text-amber-600" />
              ) : node.level <= 4 ? (
                <BookOpen className="h-3 w-3 text-amber-500" />
              ) : (
                <Hash className="h-3 w-3 text-amber-400" />
              )}
            </div>
          )}

          <span className="flex-1 truncate">{node.label}</span>

          {node.count !== undefined && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {node.count}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
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
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-8 bg-gray-100 animate-pulse rounded-md"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-4 pr-2" style={{ scrollBehavior: 'smooth' }}>
      <div className="space-y-1">
        {hierarchy.map((node) => renderNode(node))}
      </div>
    </div>
  );
}
