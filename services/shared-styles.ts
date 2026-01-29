/**
 * 共享的样式类定义
 * 用于减少多个组件中的重复样式类定义
 */

// 按钮基础样式
export const BTN_BASE = "flex items-center justify-center gap-2 px-3 rounded-md border transition-all text-sm font-medium shadow-sm select-none";

// 次要按钮样式
export const BTN_SECONDARY = "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-600";

// 主要按钮样式
export const BTN_PRIMARY = "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 shadow-md shadow-indigo-900/20";

// 成功按钮样式
export const BTN_SUCCESS = "bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 shadow-md shadow-emerald-900/20";

// 危险按钮样式
export const BTN_DANGER = "bg-red-600 border-red-500 text-white hover:bg-red-500 shadow-md shadow-red-900/20";

// 键盘快捷键样式
export const KBD_STYLE = "hidden sm:inline-flex items-center ml-2 px-1.5 h-5 text-[10px] font-mono bg-black/20 border border-white/10 rounded text-current opacity-70 leading-none";

// 时间戳显示样式
export const TIMESTAMP_WRAPPER = "flex flex-col px-3 py-1 bg-slate-900 rounded border border-slate-700 min-w-[140px] text-center shrink-0 h-9 justify-center";

// 时间戳文本样式
export const TIMESTAMP_TEXT = "font-mono text-xs text-indigo-400";

// 控制栏容器样式
export const CONTROL_BAR_CONTAINER = "flex flex-col w-full max-w-5xl gap-2 animate-in fade-in duration-200";

// 控制栏内层容器样式
export const CONTROL_INNER_CONTAINER = "flex items-center gap-3 bg-slate-800/50 p-1.5 rounded-lg border border-slate-800";

// 通用卡片样式
export const CARD_BASE = "bg-slate-800 rounded-lg p-4 mb-3 border border-slate-700 shadow-sm hover:border-slate-600 transition-colors select-none";

// 通用边框样式
export const BORDER_BASE = "border border-slate-700";

// 通用背景样式
export const BG_SLATE_800 = "bg-slate-800";

// 通用文本样式
export const TEXT_SLATE_200 = "text-slate-200";