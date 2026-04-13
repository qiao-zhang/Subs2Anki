# Subs2Anki 当前问题与改进清单

> 最后更新时间：2026-04-13（P0、P5 已完成）
> 本次结论来源：全量代码扫描 + 构建 / 类型检查 / 测试基线执行

---

## 0. 本次审查结论摘要

### 已验证通过
- [x] `npm run build` 可通过
- [x] `npm run typecheck` 可通过
- [x] `npm test` 可通过（`19` 个测试文件，`60` 个测试用例）
- [x] `App.tsx` 已拆分至 `471` 行，旧的“1100+ 行”结论已不再适用
- [x] 代码库中已不存在 `MutableRefObject` 文本引用
- [x] 项目文件已包含 `screenshotTimingPercent`，缺失时按 `50%` 回退
- [x] Tauri 路径下已存在项目文件打开 / 保存实现（`services/project-record.ts`）

### 已验证失败 / 风险
- [x] `npx tsc --noEmit` 已修复
- [x] `npx vitest run` 已修复
- [x] 测试环境 DOM / `localStorage` / `window` / `document` 基线已统一
- [x] 测试路径与依赖漂移问题已修复
- [ ] 仍存在 `alert` / `confirm` 驱动的交互，影响 UX、一致性与可测试性
- [ ] 存在用户可控 HTML 直接进入渲染或导出链路的风险边界，需统一净化

---

## P0：先恢复工程健康度（必须优先完成）

### P0-1 测试基线修复
- [x] 为 Vitest 增加统一测试环境配置（`jsdom`、setup file、matcher 扩展）
  - 现象：大量 hook 测试报 `document is not defined` / `window is not defined`
  - 目标：`renderHook`、组件测试、store 测试都在统一环境下运行
  - 涉及：`vite.config.ts` 或新增 vitest config、`tests/**`

- [x] 修复测试中的错误 import 与漂移依赖
  - 已观测问题：
	- `tests/components/CardItem.test.tsx` 仍引用 `../../ui/components/CardItem`
	- `tests/components/WaveformDisplay.test.tsx` 引用了未安装的 `jotai/react`
  - 目标：测试引用与当前代码结构一致

- [x] 接入 Testing Library 断言扩展
  - 已观测问题：`toBeInTheDocument`、`toHaveFocus` 未被识别
  - 目标：统一在测试 setup 中注册 matcher

- [x] 修复测试与业务 API 漂移
  - 已观测问题：
	- `services/time.ts` 已不再导出 `formatTime` / `parseVTTTime`，但测试仍在依赖
	- `services/types.ts` 与测试对 `SubtitleLine` 的字段认知不一致
	- `services/anki-db.ts` 的 `createAnkiDatabase` 签名与测试调用不一致
  - 目标：要么更新测试，要么补充兼容层，但必须统一

### P0-2 让业务代码对测试 / 非浏览器环境更稳健
- [x] 为 `services/store.ts` 的 `localStorage` 访问增加安全封装
  - 现象：`tests/core/store.test.ts` 因 `localStorage is not defined` 直接崩溃
  - 目标：抽出 `safeLocalStorageGet/Set` 或设置持久化适配器

- [x] 修复 `hooks/app/useAppUtilityActions.ts` 中文件选择器类型错误
  - 已观测问题：`showSaveFilePicker.types[]` 缺失 `accept`
  - 目标：`npx tsc --noEmit` 不再在该文件报错

- [x] 修复 `services/project-record.ts` 中 `subtitle status` 校验的类型收窄问题
  - 已观测问题：`includes(sub.status)` 处 `unknown -> string` 未完成收窄
  - 目标：校验逻辑既严格又通过 TS 检查

### P0-3 补齐基础工程脚本
- [x] 在 `package.json` 中补充标准脚本
  - 建议至少加入：`typecheck`、`test`、`test:watch`、`lint`
  - 当前问题：README 已需写成 `npx ...`，说明工程脚本不完整

---

## P1：安全、一致性、可维护性

### P1-1 统一错误提示与确认交互
- [ ] 替换业务路径中的 `alert` / `confirm`
  - 已观测文件：
	- `services/export.ts`
	- `hooks/app/useSyncActions.ts`
	- `hooks/app/useProjectActions.ts`
	- `hooks/app/useAppUtilityActions.ts`
  - 目标：统一到通知系统 / 模态确认框 / i18n 文案

### P1-2 建立 HTML 安全边界
- [ ] 审查并净化所有用户可控 HTML 注入点
  - 已观测点：
	- `components/modals/TemplateEditorModal.tsx` 中 `dangerouslySetInnerHTML`
	- `services/anki-connect.ts` 中图片 HTML 拼接
	- `services/anki-db.ts` 中导出字段 HTML 拼接
  - 目标：明确哪些字段允许 HTML，哪些需要转义 / 净化

