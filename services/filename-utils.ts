/**
 * 共享的时间处理工具函数
 * 包含时间格式化、解析和媒体文件名生成等工具
 */

import {formatTime} from '@/services/time.ts';

/**
 * 生成媒体文件名
 * @param videoName 视频文件名（不含扩展名）
 * @param suffix 文件扩展名（如 .jpg, .wav）
 * @param timeStr 时间字符串（可选）
 * @param text 字幕文本（可选）
 * @returns 生成的文件名
 */
export const makeMediaFileName = (
  videoName: string,
  suffix: '.jpg' | '.wav',
  timeStr: string = '',
  text: string = ''
): string => {
  let name = videoName.replace(/\.[^/.]+$/, ""); // 移除原始扩展名
  if (timeStr !== '') {
    name += `_${timeStr}`;
  }
  if (text !== '') {
    // 替换非法文件名字符并限制长度
    name += `_${text.replace(/[<>:"/\\|?*]/g, '_').substring(0, 50)}`;
  }
  name += suffix;
  return name;
};

/**
 * 将时间（秒）转换为文件名友好的格式（替换冒号为连字符）
 * @param seconds 时间（秒）
 * @returns 文件名友好的时间字符串
 */
export const formatTimeForFilename = (seconds: number): string => {
  return formatTime(seconds).replace(/:/g, '-');
};
