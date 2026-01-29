# Subs2Anki 项目分析报告

## 1. 代码质量问题

### A. 类型安全问题
- [ ] 在 `services/store.ts` 中使用了 `any` 类型定义 `fileHandle: any | null`
- [ ] 多处使用 `@ts-ignore` 注释掩盖潜在类型错误，特别是在文件保存/读取部分
- [ ] 缺少一些函数的明确返回类型注解
- [ ] 建议为 `FileHandle` 提供更具体的类型定义，而不是使用 `any`

### B. 错误处理不一致
- [ ] 在 `services/ffmpeg.ts` 中错误处理不够完善，可能导致后续操作失败
- [ ] 部分异步操作缺少错误处理
- [ ] 对于用户输入验证不足
- [ ] 在 `services/anki-connect.ts` 中对 AnkiConnect 返回的数据缺乏验证

### C. 代码重复
- [ ] 在 `App.tsx` 中有多处相似的时间处理和媒体处理逻辑
- [ ] 多个组件中有重复的样式类定义
- [ ] 时间格式化和解析逻辑在多个地方重复

### D. 代码组织问题
- [ ] `App.tsx` 文件过于庞大（超过750行），违反了单一职责原则
- [ ] 业务逻辑与UI逻辑高度耦合
- [ ] 组件内部状态管理复杂，难以维护

## 2. 性能问题

### A. 内存泄漏风险
- [ ] 在 `App.tsx` 中使用了 `URL.createObjectURL` 创建的对象可能没有及时释放
- [ ] 在 `VideoPlayer` 组件中可能存在视频元素的内存泄漏
- [ ] IndexedDB 中的媒体文件可能积累过多而未清理

### B. 虚拟滚动优化
- [ ] 虽然使用了 `react-virtuoso`，但在大量字幕行的情况下可能存在性能问题
- [ ] 搜索功能可能会导致频繁的重新渲染

### C. FFmpeg 资源管理
- [ ] `FFmpegService` 是单例模式，但没有明确的资源清理机制
- [ ] 大文件处理可能导致内存占用过高
- [ ] 没有对 FFmpeg 的并发操作进行限制

### D. 媒体处理性能
- [ ] 音频提取和截图操作可能阻塞主线程
- [ ] 没有对批量媒体处理进行优化

## 3. 架构问题

### A. 紧耦合
- [ ] UI 组件与业务逻辑耦合度较高
- [ ] 状态管理与 UI 逻辑混合在一起
- [ ] 服务层之间的依赖关系不清晰

### B. 缺乏配置管理
- [ ] 默认的 AnkiConnect URL 硬编码在代码中
- [ ] 没有统一的配置管理机制
- [ ] 应用常量分散在不同文件中

### C. 缺乏中间件/适配器模式
- [ ] 直接依赖浏览器 API，缺乏抽象层
- [ ] 不同的存储方式（IndexedDB、localStorage）没有统一接口

## 4. 安全问题

### A. XSS 风险
- [ ] 在 `anki-connect.ts` 中直接插入 HTML 标签，可能存在 XSS 风险
- [ ] 解析字幕时虽然去除了 HTML 标签，但可能不够全面
- [ ] 在模板渲染中可能存在注入风险

### B. 数据验证不足
- [ ] 对用户上传的文件缺乏充分的验证
- [ ] 没有对文件大小和类型进行严格限制
- [ ] 对 AnkiConnect 返回的数据缺乏验证

## 5. 可维护性问题

### A. 缺少文档
- [ ] 代码中缺少详细的注释说明
- [ ] API 接口缺少文档说明
- [ ] 业务逻辑缺少设计说明

### B. 测试覆盖率低
- [ ] 缺少单元测试
- [ ] 缺少集成测试
- [ ] 缺少端到端测试

## 6. 用户体验问题