### P1-3 整理配置持久化边界
- [ ] 收敛 `localStorage`、project file、Tauri 后端之间的设置来源
  - 当前分散项：Anki URL、批量创建限制、自动删除、音量、截图时刻、语言
  - 目标：形成一套清晰的“运行时设置 vs 项目级设置”规则

### P1-4 文档与架构注释补强
- [ ] 为 `services/types.ts`、`services/project-record.ts`、`services/anki-connect.ts` 增加关键 JSDoc
- [ ] 补一份开发者导向文档：测试架构、持久化边界、同步链路

---

## P2：状态管理与架构继续收敛

### P2-1 Store slice 拆分（在不破坏现有 API 的前提下）
- [ ] 将 `services/store.ts` 按领域拆分为 slice
  - 候选拆分：
	- `project slice`
	- `subtitle slice`
	- `anki slice`
	- `settings slice`
	- `history slice`
  - 目标：降低单文件复杂度，减少跨域耦合

### P2-2 将可局部化状态从全局 store 下沉
- [ ] 逐项审查哪些状态可从全局 store 下沉到 hook / 组件 `useState`
  - 候选：瞬时 UI 状态、模态开关、局部输入态
  - 注意：项目级持久化状态与全局快捷键依赖状态不要盲目下沉

### P2-3 强化依赖注入与服务边界
- [ ] 为外部依赖建立适配器边界
  - AnkiConnect
  - FFmpeg
  - File System / Tauri 文件能力
  - 剪贴板 / 浏览器文件选择器

---

## P3：性能与稳定性

### P3-1 媒体处理稳定性
- [ ] 继续跟踪批量生成卡片后的累计内存问题
  - 重点确认音频 blob / 截图 data URL / IndexedDB 引用 / FFmpeg 中间文件是否及时释放

- [ ] 为 FFmpeg 路径补充并发控制与资源回收测试

### P3-2 大数据量字幕性能
- [ ] 优化 `react-virtuoso` 使用策略
- [ ] 为字幕搜索、波形刷新、截图捕获增加节流 / 防抖
- [ ] 评估 furigana 结果缓存

### P3-3 构建体验
- [ ] 处理 `sql.js` browser externalization 警告
- [ ] 增加 chunk 分析与包体积跟踪

---

## P4：可访问性与用户体验

- [ ] 为关键按钮补 `aria-label`
- [ ] 检查图片 / 图标替代文本策略
- [ ] 为高风险操作增加统一确认框
- [ ] 增加长任务进度反馈（特别是 FFmpeg 与批量同步）
- [ ] 清理剩余硬编码英文提示，统一进入 i18n

---

## P5：测试覆盖补强

### 核心服务
- [x] `services/ffmpeg.ts`
- [x] `services/furigana.ts`
- [x] `services/anki-connect.ts`
- [x] `services/project-record.ts`

### 关键 hooks
- [x] `hooks/useMediaProcessing.ts`
- [x] `hooks/app/useSyncActions.ts`
- [x] `hooks/app/useProjectActions.ts`
- [x] `hooks/app/useDeckSelection.ts`

### 回归场景
- [x] 项目文件缺失新字段时的向后兼容
- [x] deck 刷新后默认选择 / 回退逻辑
- [x] 截图时刻百分比边界 clamp
- [x] Tauri 与 Web 双路径项目读写

---

## 已完成但需要保持的事项

- [x] `App.tsx` 已降到 `< 500` 行
- [x] 截图时刻设置已进入 Settings 与项目文件
- [x] deck 刷新后的默认选择 / 回退逻辑已实现
- [x] `MutableRefObject` 文本引用已清理
- [x] Tauri 路径下项目打开 / 保存已落地

> 注：这些事项不应再以“未完成问题”的方式出现在后续审查中，除非发生回归。

---

## 低优先级 / 未来规划

- [ ] 支持更多字幕格式（ASS/SSA）
- [ ] 视频播放速度控制
- [ ] 字幕时间轴可视化编辑器
- [ ] 多轨字幕处理
- [ ] 更灵活的模板系统
- [ ] 项目自动保存 / 备份恢复
- [ ] 与 AnkiWeb 的更深层集成

---

## 附录：本次基线命令

```bash
npm run build
npm run typecheck
npm test
```

## 附录：当前技术栈概览

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React | 19.2.3 |
| 状态管理 | Zustand | 5.0.3 |
| 构建工具 | Vite | 6.2.0 |
| TypeScript | TypeScript | 5.8.2 |
| UI 库 | Tailwind CSS | 3.4.1 |
| 图标库 | Lucide React | 0.562.0 |
| 音频处理 | FFmpeg.wasm | 0.12.10 |
| 数据库 | IndexedDB (idb) | 8.0.3 |
| 国际化 | i18next | 25.8.5 |
| 表格处理 | JSZip | 3.10.1 |
| SQLite | sql.js | 1.13.0 |
| 虚拟列表 | react-virtuoso | 4.18.1 |
