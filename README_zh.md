# Subs2Anki

Subs2Anki 是一个基于字幕驱动的视频学习工具，用于从视频片段中提取内容并生成 Anki 记忆卡片。项目将字幕编辑、媒体截取、模板映射、Anki 同步与导出整合在一个 React + Vite 应用中，并支持可选的 Tauri 桌面运行时。

## 项目亮点

- 加载视频与字幕文件，按字幕行快速定位与回放
- 编辑、拆分、合并、锁定、忽略、分组字幕片段
- 为每张卡片生成音频片段和截图
- 自定义 Anki 字段、模板、CSS、牌组和标签
- 通过 AnkiConnect 直接同步，或导出 `.apkg`
- 保存并重新打开 `.subs2anki` 项目文件
- 借助波形图和快捷键提升精细化操作效率

## 当前功能

### 媒体与播放
- 内置 HTML5 视频播放
- 按字幕时间同步跳转与重播
- 波形图辅助精确选择区间
- 手动截帧与音频下载
- 生成音频时支持增益调节

### 字幕编辑
- 支持 SRT / VTT 导入与导出
- 行内编辑字幕文本
- 拆分 / 合并 / 删除字幕行
- 锁定 / 忽略状态管理
- 临时字幕区间创建
- 基于共享 undo-redo 服务的撤销 / 重做

### 卡片生成
- 单条创建与批量创建
- 卡片预览与删除
- 自定义 Anki Note Type 字段 / 模板 / CSS
- 日语内容可选 Furigana 生成
- 截图时刻支持 `0% / 25% / 50% / 75% / 100%` 五档（默认 `50%`）

### Anki 集成
- 支持测试 AnkiConnect 连接
- 支持读取与刷新 deck 列表
- deck 刷新成功后自动执行默认选择 / 回退选择逻辑
- 支持全局标签
- 支持导出 `.apkg`

### 项目持久化
- 保存 / 打开 `.subs2anki` 项目文件
- Web 端使用浏览器文件选择器
- Tauri 运行时使用后端文件打开 / 保存流程

## 快速开始

### 环境要求
- Node.js 18+
- npm
- 如需桌面端构建：Rust + Tauri 前置环境

### 安装依赖

```bash
npm install
```

### 启动 Web 开发环境

```bash
npm run dev
```

### 构建 Web 版本

```bash
npm run build
```

### 运行质量检查

```bash
npm run typecheck
npm test
```

### 启动 / 构建 Tauri 版本

```bash
npm run tauri:dev
npm run tauri:build
```

## 基本工作流

1. 加载视频
2. 加载字幕文件
3. 检查并编辑字幕行
4. 配置牌组、标签、模板和设置
5. 创建一张或多张卡片
6. 同步到 Anki 或导出为 `.apkg`
7. 如需后续继续，保存为 `.subs2anki` 项目文件

## 快捷键参考

| 快捷键      | 功能                         |
|------------|------------------------------|
| / / Tab    | 显示 / 隐藏快捷键提示         |
| Space      | 重播当前片段                  |
| P / Q      | 播放 / 暂停                   |
| H          | 播放当前区域的前段            |
| T          | 播放当前区域的后段            |
| J / D      | 上一个字幕行                  |
| K / F      | 下一个字幕行                  |
| S / L      | 显示 / 隐藏字幕区域           |
| V          | 切换视频独占模式              |
| C / N      | 为当前字幕行创建卡片          |
| I / E      | 向前切换当前字幕行状态        |
| O / W      | 向后切换当前字幕行状态        |
| B          | 将当前字幕行拆分为两行        |
| A / M      | 将当前字幕行与下一行合并      |
| X / ,      | 删除当前字幕行                |
| U / Z      | 撤销操作                      |
| R / Y      | 重做操作                      |
| . / Escape | 打开 / 关闭设置模态框         |

## 目录概览

```text
App.tsx                     应用组合入口
components/                 UI 组件与模态框
hooks/                      UI 与应用域 hooks
services/                   核心业务逻辑与持久化
src-tauri/                  可选的 Tauri 桌面后端
tests/                      组件、hook、核心逻辑测试
```

关键区域：
- `services/store.ts`：全局 Zustand store
- `hooks/app/`：从 `App.tsx` 中拆出的应用级编排逻辑
- `services/project-record.ts`：项目文件读写与校验
- `services/anki-connect.ts`：AnkiConnect 通信
- `services/anki-db.ts`：`.apkg` 数据库生成

## 审查快照（2026-04-13）

本次已对代码库进行全量扫描，并执行了基础检查。

### 已验证状态
- `npm run build`：通过
- `npm run typecheck`：通过
- `npm test`：通过（`19` 个测试文件 / `60` 个测试用例）
- `App.tsx`：当前为 `471` 行

### P5 测试覆盖已完成
- 核心服务已覆盖：`services/ffmpeg.ts`、`services/furigana.ts`、`services/anki-connect.ts`、`services/project-record.ts`
- 关键 hooks 已覆盖：`hooks/useMediaProcessing.ts`、`hooks/app/useSyncActions.ts`、`hooks/app/useProjectActions.ts`、`hooks/app/useDeckSelection.ts`
- 已覆盖回归场景：
  - 旧项目文件缺失截图时刻时默认回退到 `50%`
  - deck 刷新后的默认选择 / 回退逻辑
  - 截图时刻百分比边界 clamp
  - Tauri 与 Web 双路径项目读写

### 已验证问题
- 构建输出仍有 `sql.js` 的 browser externalization 警告（`fs`、`crypto`）
- 仍有部分流程使用 `alert` / `confirm`，不利于用户体验和自动化测试
- 某些用户可控内容会被直接插入到 Anki HTML 字段或模板提示中，缺少统一净化边界

详细的优先级整改列表请见 `TODOS.md`。

## 已知限制

- 构建时仍会出现 `sql.js` 的 browser externalization 警告
- 设置项持久化仍分散在项目文件与 `localStorage` 之间
- 部分 UI 文案与弹窗尚未完全统一到通知系统和 i18n

## 贡献说明

欢迎贡献。在提交 PR 前，至少请运行：

```bash
npm run build
npm run typecheck
npm test
```

如果你修改了持久化、同步、字幕编辑等核心逻辑，也请同步更新相关文档或 `TODOS.md`。

## 技术栈

- React 19
- TypeScript 5.8
- Vite 6
- Zustand 5
- Tailwind CSS 3
- Vitest 4
- FFmpeg.wasm
- IndexedDB (`idb`)
- `sql.js`
- Tauri 2

## 许可证

MIT 许可证。详见 `LICENSE`。
