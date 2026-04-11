import {SubtitleLine, AnkiNoteType} from './types.ts';
import {isTauriRuntime} from './tauri-runtime.ts';

// 定义项目记录的数据结构
export interface ProjectRecord {
  version: string;                    // 记录文件版本
  projectName: string;                // 项目名称
  videoName: string;                  // 视频文件名
  subtitleLines: SubtitleLine[];      // 字幕行数组
  subtitleFileName: string;           // 字幕文件名
  ankiConfig: AnkiNoteType;           // Anki配置
  ankiConnectUrl: string;             // Anki连接URL
  selectedDeck?: string;              // 选定的deck名称
  globalTags?: string[];              // 全局标签
  timestamp: string;                  // 创建时间戳
  autoDeleteSynced?: boolean;         // 自动删除同步后的卡片
  bulkCreateLimit?: number;           // 批量创建限制
  showBulkCreateButton?: boolean;     // 是否显示批量创建按钮
  audioVolume?: number;               // 音频音量
  screenshotTimingPercent?: number;   // 截图时刻百分比
}

// 默认版本号
const PROJECT_RECORD_VERSION = "1.2.0";

/**
 * 从当前应用状态创建项目记录
 * @param appState 应用状态
 * @param selectedDeck 选定的deck名称
 * @param globalTags 全局标签
 * @param autoDeleteSynced 自动删除同步后的卡片
 * @param bulkCreateLimit 批量创建限制
 * @param showBulkCreateButton 是否显示批量创建按钮
 * @param audioVolume 音频音量
 * @param screenshotTimingPercent 截图时刻百分比
 * @returns 项目记录对象
 */
export const createProjectRecord = (appState: {
  projectName: string;
  videoName: string;
  subtitleFileName: string;
  subtitleLines: SubtitleLine[];
  ankiConfig: AnkiNoteType;
  ankiConnectUrl: string;
}, selectedDeck?: string, globalTags?: string[], bulkCreateLimit?: number, autoDeleteSynced?: boolean, showBulkCreateButton?: boolean, audioVolume?: number, screenshotTimingPercent?: number): ProjectRecord => {
  return {
    version: PROJECT_RECORD_VERSION,
    projectName: appState.projectName,
    videoName: appState.videoName,
    subtitleFileName: appState.subtitleFileName,
    subtitleLines: appState.subtitleLines,
    ankiConfig: appState.ankiConfig,
    ankiConnectUrl: appState.ankiConnectUrl,
    selectedDeck,
    globalTags,
    autoDeleteSynced,
    bulkCreateLimit,
    showBulkCreateButton,
    audioVolume,
    screenshotTimingPercent,
    timestamp: new Date().toISOString()
  };
};

/**
 * 将项目记录保存为JSON文件
 * @param record 项目记录对象
 * @param fileName 文件名（可选，默认为项目名+.subs2anki）
 * @returns Promise<void>
 */
export const saveProjectRecord = async (record: ProjectRecord, fileName?: string): Promise<void> => {
  const suggestedFileName = fileName || `${record.projectName.replace(/[\p{P}\s]/gu, '_')}.subs2anki`;
  
  try {
    // 转换为JSON字符串
    const jsonString = JSON.stringify(record, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // 检查是否支持File System Access API
    if (window.showSaveFilePicker) {
      // 使用现代浏览器API
      const handle = await window.showSaveFilePicker({
        suggestedName: suggestedFileName,
        types: [{
          description: 'Subs2Anki Project File',
          accept: { 'application/json': ['.subs2anki', '.json'] }
        }]
      });
      
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } else {
      // 使用传统的文件下载方式
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = suggestedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    }
  } catch (error) {
    console.error('保存项目记录失败:', error);
  }
};

export const saveProjectRecordViaTauri = async (record: ProjectRecord, fileName?: string): Promise<boolean> => {
  if (!isTauriRuntime()) return false;

  const suggestedFileName = fileName || `${record.projectName.replace(/[\p{P}\s]/gu, '_')}.subs2anki`;
  const jsonString = JSON.stringify(record, null, 2);

  const {save} = await import('@tauri-apps/plugin-dialog');
  const {writeTextFile} = await import('@tauri-apps/plugin-fs');

  const selectedPath = await save({
    defaultPath: suggestedFileName,
    filters: [{
      name: 'Subs2Anki Project File',
      extensions: ['subs2anki', 'json'],
    }],
  });

  if (!selectedPath) {
    return false;
  }

  await writeTextFile(selectedPath, jsonString);
  return true;
};

/**
 * 从文件加载项目记录
 * @param file 文件对象
 * @returns Promise<ProjectRecord>
 */
export const loadProjectRecord = (file: File): Promise<ProjectRecord> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        resolve(parseProjectRecordContent(content));
      } catch (error) {
        reject(new Error('解析项目记录文件失败: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('读取项目记录文件失败'));
    };
    
    reader.readAsText(file);
  });
};

