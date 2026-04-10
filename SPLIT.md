# App.tsx 渐进式拆分执行方案（Strategy A）

> 适用范围：`App.tsx` 及其直接编排逻辑
>
> 版本：v1.0
>
> 制定日期：2026-04-10
>
> 负责人：待指定

---

## 1. 目标与验收口径

本方案采用 **Strategy A（渐进式拆分）**，核心目标是：

1. **功能行为零回归**（用户可见行为与业务结果不变化）
2. **`App.tsx` 行数降至 `< 500` 行**（硬约束）

### 1.1 双约束验收标准（必须同时满足）

- `Gate A - 零回归`
  - 关键流程通过（见第 10 节回归清单）
  - 无新增已知 blocker 级缺陷
  - 现有测试通过，且新增测试覆盖拆分引入的关键边界
- `Gate B - 文件规模`
  - `App.tsx` 终态稳定在 `< 500` 行
  - 行数统计基于仓库实际文件（CRLF/LF 不影响结论）

> 任何阶段完成后，若 Gate A 失败，则该阶段不算通过。

---

## 2. 为什么要拆分（理由）

当前 `App.tsx` 承担了过多职责（状态读取、业务流程、文件 IO、同步与导出、快捷键行为、弹窗控制、布局装配），导致：

- **认知负担高**：阅读和定位问题成本高
- **改动风险高**：一个变更容易影响多个流程
- **评审困难**：PR 体积大，审查漏检概率高
- **测试困难**：难以单元测试，过度依赖端到端手测
- **协作冲突高**：多人修改同一文件，冲突频繁

拆分后期望达成：

- 业务逻辑按领域聚合（播放/字幕、卡片、同步、项目生命周期）
- `App.tsx` 只做编排和装配
- 改动面更小，回归风险更可控

---

## 3. 拆分原则

1. **行为不变优先于结构完美**：先保证稳定，再追求更优架构。
2. **小步提交、可回滚**：每个阶段都可独立回退。
3. **先抽离低耦合，再迁移高耦合**：降低首轮失败概率。
4. **不在本轮重写 Store 领域模型**：仅做 `App.tsx` 解耦。
5. **先保留接口，后优化接口**：对子组件 props 先兼容。
6. 先为当前要拆分的逻辑编写测试，确保行为锁定，再进行迁移。

---

## 4. 当前职责盘点（`App.tsx`）

按职责可分为 7 组：

1. **全局状态桥接**：`useAppStore` 读取/写入
2. **Anki 连接相关**：`useAnkiConnect`、deck/tag 刷新与选择策略
3. **播放与字幕交互**：seek、replay、head/tail、active line、temp line
4. **卡片与媒体流程**：建卡、批量建卡、截图、音频、删除媒体
5. **同步与导出流程**：单卡同步、批量同步、apkg 导出
6. **项目生命周期**：保存项目、加载项目、重置项目
7. **页面装配**：三列布局、底部控制栏、波形、overlay、modal

> 问题本质：业务流程 + UI 组装混在同层，且异步副作用散落。

### 4.1 Phase 0 责任映射产物（已完成）

| 责任域 | 当前入口（App.tsx） | Phase 1 结果 |
|---|---|---|
| 通知 | `notification` 状态 + `showNotification` | 抽离到 `hooks/app/useNotification.ts` |
| Deck 选择对齐 | `selectedDeck` + deck reconcile `useEffect` | 抽离到 `hooks/app/useDeckSelection.ts` |
| Modal 状态 | template/settings/preview/shortcuts 多个 `useState` | 抽离到 `hooks/app/useModalState.ts` |

### 4.2 Phase 0 回归基线（已冻结）

- Deck 选择规则回归基线：断连默认名、有列表选首项、失效项自动切换并通知。
- 通知生命周期基线：展示后自动隐藏，重复触发重置计时。
- Modal 状态基线：开关状态与预览卡状态可独立控制。

---

## 5. 目标结构（终态）

### 5.1 文件结构建议

```text
hooks/
  app/
    useDeckSelection.ts
    useNotification.ts
    useModalState.ts
    useSubtitlePlayback.ts
    useCardActions.ts
    useSyncActions.ts
    useProjectActions.ts

components/
  app/
    AppMainLayout.tsx
    AppOverlays.tsx
    AppModals.tsx

App.tsx  # 最终仅做 orchestration/wiring
```

### 5.2 职责边界

- `App.tsx`
  - 只负责：组合 hooks、桥接必要状态、渲染布局容器
- `hooks/app/*`
  - 负责：领域动作与副作用流程
- `components/app/*`
  - 负责：大块 UI 结构装配（layout/overlay/modal）
- 现有 `components/*`
  - 尽量保持原有 API，不做大改

---

## 6. 分阶段实施计划（Strategy A）

## Phase 0：基线冻结与映射（0.5 人日）

### 目标

