# Subs2Anki

Subs2Anki 是一个视频字幕处理工具，提供字幕处理和记忆卡片制作解决方案，旨在帮助语言学习者从视频内容中提取有用的语言材料并自动生成 Anki 记忆卡片。

## 功能特色

### 🎥 视频播放器
- 内置 HTML5 视频播放器，支持基本播放控制
- 视频帧捕获功能，可截取任意时刻的画面
- 基于字幕行的时间轴导航，支持在字幕之间快速跳转
- 音量控制功能
- 波形图可视化显示音频轨迹，支持精确时间定位

### 📄 字幕处理
- 支持 SRT 和 VTT 格式字幕文件
- 字幕编辑功能，可修改字幕行文本
- 字幕时间轴偏移调整，同步视频播放
- 字幕行锁定功能，防止意外修改
- 字幕行拆分与合并功能

### 📺 字幕显示
- 视频播放器上实时显示当前字幕
- 自动匹配视频播放时间与字幕显示
- 波形图可视化显示音频轨迹

### 🃏 Anki 卡片生成
- 支持自定义卡片模板
- 自动生成音频剪辑
- 一键生成 Anki 记忆卡片
- 批量创建卡片功能
- 卡片预览功能

### 🔤 Furigana 处理
- 集成 Kuroshiro 库进行日文假名标注
- 自动为汉字添加平假名/片假名标注

### 🔄 Anki 连接
- 支持通过 AnkiConnect 直接同步卡片到 Anki 桌面应用
- 支持导出为 `.apkg` 文件
- 自动检测 Anki 连接状态
- 支持自定义牌组名称

### ⌨️ 快捷键支持
- 丰富的键盘快捷键提升操作效率（见下）
- 按 `/` 键显示快捷键提示表

## 安装与运行

### 系统要求
- Node.js 18+
- npm 或 yarn

### 安装步骤

1. 克隆项目仓库：
```bash
git clone <this-repo>
cd Subs2Anki
```

2. 安装依赖：
```bash
npm install
```

3. 启动 Web 开发服务器：
```bash
npm run dev
```

4. 启动 Tauri 桌面开发构建：
```bash
npm run tauri:dev
```

5. 构建生产版本：
```bash
npm run build
npm run tauri:build
```

## Tauri FFmpeg 后端

- Web 模式仍然使用 `FFmpeg.wasm` 和 `public/ffmpeg` 下的静态文件。
- Tauri 模式会把音频提取路由到 Rust 后端，并保留视频的本地路径，而不是先把整个大文件读进前端内存再传递。
- 桌面端视频选择使用 Tauri 后端暴露的原生文件选择器，播放时通过 Tauri 的 asset protocol 加载本地文件。
- 桌面端字幕打开与保存也使用原生本地路径；Web 模式则继续使用浏览器文件选择器 / File System Access API。
- 目标平台对应的 FFmpeg sidecar 应放在 `src-tauri/bin/`（参见 `src-tauri/bin/README.md`），也可以使用下面的命令复制进去：
```bash
npm run prepare:ffmpeg-sidecar -- <path-to-ffmpeg-binary> <target-triple>
```
- 桌面端启动时会立即检查 FFmpeg 是否可用。如果 sidecar 或回退到系统 `ffmpeg` 都不可用，UI 会显示持续警告，而不是等到第一次提取音频时才报错。
- 设置窗口现在会显示桌面端 FFmpeg 当前状态、解析到的二进制路径、手动“重新检查 FFmpeg”按钮，以及检查失败时的修复步骤。
- 当重新检查成功后，之前仅因桌面端 FFmpeg 不可用而失败的卡片，会自动回到待处理队列。
- `src-tauri/build.rs` 现在会在 debug 构建时给出警告，并在桌面 release 构建缺少当前 target sidecar 时直接失败并给出明确提示。
- 可使用以下命令验证 sidecar：
```bash
npm run validate:ffmpeg-sidecars
npm run validate:ffmpeg-bundle
```
- `.github/workflows/ffmpeg-sidecar-validation.yml` 现在会在原生 Windows / macOS / Linux runner 上执行真实的 `tauri build`，并验证打包产物中确实包含 sidecar。

## 使用指南

### 基本工作流

1. **加载视频**：点击视频区域或使用控制栏上传视频文件
2. **加载字幕**：点击右侧面板的文件夹图标加载字幕文件
3. **预览和编辑**：在右侧字幕面板查看和编辑字幕
4. **创建卡片**：点击字幕行上的 `+` 按钮或使用快捷键 `C` 创建 Anki 卡片
5. **导出或同步**：点击左侧面板的导出或同步按钮

### 快捷键参考

| 快捷键      | 功能                         |
|------------|------------------------------|
| / / Tab    | 显示/隐藏快捷键提示            |
| Space      | 重播当前片段                  |
| P / Q      | 播放/暂停                    |
| H          | 播放当前区域的开头部分          |
| T          | 播放当前区域的末尾部分          |
| J / D      | 上一个字幕行                  |
| K / F      | 下一个字幕行                  |
| S / L      | 显示/隐藏字幕区域              |
| V          | 视频独占模式开关               |
| C / N      | 为当前字幕行创建卡片            |
| I / E      | 切换当前字幕行状态（向前）       |
| O / W      | 切换当前字幕行状态（向后）       |
| B          | 将当前字幕行拆分为两行          |
| A / M      | 将当前字幕行与下一字幕行合并     |
| X / ,      | 删除当前字幕行                |
| U / Z      | 撤销操作                     |
| R / Y      | 重做操作                     |
| . / Escape | 打开/关闭设置模态框            |

## 技术栈

- **前端框架**：React 19
- **UI 库**：Tailwind CSS、Lucide React
- **状态管理**：Zustand
- **音频处理**：FFmpeg.wasm（Web）、Tauri 后端原生 FFmpeg（桌面端）
- **数据库**：IndexedDB
- **构建工具**：Vite
- **类型检查**：TypeScript

## 贡献

欢迎贡献！请随时在 GitHub 仓库上提交 issue 和 pull request。

## 许可证

MIT 许可证。有关更多信息，请参阅 `LICENSE` 文件。