export const loadProjectRecordViaTauri = async (): Promise<ProjectRecord | null> => {
  if (!isTauriRuntime()) return null;

  const {open} = await import('@tauri-apps/plugin-dialog');
  const {readTextFile} = await import('@tauri-apps/plugin-fs');

  const selectedPath = await open({
    multiple: false,
    filters: [{
      name: 'Subs2Anki Project File',
      extensions: ['subs2anki', 'json'],
    }],
  });

  if (!selectedPath || Array.isArray(selectedPath)) {
    return null;
  }

  const content = await readTextFile(selectedPath);
  return parseProjectRecordContent(content);
};

const parseProjectRecordContent = (content: string): ProjectRecord => {
  const record: ProjectRecord = JSON.parse(content);

  if (!isValidProjectRecord(record)) {
    throw new Error('无效的项目记录文件格式');
  }

  return {
    ...record,
    subtitleLines: convertSubtitleLinesFromLegacyFormat(record.subtitleLines),
  };
};

/**
 * 验证项目记录对象的有效性
 * @param record 项目记录对象
 * @returns boolean
 */
interface LegacySubtitleLine {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
  status?: 'normal' | 'locked' | 'ignored';
  locked?: boolean;
}

const isRecordObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isValidProjectRecord = (record: unknown): record is ProjectRecord => {
  if (!isRecordObject(record)) {
    return false;
  }

  // 首先检查基本结构
  if (
    typeof record.version !== 'string' ||
    typeof record.projectName !== 'string' ||
    typeof record.videoName !== 'string' ||
    typeof record.subtitleFileName !== 'string' ||
    !Array.isArray(record.subtitleLines) ||
    typeof record.ankiConfig !== 'object' ||
    typeof record.ankiConnectUrl !== 'string' ||
    typeof record.timestamp !== 'string'
  ) {
    return false;
  }

  // 验证 selectedDeck（如果存在）
  if (record.selectedDeck !== undefined && typeof record.selectedDeck !== 'string') {
    return false;
  }

  // 验证 globalTags（如果存在）
  if (record.globalTags !== undefined) {
    if (!Array.isArray(record.globalTags) || !record.globalTags.every(tag => typeof tag === 'string')) {
      return false;
    }
  }

  // 验证 bulkCreateLimit（如果存在）
  if (record.bulkCreateLimit !== undefined && (typeof record.bulkCreateLimit !== 'number' || record.bulkCreateLimit < 1 || record.bulkCreateLimit > 50)) {
    return false;
  }

  // 验证 autoDeleteSynced（如果存在）
  if (record.autoDeleteSynced !== undefined && typeof record.autoDeleteSynced !== 'boolean') {
    return false;
  }

  // 验证 showBulkCreateButton（如果存在）
  if (record.showBulkCreateButton !== undefined && typeof record.showBulkCreateButton !== 'boolean') {
    return false;
  }

  // 验证 audioVolume（如果存在）
  if (record.audioVolume !== undefined && (typeof record.audioVolume !== 'number' || record.audioVolume < 0.1 || record.audioVolume > 5)) {
    return false;
  }

  // 验证 screenshotTimingPercent（如果存在）
  if (record.screenshotTimingPercent !== undefined && (typeof record.screenshotTimingPercent !== 'number' || record.screenshotTimingPercent < 0 || record.screenshotTimingPercent > 100)) {
    return false;
  }

  // 验证每个字幕行的结构
  for (const sub of record.subtitleLines) {
    if (!isRecordObject(sub)) {
      return false;
    }
    if (
      typeof sub.id !== 'number' ||
      typeof sub.startTime !== 'number' ||
      typeof sub.endTime !== 'number' ||
      typeof sub.text !== 'string' ||
      // 检查新格式 (status) 或旧格式 (locked)
      (sub.status !== undefined && !['normal', 'locked', 'ignored'].includes(sub.status)) ||
      (sub.locked !== undefined && typeof sub.locked !== 'boolean')
    ) {
      return false;
    }
  }

  return true;
};

/**
 * 将旧格式的字幕行转换为新格式
 * @param subtitleLines 字幕行数组
 * @returns 转换后的字幕行数组
 */
const convertSubtitleLinesFromLegacyFormat = (subtitleLines: LegacySubtitleLine[]): SubtitleLine[] => {
  return subtitleLines.map(sub => {
    // 如果已经是新格式，直接返回
    if (sub.status !== undefined) {
      return sub as SubtitleLine;
    }

    // 如果是旧格式，转换为新格式
    const { locked, ...rest } = sub;
    return {
      ...rest,
      status: locked ? 'locked' : 'normal'
    } as SubtitleLine;
  });
};