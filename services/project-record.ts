import {SubtitleLine, AnkiNoteType} from './types.ts';

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
  timestamp: string;                  // 创建时间戳
}

// 默认版本号
const PROJECT_RECORD_VERSION = "1.1.0";

/**
 * 从当前应用状态创建项目记录
 * @param appState 应用状态
 * @param selectedDeck 选定的deck名称
 * @returns 项目记录对象
 */
export const createProjectRecord = (appState: {
  projectName: string;
  videoName: string;
  subtitleFileName: string;
  subtitleLines: SubtitleLine[];
  ankiConfig: AnkiNoteType;
  ankiConnectUrl: string;
}, selectedDeck?: string): ProjectRecord => {
  return {
    version: PROJECT_RECORD_VERSION,
    projectName: appState.projectName,
    videoName: appState.videoName,
    subtitleFileName: appState.subtitleFileName,
    subtitleLines: appState.subtitleLines,
    ankiConfig: appState.ankiConfig,
    ankiConnectUrl: appState.ankiConnectUrl,
    selectedDeck,
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
    // @ts-ignore
    if (window.showSaveFilePicker) {
      // 使用现代浏览器API
      // @ts-ignore
      const handle = await window.showSaveFilePicker({
        suggestedName: suggestedFileName,
        types: [{
          description: 'Subs2Anki Project File',
          accept: { 'application/json': ['.subs2anki', '.json'] }
        }]
      });
      
      // @ts-ignore
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
    throw error;
  }
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
        const record: ProjectRecord = JSON.parse(content);

        // 验证记录格式
        if (!isValidProjectRecord(record)) {
          reject(new Error('无效的项目记录文件格式'));
          return;
        }

        // 转换字幕行格式（如果需要）
        const convertedRecord = {
          ...record,
          subtitleLines: convertSubtitleLinesFromLegacyFormat(record.subtitleLines)
        };

        resolve(convertedRecord);
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

/**
 * 验证项目记录对象的有效性
 * @param record 项目记录对象
 * @returns boolean
 */
const isValidProjectRecord = (record: any): record is ProjectRecord => {
  // 首先检查基本结构
  if (
    typeof record !== 'object' ||
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

  // 验证每个字幕行的结构
  for (const sub of record.subtitleLines) {
    if (
      typeof sub !== 'object' ||
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
const convertSubtitleLinesFromLegacyFormat = (subtitleLines: any[]): SubtitleLine[] => {
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