- 建立“行为基线 + 责任地图 + 回归清单”

### 任务

- 梳理 `App.tsx` 中所有 `handle*` 与 `useEffect` 的输入输出
- 为关键流程建立验收 checklist（见第 10 节）
- 明确不可改行为（按钮、快捷键、同步逻辑、通知）

### 交付物

- 本文档（`SPLIT.md`）
- 可执行回归清单（人工 + 自动）

### 退出条件

- 团队对拆分边界一致认同

---

## Phase 1：低风险抽离（1.5 人日）

### 目标

先抽离低耦合逻辑，验证模式可行且不破坏行为。

### 任务

1. `useNotification.ts`
   - 集中管理 `notification` 展示与超时隐藏
   - 提供 `showNotification(text)`
2. `useDeckSelection.ts`
   - 承接 deck 选择对齐逻辑
   - 保留当前规则：
     - 有 deck 列表时，空选择/失效选择回退到第一个 deck
     - 无 deck 列表（断连或空）使用 `getDefaultDeckName`
     - 自动切换时发通知（去重）
3. `useModalState.ts`
   - 收敛 modal 开关状态与操作

### 交付物

- 新增 hooks 文件（3 个）
- `App.tsx` 行数明显下降（目标先降到约 900 左右）

### 风险

- 状态来源变化导致重复渲染

### 缓解

- hooks API 保持最小化
- 只搬运逻辑，不改业务条件

### 退出条件

- Gate A 通过
- 代码审查确认无行为差异

---

## Phase 2：核心业务流抽离（3.5 - 5 人日）

### 目标

将最复杂、最容易产生回归的流程从 `App.tsx` 解耦。

### 任务

1. `useSubtitlePlayback.ts`
   - 管理 `playTimeSpan`、`playEdge`、`playUpdatedSpan`
   - 管理 active/temp subtitle line 相关交互工具函数
2. `useCardActions.ts`
   - 建卡、批量建卡、删除卡片与媒体关联清理
3. `useSyncActions.ts`
   - 单卡同步、批量同步、同步进度与状态控制
4. `useProjectActions.ts`
   - 项目保存、加载、重置

### 交付物

- 新增 hooks 文件（4 个）
- `App.tsx` 行数进一步下降（目标约 600 - 700）

### 风险

- 异步流程竞态（同步状态、overlay、通知）
- 回调闭包拿到旧状态

### 缓解

- 保持显式依赖
- 对关键动作补测试
- 每抽一块做一次完整回归

### 退出条件

- Gate A 通过
- 关键流程全部走通

---

## Phase 3：视图编排拆分与收口（1 - 1.5 人日）

### 目标

把主视图分段，`App.tsx` 仅保留 orchestrator。

### 任务

1. `AppMainLayout.tsx`
   - 封装三列布局 + 控制栏 + 波形区域容器
2. `AppOverlays.tsx`
   - 封装导出/同步/批建 overlay
3. `AppModals.tsx`
   - 封装模板设置、Anki 设置、预览、快捷键 modal
4. `App.tsx`
   - 只保留：
     - hooks 调用
     - props 拼装
     - 入口级别少量状态桥接

### 交付物

- 新增 `components/app/*`（3 个）
- `App.tsx` 最终 `< 500` 行

### 退出条件

- Gate A + Gate B 同时通过

---

## 7. 成本、收益与投入回报

## 7.1 成本估算（总计 6.5 - 9.5 人日）

- Phase 0：0.5
- Phase 1：1.5
- Phase 2：3.5 - 5
- Phase 3：1 - 1.5

额外隐性成本：

- 评审与联调时间
- 回归测试时间
- 与并行需求合并冲突处理

## 7.2 收益（短中期）

- `App.tsx` 规模降低，阅读成本显著下降
- 关键业务流可以做单元测试，回归成本下降
- PR 颗粒度变小，评审质量提升
- 多人并行改动冲突显著减少

## 7.3 ROI（建议衡量指标）

- `App.tsx` 行数：`1100+ -> <500`
- 单次功能 PR 平均改动文件数下降
- 关键回归缺陷数（拆分前后）下降
- 平均评审耗时下降

---

## 8. 风险矩阵与应对

| 风险 | 级别 | 触发点 | 应对策略 |
|---|---|---|---|
| 行为漂移（快捷键/同步） | 高 | 拆分过程中条件判断改动 | 先复制再重构；关键分支保留原表达式 |
| 异步竞态 | 高 | 同步、导出、通知、modal 交错 | 明确状态机，减少共享可变状态 |
| 闭包陈旧状态 | 中 | hooks 迁移后依赖遗漏 | 严格依赖检查；关键逻辑 `useCallback` |
| 渲染抖动/性能回退 | 中 | props drilling 增加 | 局部 memo 与 selector 最小化 |
| 合并冲突 | 中 | 多分支同时改 `App.tsx` | 每阶段短分支、快速合并 |

