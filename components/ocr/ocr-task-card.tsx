'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { OCRTask, useOCRTasks } from '@/contexts/ocr-task-context';
import { Pause, Play, X, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface OCRTaskCardProps {
  task: OCRTask;
}

export function OCRTaskCard({ task }: OCRTaskCardProps) {
  const { pauseTask, resumeTask, cancelTask, removeTask } = useOCRTasks();

  const getStatusColor = () => {
    switch (task.status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
      case 'cancelled':
        return 'bg-red-50 border-red-200';
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      case 'paused':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'cancelled':
        return <X className="h-5 w-5 text-gray-600" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'paused':
        return <Pause className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = () => {
    switch (task.status) {
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      case 'cancelled':
        return '已取消';
      case 'processing':
        return '处理中';
      case 'paused':
        return '已暂停';
      default:
        return '等待中';
    }
  };

  const getElapsedTime = () => {
    if (!task.startTime) return null;

    const endTime = task.endTime || Date.now();
    const elapsed = endTime - task.startTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  const handlePauseResume = () => {
    if (task.status === 'processing') {
      pauseTask(task.id);
    } else if (task.status === 'paused') {
      resumeTask(task.id);
    }
  };

  const handleCancel = () => {
    if (confirm(`确定要取消 "${task.bookTitle}" 的OCR处理吗?`)) {
      cancelTask(task.id);
    }
  };

  const handleRemove = () => {
    removeTask(task.id);
  };

  return (
    <Card className={`border ${getStatusColor()} transition-colors`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900">
              {task.bookTitle}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              {getStatusIcon()}
              <span className="text-sm text-gray-600">{getStatusText()}</span>
              {task.startTime && (
                <span className="text-xs text-gray-500">• {getElapsedTime()}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* 暂停/恢复按钮 */}
            {(task.status === 'processing' || task.status === 'paused') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePauseResume}
                title={task.status === 'processing' ? '暂停' : '恢复'}
              >
                {task.status === 'processing' ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* 取消按钮 */}
            {(task.status === 'processing' || task.status === 'paused' || task.status === 'pending') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                title="取消"
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            )}

            {/* 移除按钮 */}
            {(task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                title="移除"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 进度条 */}
        {task.status !== 'cancelled' && task.status !== 'failed' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{task.progress.statusText}</span>
              <span className="font-medium text-gray-900">
                {task.progress.percentage}%
              </span>
            </div>
            <Progress value={task.progress.percentage} className="h-2" />
            {task.progress.total > 0 && (
              <div className="text-xs text-gray-500 text-center">
                {task.progress.current} / {task.progress.total}
              </div>
            )}
          </div>
        )}

        {/* 错误信息 */}
        {task.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800 font-medium">错误信息:</p>
            <p className="text-xs text-red-700 mt-1">{task.error}</p>
          </div>
        )}

        {/* 完成信息 */}
        {task.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-800">
              ✓ 已成功提取 {task.extractedText.length} 个字符
            </p>
          </div>
        )}

        {/* 文件信息 */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>文件类型: {task.fileType === 'pdf' ? 'PDF' : '图片'}</div>
          {task.imageUrls && (
            <div>图片数量: {task.imageUrls.length}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
