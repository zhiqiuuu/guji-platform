'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ClientOCRService, OCRProgress, OCRResult } from '@/lib/ocr-client-service';
import { PageText } from '@/lib/paragraph-splitter';

export type OCRTaskStatus = 'pending' | 'processing' | 'paused' | 'completed' | 'cancelled' | 'failed';

export interface OCRTask {
  id: string;
  bookId: string;
  bookTitle: string;
  status: OCRTaskStatus;
  progress: {
    current: number;
    total: number;
    percentage: number;
    statusText: string;
  };
  fileUrl: string;
  fileType: 'pdf' | 'images';
  imageUrls?: string[];
  extractedText: string;
  error?: string;
  startTime?: number;
  endTime?: number;
  ocrService?: ClientOCRService;
}

interface OCRTaskContextType {
  tasks: OCRTask[];
  addTask: (task: Omit<OCRTask, 'id' | 'status' | 'progress' | 'extractedText'>) => string;
  addAndStartTask: (task: Omit<OCRTask, 'id' | 'status' | 'progress' | 'extractedText'>) => Promise<string>;
  startTask: (taskId: string) => Promise<void>;
  pauseTask: (taskId: string) => void;
  resumeTask: (taskId: string) => void;
  cancelTask: (taskId: string) => void;
  removeTask: (taskId: string) => void;
  getTask: (taskId: string) => OCRTask | undefined;
}

const OCRTaskContext = createContext<OCRTaskContextType | undefined>(undefined);