### A. 加载状态反馈
- [ ] 在长时间操作（如FFmpeg加载、音频提取）时缺少明确的加载指示
- [ ] 错误消息不够友好，用户难以理解

### B. 键盘快捷键
- [ ] 快捷键冲突检测机制不够完善
- [ ] 缺少快捷键自定义功能

## 7. 国际化问题

### A. 多语言支持
- [ ] 所有用户界面文本都是硬编码的中文
- [ ] 缺乏国际化框架支持

# 改进建议

## 1. 代码质量改进

### A. 类型安全
```ts
// 为 FileHandle 提供更具体的类型定义
interface FileHandle {
  getFile(): Promise<File>;
  createWritable(): Promise<WritableFileStream>;
}

// 替换 any 类型
fileHandle: FileHandle | null;
```

### B. 统一错误处理
```ts
// 创建统一的错误处理机制
interface ErrorHandler {
  handleError(error: Error, context?: string): void;
  logError(error: Error, context?: string): void;
}

// 实现全局错误处理器
class GlobalErrorHandler implements ErrorHandler {
  handleError(error: Error, context?: string): void {
    console.error(`Error in ${context}:`, error);
    // 可以添加错误上报机制
  }

  logError(error: Error, context?: string): void {
    // 记录错误日志
  }
}
```

### C. 重构大型组件
- [ ] 将 `App.tsx` 拆分为更小的子组件
- [ ] 使用自定义 Hook 分离业务逻辑
- [ ] 创建专门的容器组件来管理状态

### D. 改进类型定义
- [ ] 为所有接口和函数添加明确的类型注解
- [ ] 使用 TypeScript 的高级类型特性来增强类型安全性
- [ ] 为第三方库创建更准确的类型声明

## 2. 性能优化

### A. 内存管理
```ts
// 在组件卸载时清理资源
useEffect(() => {
  return () => {
    // 清理 URL 对象
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }
    // 清理其他资源
  };
}, [videoSrc]);
```

### B. 搜索性能优化
- [ ] 实现防抖搜索以减少不必要的计算
- [ ] 使用 Web Workers 处理大量数据的搜索
- [ ] 对搜索结果进行缓存

### C. 图片压缩优化
- [ ] 在 captureFrame 函数中实现更智能的图片压缩算法
- [ ] 根据屏幕尺寸动态调整压缩质量
- [ ] 使用 WebP 格式替代 JPEG 以获得更好的压缩效果

### D. FFmpeg 并发控制
```ts
// 实现 FFmpeg 操作队列以避免资源竞争
class FFmpegQueue {
  private queue: (() => Promise<any>)[] = [];
  private processing = false;
  private readonly maxConcurrency = 2;

  async add<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processNext();
    });
  }

  private async processNext() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const operation = this.queue.shift();
    if (operation) {
      await operation();
    }
    this.processing = false;

    // 处理队列中的下一个任务
    setTimeout(() => this.processNext(), 0);
  }
}
```

## 3. 架构改进

### A. 组件分离
- [ ] 将视频播放器、字幕列、卡片列等功能分离到独立组件
- [ ] 使用 Context 或更高级的状态管理方案
- [ ] 实现容器组件和展示组件的分离

### B. 服务层抽象
- [ ] 创建更清晰的服务层来处理业务逻辑
- [ ] 实现依赖注入以提高可测试性
- [ ] 为外部服务（如 AnkiConnect）创建适配器

