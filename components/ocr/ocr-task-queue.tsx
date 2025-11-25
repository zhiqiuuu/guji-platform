'use client';

import { useOCRTasks } from '@/contexts/ocr-task-context';
import { OCRTaskCard } from './ocr-task-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function OCRTaskQueue() {
  const { tasks } = useOCRTasks();

  const activeTasks = tasks.filter(
    (t) => t.status === 'processing' || t.status === 'paused' || t.status === 'pending'
  );

  const completedTasks = tasks.filter(
    (t) => t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled'
  );

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>OCR任务队列</CardTitle>
          <CardDescription>当前没有正在进行的OCR任务</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">
            暂无任务
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 正在进行的任务 */}
      {activeTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900">
              正在进行的任务 ({activeTasks.length})
            </h2>
          </div>
          <div className="space-y-4">
            {activeTasks.map((task) => (
              <OCRTaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* 已完成的任务 */}
      {completedTasks.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            已完成的任务 ({completedTasks.length})
          </h2>
          <div className="space-y-4">
            {completedTasks.map((task) => (
              <OCRTaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