---

## 9. 回滚策略

1. **按阶段提交**：每个 Phase 独立提交，失败仅回滚该阶段。
2. **接口兼容优先**：早期不改子组件对外 props。
3. **桥接层保留**：在 `App.tsx` 保留旧入口代理，确认稳定后再删除。
4. **发现回归立即止损**：回滚到上一个 Gate 通过点。

---

## 10. 回归与测试清单（Gate A 依据）

## 10.1 手动回归（必须）

- 视频上传、字幕上传、字幕保存/下载
- 字幕点击播放、temp region 创建/编辑/删除
- 快捷键：播放、重播、head/tail、undo/redo、删除、切状态
- 单卡建卡、批量建卡、卡片删除
- 同步：单卡、批量、失败处理、连接中断处理
- deck/tag 刷新、自动切换、切换通知
- 项目保存/加载/重置
- 模板设置、Anki 设置、预览、快捷键面板

## 10.2 自动化测试（建议最低增量）

- `hooks/app/useDeckSelection`：选择对齐规则
- `hooks/app/useNotification`：展示与自动隐藏
- `hooks/app/useSyncActions`：同步状态流转（mock）
- `hooks/app/useProjectActions`：保存/加载关键路径（mock）

## 10.3 构建与静态检查

- TypeScript 错误为 0
- 现有测试通过
- `npm run build` 通过

---

## 11. 每阶段 Definition of Done（DoD）

每个 Phase 完成必须满足：

1. 代码通过构建
2. 该阶段影响范围回归通过
3. 无 blocker 缺陷
4. 文档更新（`SPLIT.md` 打勾进度）
5. 可独立回滚

---

## 12. 执行顺序与里程碑

- M0：完成本计划并冻结边界
- M1（Phase 1 完成）：低风险 hooks 抽离
- M2（Phase 2 完成）：核心业务 hooks 抽离
- M3（Phase 3 完成）：视图编排拆分 + `App.tsx < 500`
- M4：双约束验收签收

---

## 13. 任务拆分清单（可直接执行）

- [x] P0-T1: 建立 `App.tsx` 责任映射表
- [x] P0-T2: 固化回归用例与验收脚本
- [x] P1-T1: 新建 `hooks/app/useNotification.ts`
- [x] P1-T2: 新建 `hooks/app/useDeckSelection.ts`
- [x] P1-T3: 新建 `hooks/app/useModalState.ts`
- [x] P1-T4: `App.tsx` 接入上述 hooks
- [ ] P2-T1: 新建 `hooks/app/useSubtitlePlayback.ts`
- [ ] P2-T2: 新建 `hooks/app/useCardActions.ts`
- [ ] P2-T3: 新建 `hooks/app/useSyncActions.ts`
- [ ] P2-T4: 新建 `hooks/app/useProjectActions.ts`
- [ ] P2-T5: `App.tsx` 替换对应流程
- [ ] P3-T1: 新建 `components/app/AppMainLayout.tsx`
- [ ] P3-T2: 新建 `components/app/AppOverlays.tsx`
- [ ] P3-T3: 新建 `components/app/AppModals.tsx`
- [ ] P3-T4: `App.tsx` 收口并压缩到 `<500` 行
- [ ] P3-T5: 全量回归并验收签收

---

## 14. 与 `TODOS.md` 的对齐关系

本方案直接对应 `TODOS.md` 中以下高优先事项：

- `App.tsx` 拆分为小组件/容器
- 复杂事件处理抽到自定义 Hook
- 提升测试覆盖能力
- 为后续统一错误处理和 i18n 改造创造边界

---

## 15. 变更管理建议

- 推荐每阶段单独 PR，不跨阶段混改。
- 推荐每个 PR 控制在可审查规模（约 200 - 400 行净变更）。
- 推荐在 PR 描述中附上“回归清单勾选结果 + 行数截图”。

---

## 16. 终态判定（项目级）

当且仅当以下条件全部满足，本拆分任务算完成：

1. `App.tsx` 行数 `< 500`
2. 关键功能行为零回归
3. 新增 hooks/容器具备清晰边界
4. 回归清单与文档已更新
5. 团队签收通过

---

## 附录 A：建议的 `App.tsx` 终态职责

- 读取顶层 store 状态与必要 refs
- 调用 `hooks/app/*` 获得动作与派生状态
- 拼装 `components/app/*` 与现有组件
- 仅保留少量入口级 glue code

> 不再在 `App.tsx` 内部写长流程业务逻辑。

---

## 附录 B：后续可选优化（不属于本轮硬目标）

- `services/store.ts` 领域拆分（video/subtitle/card/settings）
- 统一错误处理服务（替换分散 alert）
- 完整 i18n 清理硬编码文本
- `fileHandle` 类型从 `any` 收敛到显式类型