### C. 配置管理
```ts
// 创建配置管理器
interface AppConfig {
  ankiConnectUrl: string;
  defaultNoteType: AnkiNoteType;
  compressionQuality: number;
  maxFileSize: number;
  ffmpeg: {
    maxConcurrency: number;
    workerUrl: string;
  };
}

class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  getConfig(): AppConfig {
    return this.config;
  }

  updateConfig(newConfig: Partial<AppConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig(this.config);
  }

  private loadConfig(): AppConfig {
    // 从 localStorage 或其他存储加载配置
    const stored = localStorage.getItem('app-config');
    return stored ? JSON.parse(stored) : this.getDefaultConfig();
  }

  private saveConfig(config: AppConfig): void {
    localStorage.setItem('app-config', JSON.stringify(config));
  }

  private getDefaultConfig(): AppConfig {
    return {
      ankiConnectUrl: 'http://127.0.0.1:8765',
      defaultNoteType: DEFAULT_NOTE_TYPE,
      compressionQuality: 0.8,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      ffmpeg: {
        maxConcurrency: 2,
        workerUrl: '/ffmpeg/ffmpeg-worker.js'
      }
    };
  }
}
```

## 4. 安全增强

### A. 输入验证
- [ ] 对上传的文件进行更严格的验证
- [ ] 实现文件类型和大小限制
- [ ] 使用白名单验证文件类型

### B. 输出编码
- [ ] 对所有用户生成的内容进行适当的编码
- [ ] 使用 DOMPurify 等库清理 HTML 内容
- [ ] 在模板渲染前对内容进行转义

### C. API 调用安全
- [ ] 对 AnkiConnect 的请求进行验证
- [ ] 实现请求超时机制
- [ ] 添加请求频率限制

## 5. 测试覆盖

### A. 单元测试
- [ ] 为核心业务逻辑增加更多单元测试
- [ ] 测试边界条件和异常情况
- [ ] 使用 Jest 和 Testing Library 进行测试

### B. 集成测试
- [ ] 测试组件间的交互
- [ ] 测试端到端的工作流程
- [ ] 使用 Cypress 或 Playwright 进行 E2E 测试

### C. 性能测试
- [ ] 对关键路径进行性能基准测试
- [ ] 监控内存使用情况
- [ ] 测试大数据量下的性能表现

## 6. 文档和维护

### A. 代码文档
- [ ] 为公共 API 添加 JSDoc 注释
- [ ] 更新 README.md 以反映最新功能
- [ ] 添加架构图和数据流图

### B. 开发规范
- [ ] 建立代码风格指南
- [ ] 使用 ESLint 和 Prettier 强制执行规范
- [ ] 实施代码审查流程

## 7. 具体修复建议

### A. App.tsx 重构
- [ ] 将 App.tsx 拆分为多个更小的组件
- [ ] 创建 VideoContainer、SubtitleContainer、CardContainer 等容器组件
- [ ] 将复杂的事件处理逻辑提取到自定义 Hook 中

### B. 状态管理优化
- [ ] 考虑将全局状态按功能域拆分
- [ ] 为不同的功能模块创建独立的 Store
- [ ] 实现状态持久化机制

### C. 错误边界
- [ ] 为应用添加错误边界组件
- [ ] 实现优雅的错误降级机制
- [ ] 添加用户友好的错误提示

### D. 国际化支持
- [ ] 为应用添加国际化能力
- [ ] 将所有用户可见的文本提取为可翻译字符串
- [ ] 支持多语言界面

### E. 可访问性改进
- [ ] 为所有交互元素添加适当的 ARIA 属性
- [ ] 确保键盘导航的可用性
- [ ] 支持高对比度模式和屏幕阅读器

### F. 用户体验改进
- [ ] 添加加载状态指示器
- [ ] 改进错误消息的用户友好性
- [ ] 添加快捷键自定义功能

### G. 项目特定改进
- [ ] 为 FFmpegService 添加资源清理方法
- [ ] 实现 IndexedDB 媒体文件的定期清理机制
- [ ] 优化音频提取的并发控制
- [ ] 添加项目自动保存功能
- [ ] 实现撤销/重做功能
- [ ] 添加批量操作功能（如批量删除卡片）
- [ ] 优化字幕编辑的用户体验
- [ ] 添加项目导入/导出功能的进度指示
- [ ] 实现更灵活的模板系统
- [ ] 添加项目备份和恢复功能