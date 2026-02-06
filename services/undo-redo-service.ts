import {SubtitleLine} from './types.ts';

// 定义操作类型
export type OperationType =
  | 'MERGE_SUBTITLE_LINES'
  | 'GROUP_SUBTITLE_LINES'
  | 'UNGROUP_SUBTITLE_LINES'
  | 'SPLIT_SUBTITLE_LINE'
  | 'SHIFT_SUBTITLES'
  | 'UPDATE_SUBTITLE_TIME'
  | 'UPDATE_SUBTITLE_TEXT'
  | 'ADD_SUBTITLE_LINE'
  | 'REMOVE_SUBTITLE_LINE'
  | 'MOVE_SUBTITLE';

// 操作接口定义
export interface Operation {
  type: OperationType;
  // 存储执行操作前的状态
  beforeState: SubtitleLine[];
  // 存储执行操作后的状态
  afterState: SubtitleLine[];
  // 操作相关的参数
  params?: any;
}

// Undo/Redo 管理器类
export class UndoRedoManager {
  private history: Operation[] = [];
  private currentIndex: number = -1;
  private readonly capacity: number = 100; // 最多保存100个操作

  // 添加操作到历史记录
  public addOperation(operation: Operation): void {
    // 如果当前不在历史记录的末尾，截断后续的历史记录
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // 添加新操作
    this.history.push(operation);
    
    // 控制历史记录容量
    if (this.history.length > this.capacity) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  // 执行撤销操作
  public undo(): Operation | null {
    if (this.canUndo()) {
      const operation = this.history[this.currentIndex];
      this.currentIndex--;
      return operation;
    }
    return null;
  }

  // 执行重做操作
  public redo(): Operation | null {
    if (this.canRedo()) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return null;
  }

  // 检查是否可以撤销
  public canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  // 检查是否可以重做
  public canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  // 获取当前历史记录长度
  public getHistoryLength(): number {
    return this.history.length;
  }

  // 获取当前索引位置
  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  // 清空历史记录
  public clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  // 获取历史记录
  public getHistory(): Operation[] {
    return [...this.history];
  }
}