export function OCRTaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<OCRTask[]>([]);

  // 添加任务
  const addTask = useCallback((
    taskData: Omit<OCRTask, 'id' | 'status' | 'progress' | 'extractedText'>
  ): string => {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const newTask: OCRTask = {
      ...taskData,
      id: taskId,
      status: 'pending',
      progress: {
        current: 0,
        total: 0,
        percentage: 0,
        statusText: '等待开始',
      },
      extractedText: '',
      ocrService: new ClientOCRService(),
    };

    setTasks((prev) => [...prev, newTask]);
    return taskId;
  }, []);

  // 添加并立即启动任务
  const addAndStartTask = useCallback(async (
    taskData: Omit<OCRTask, 'id' | 'status' | 'progress' | 'extractedText'>
  ): Promise<string> => {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const newTask: OCRTask = {
      ...taskData,
      id: taskId,
      status: 'pending',
      progress: {
        current: 0,
        total: 0,
        percentage: 0,
        statusText: '等待开始',
      },
      extractedText: '',
      ocrService: new ClientOCRService(),
    };

    // 先添加任务
    setTasks((prev) => [...prev, newTask]);

    // 直接在这里执行任务启动逻辑(不依赖其他函数)
    const executeTask = async () => {
      if (!newTask.ocrService) {
        console.error('OCR服务未初始化', { taskId });
        return;
      }

      try {
        // 更新状态为处理中
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, status: 'processing' as OCRTaskStatus, startTime: Date.now() }
              : t
          )
        );

        // 初始化OCR服务
        await newTask.ocrService.initialize();

        // 开始OCR处理 - 使用详细版本获取 pageTexts
        let ocrResult: OCRResult;
        if (newTask.fileType === 'pdf') {
          ocrResult = await newTask.ocrService.extractTextFromPDFDetailed(
            newTask.fileUrl,
            {
              onProgress: (progress) => {
                setTasks((prev) =>
                  prev.map((t) =>
                    t.id === taskId
                      ? {
                          ...t,
                          progress: {
                            current: progress.current,
                            total: progress.total,
                            percentage: progress.percentage,
                            statusText: progress.status,
                          },
                        }
                      : t
                  )
                );
              },
            }
          );
        } else if (newTask.fileType === 'images' && newTask.imageUrls) {
          ocrResult = await newTask.ocrService.extractTextFromImagesDetailed(
            newTask.imageUrls,
            {
              onProgress: (progress) => {
                setTasks((prev) =>
                  prev.map((t) =>
                    t.id === taskId
                      ? {
                          ...t,
                          progress: {
                            current: progress.current,
                            total: progress.total,
                            percentage: progress.percentage,
                            statusText: progress.status,
                          },
                        }
                      : t
                  )
                );
              },
            }
          );
        } else {
          throw new Error('不支持的文件类型');
        }

        // 完成后上传到服务器(包含 pageTexts)
        await uploadOCRResult(newTask.bookId, ocrResult.fullText, ocrResult.pageTexts);

        // 更新任务为完成
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'completed' as OCRTaskStatus,
                  extractedText: ocrResult.fullText,
                  endTime: Date.now(),
                  progress: {
                    current: t.progress.total || 1,
                    total: t.progress.total || 1,
                    percentage: 100,
                    statusText: '处理完成',
                  },
                }
              : t
          )
        );

        // 清理OCR服务
        await newTask.ocrService.terminate();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';

        if (errorMessage.includes('已取消')) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    status: 'cancelled' as OCRTaskStatus,
                    error: errorMessage,
                    endTime: Date.now(),
                  }
                : t
            )
          );
        } else {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    status: 'failed' as OCRTaskStatus,
                    error: errorMessage,
                    endTime: Date.now(),
                  }
                : t
            )
          );
        }

        // 清理OCR服务
        if (newTask.ocrService) {
          await newTask.ocrService.terminate();
        }
      }
    };

    // 使用 setTimeout 确保状态更新后再启动
    setTimeout(() => {
      executeTask();
    }, 0);

    return taskId;
  }, []);

  // 更新任务状态
  const updateTask = useCallback((taskId: string, updates: Partial<OCRTask>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  }, []);

  // 更新任务进度
  const updateProgress = useCallback((taskId: string, progress: OCRProgress) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              progress: {
                current: progress.current,
                total: progress.total,
                percentage: progress.percentage,
                statusText: progress.status,
              },
            }
          : task
      )
    );
  }, []);

  // 内部启动任务函数(接受任务对象)
  const startTaskInternal = useCallback(async (taskId: string, task: OCRTask) => {
    if (!task.ocrService) {
      console.error('OCR服务未初始化', { taskId });
      return;
    }

    try {
      // 更新状态为处理中
      updateTask(taskId, {
        status: 'processing',
        startTime: Date.now(),
      });

      // 初始化OCR服务
      await task.ocrService.initialize();

      // 开始OCR处理 - 使用详细版本获取 pageTexts
      let ocrResult: OCRResult;
      if (task.fileType === 'pdf') {
        // PDF文件使用详细版本方法
        ocrResult = await task.ocrService.extractTextFromPDFDetailed(
          task.fileUrl,
          {
            onProgress: (progress) => updateProgress(taskId, progress),
          }
        );
      } else if (task.fileType === 'images' && task.imageUrls) {
        // 图片文件使用详细版本方法
        ocrResult = await task.ocrService.extractTextFromImagesDetailed(
          task.imageUrls,
          {
            onProgress: (progress) => updateProgress(taskId, progress),
          }
        );
      } else {
        throw new Error('不支持的文件类型');
      }

      // 完成后上传到服务器(包含 pageTexts)
      await uploadOCRResult(task.bookId, ocrResult.fullText, ocrResult.pageTexts);

      // 更新任务为完成
      updateTask(taskId, {
        status: 'completed',
        extractedText: ocrResult.fullText,
        endTime: Date.now(),
        progress: {
          current: task.progress.total || 1,
          total: task.progress.total || 1,
          percentage: 100,
          statusText: '处理完成',
        },
      });

      // 清理OCR服务
      await task.ocrService.terminate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';

      if (errorMessage.includes('已取消')) {
        updateTask(taskId, {
          status: 'cancelled',
          error: errorMessage,
          endTime: Date.now(),
        });
      } else {
        updateTask(taskId, {
          status: 'failed',
          error: errorMessage,
          endTime: Date.now(),
        });
      }

      // 清理OCR服务
      if (task.ocrService) {
        await task.ocrService.terminate();
      }
    }
  }, [updateTask, updateProgress]);

  // 开始任务(从tasks状态中查找)
  const startTask = useCallback(async (taskId: string) => {
    // 直接从当前tasks状态中查找任务
    const currentTask = tasks.find((t) => t.id === taskId);

    if (!currentTask || !currentTask.ocrService) {
      console.error('任务不存在或OCR服务未初始化', { taskId, hasTask: !!currentTask });
      return;
    }

    await startTaskInternal(taskId, currentTask);
  }, [tasks, startTaskInternal]);

  // 暂停任务
  const pauseTask = useCallback((taskId: string) => {
    setTasks((prevTasks) => {
      const task = prevTasks.find((t) => t.id === taskId);
      if (!task || task.status !== 'processing') {
        return prevTasks;
      }

      task.ocrService?.pause();
      return prevTasks.map((t) =>
        t.id === taskId ? { ...t, status: 'paused' as OCRTaskStatus } : t
      );
    });
  }, []);

  // 恢复任务
  const resumeTask = useCallback((taskId: string) => {
    setTasks((prevTasks) => {
      const task = prevTasks.find((t) => t.id === taskId);
      if (!task || task.status !== 'paused') {
        return prevTasks;
      }

      task.ocrService?.resume();
      return prevTasks.map((t) =>
        t.id === taskId ? { ...t, status: 'processing' as OCRTaskStatus } : t
      );
    });
  }, []);

  // 取消任务
  const cancelTask = useCallback(async (taskId: string) => {
    let taskToCancel: OCRTask | undefined;
    setTasks((prevTasks) => {
      taskToCancel = prevTasks.find((t) => t.id === taskId);
      if (!taskToCancel) {
        return prevTasks;
      }

      taskToCancel.ocrService?.stop();
      return prevTasks.map((t) =>
        t.id === taskId
          ? { ...t, status: 'cancelled' as OCRTaskStatus, endTime: Date.now() }
          : t
      );
    });

    // 清理OCR服务
    if (taskToCancel?.ocrService) {
      await taskToCancel.ocrService.terminate();
    }
  }, []);

  // 移除任务
  const removeTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  }, []);

  // 获取任务
  const getTask = useCallback((taskId: string) => {
    let foundTask: OCRTask | undefined;
    setTasks((prevTasks) => {
      foundTask = prevTasks.find((t) => t.id === taskId);
      return prevTasks;
    });
    return foundTask;
  }, []);

  const value: OCRTaskContextType = {
    tasks,
    addTask,
    addAndStartTask,
    startTask,
    pauseTask,
    resumeTask,
    cancelTask,
    removeTask,
    getTask,
  };

  return (
    <OCRTaskContext.Provider value={value}>
      {children}
    </OCRTaskContext.Provider>
  );
}

export function useOCRTasks() {
  const context = useContext(OCRTaskContext);
  if (!context) {
    throw new Error('useOCRTasks must be used within OCRTaskProvider');
  }
  return context;
}

// 上传OCR结果到服务器
async function uploadOCRResult(
  bookId: string,
  fullText: string,
  pageTexts?: PageText[]
): Promise<void> {
  try {
    const response = await fetch('/api/ocr/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookId,
        fullText,
        pageTexts, // 新增: 传递页面文本数据
      }),
    });

    if (!response.ok) {
      throw new Error('上传OCR结果失败');
    }

    const result = await response.json();
    console.log('OCR结果上传成功:', result);

    // 如果段落保存成功,记录日志
    if (result.paragraphsSaved) {
      console.log('✅ 段落数据已保存到数据库');
    }
  } catch (error) {
    console.error('上传OCR结果失败:', error);
    throw error;
  }
}
