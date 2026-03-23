# Subs2Anki TODOs (Refreshed)

> Last updated: 2026-03-23  
> Basis: latest full validation (`npm run typecheck`, `npm run test`, `npm run build`)

## Current health snapshot

- Type check: pass
- Tests: pass (19 files / 66 tests)
- Build: pass
- Architecture: `App.tsx` orchestration has been significantly reduced into hooks/components

---

## P0 - Reliability and correctness (next focus)

- [ ] Fix async cleanup race in project reset flow
  - File: `hooks/useProjectReset.ts`
  - Issue: `ankiCards.forEach(async ...)` is not awaited; cleanup may not complete before `clearCards()`/reload
  - Expected outcome: use awaited sequencing (`for...of` or `Promise.all`) so media deletion is deterministic

- [ ] Ensure reset completion notification is actually visible
  - File: `hooks/useProjectReset.ts`
  - Issue: `showNotification(...)` is called after `reloadPage()` and may never render
  - Expected outcome: either notify before reload or persist/show notification post-reload via reliable mechanism

---

## P1 - Architecture and maintainability

- [x] Continue splitting `App.tsx` orchestration responsibilities
  - Extracted:
    - `hooks/useCardMediaDeletion.ts`
    - `hooks/useSubtitleTimelineHandlers.ts`
    - `hooks/useProjectUiState.ts`

- [x] Standardize hook boundaries
  - Rule: UI-only state in component; domain workflow in hooks/services
  - Added short docs in complex hooks

- [x] Reduce service/UI coupling in export path
  - `services/export.ts` now returns structured domain errors
  - UI layer decides user messaging

- [ ] Extract remaining video source selection workflow from `App.tsx`
  - File: `App.tsx` (`handleVideoUpload`, `handlePickVideo`)
  - Expected outcome: move to dedicated hook (e.g., `useVideoSourceActions`) for cleaner orchestration

---

## P1 - i18n and UX consistency

- [x] Replace remaining hardcoded English messages with i18n keys
  - Applied in `useAnkiSync`, `useProjectPersistence`, export notifications, delete-synced prompts

- [x] Normalize notification style
  - `showNotification` used consistently for non-confirm user feedback
  - `confirm(...)` retained only for destructive confirmation

---

## P2 - Test depth improvements

- [ ] Add tests for new orchestration hooks introduced in latest refactor
  - Files:
    - `hooks/useCardMediaDeletion.ts`
    - `hooks/useSubtitleTimelineHandlers.ts`
    - `hooks/useProjectUiState.ts`
  - Expected outcome: lock behavior after extraction and reduce regression risk

- [ ] Add focused tests for project reset sequencing
  - File: `hooks/useProjectReset.ts`
  - Scope: media cleanup order, async completion, and notification/reload behavior

- [x] Add tests for `useMediaExportActions`
- [x] Add regression tests for keyboard workflow hook
- [x] Add focused tests for store split logic

---

## P2 - Product polish and UX gaps

- [ ] Resolve inline product TODO in card item actions
  - File: `components/CardItem.tsx` (line with `// TODO add a play button to preview the audio`)
  - Expected outcome: provide audio preview control (or remove dead TODO with explicit decision)

---

## Suggested execution order

1. P0 project-reset async/notification fixes  
2. tests for new hooks + reset sequencing  
3. extract video source actions from `App.tsx`  
4. card-item audio preview TODO
