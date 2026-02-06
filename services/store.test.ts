import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '../services/store';
import { create } from 'zustand';
import { SubtitleLine } from '../services/types';

// Create a test version of the store
const createStore = () => create(useAppStore);

describe('Store Grouping Functions', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('should group subtitles correctly', () => {
    const initialState = {
      subtitleLines: [
        { id: 1, startTime: 0, endTime: 2, text: 'Subtitle 1', status: 'normal' },
        { id: 2, startTime: 3, endTime: 5, text: 'Subtitle 2', status: 'normal' },
        { id: 3, startTime: 6, endTime: 8, text: 'Subtitle 3', status: 'normal' },
      ] as SubtitleLine[],
      hasUnsavedChanges: false,
    };

    // Apply initial state to the store
    store.setState(initialState);

    // Group subtitles with IDs 1 and 2
    store.getState().groupSubtitles([1, 2]);

    const updatedState = store.getState();
    const groupedSubtitles = updatedState.subtitleLines.filter(sub => sub.groupId);

    // Verify that exactly 2 subtitles were grouped
    expect(groupedSubtitles.length).toBe(2);

    // Verify that the grouped subtitles have the same group ID
    const groupIds = new Set(groupedSubtitles.map(sub => sub.groupId));
    expect(groupIds.size).toBe(1);

    // Verify prev/next relationships
    const sub1 = updatedState.subtitleLines.find(sub => sub.id === 1);
    const sub2 = updatedState.subtitleLines.find(sub => sub.id === 2);

    // Sub 1 should have no prev but should have sub 2 as next
    expect(sub1?.prevText).toBeUndefined();
    expect(sub1?.nextText).toBe('Subtitle 2');

    // Sub 2 should have sub 1 as prev but no next
    expect(sub2?.prevText).toBe('Subtitle 1');
    expect(sub2?.nextText).toBeUndefined();
  });

  it('should not group if less than 2 subtitles are selected', () => {
    const initialState = {
      subtitleLines: [
        { id: 1, startTime: 0, endTime: 2, text: 'Subtitle 1', status: 'normal' },
      ] as SubtitleLine[],
      hasUnsavedChanges: false,
    };

    store.setState(initialState);

    // Try to group only 1 subtitle
    store.getState().groupSubtitles([1]);

    const updatedState = store.getState();
    const groupedSubtitles = updatedState.subtitleLines.filter(sub => sub.groupId);

    // No subtitles should be grouped
    expect(groupedSubtitles.length).toBe(0);
  });

  it('should ungroup subtitles correctly', () => {
    const initialState = {
      subtitleLines: [
        { id: 1, startTime: 0, endTime: 2, text: 'Subtitle 1', status: 'normal', groupId: 'test-group', prevText: undefined, nextText: 'Subtitle 2' },
        { id: 2, startTime: 3, endTime: 5, text: 'Subtitle 2', status: 'normal', groupId: 'test-group', prevText: 'Subtitle 1', nextText: undefined },
        { id: 3, startTime: 6, endTime: 8, text: 'Subtitle 3', status: 'normal' },
      ] as SubtitleLine[],
      hasUnsavedChanges: false,
    };

    store.setState(initialState);

    // Ungroup the subtitles
    const groupId = initialState.subtitleLines[0].groupId as string;
    store.getState().ungroupSubtitles(groupId);

    const updatedState = store.getState();
    const groupedSubtitles = updatedState.subtitleLines.filter(sub => sub.groupId);

    // No subtitles should remain grouped
    expect(groupedSubtitles.length).toBe(0);

    // Verify that prev/next relationships were removed
    const sub1 = updatedState.subtitleLines.find(sub => sub.id === 1);
    const sub2 = updatedState.subtitleLines.find(sub => sub.id === 2);

    expect(sub1?.groupId).toBeUndefined();
    expect(sub1?.prevText).toBeUndefined();
    expect(sub1?.nextText).toBeUndefined();

    expect(sub2?.groupId).toBeUndefined();
    expect(sub2?.prevText).toBeUndefined();
    expect(sub2?.nextText).toBeUndefined();
  });

  it('should sort subtitles by start time when grouping', () => {
    const initialState = {
      subtitleLines: [
        { id: 3, startTime: 6, endTime: 8, text: 'Subtitle 3', status: 'normal' },
        { id: 1, startTime: 0, endTime: 2, text: 'Subtitle 1', status: 'normal' },
        { id: 2, startTime: 3, endTime: 5, text: 'Subtitle 2', status: 'normal' },
      ] as SubtitleLine[],
      hasUnsavedChanges: false,
    };

    store.setState(initialState);

    // Group all three subtitles (order in array shouldn't matter)
    store.getState().groupSubtitles([3, 1, 2]);

    const updatedState = store.getState();
    const groupedSubtitles = updatedState.subtitleLines.filter(sub => sub.groupId);

    // Verify that exactly 3 subtitles were grouped
    expect(groupedSubtitles.length).toBe(3);

    // Find the grouped subtitles in order of start time
    const orderedSubtitles = [...groupedSubtitles].sort((a, b) => a.startTime - b.startTime);

    // Verify prev/next relationships based on start time order
    expect(orderedSubtitles[0].id).toBe(1); // earliest start time
    expect(orderedSubtitles[1].id).toBe(2);
    expect(orderedSubtitles[2].id).toBe(3); // latest start time

    // Check relationships
    expect(orderedSubtitles[0].prevText).toBeUndefined(); // First subtitle has no prev
    expect(orderedSubtitles[0].nextText).toBe('Subtitle 2'); // Points to second

    expect(orderedSubtitles[1].prevText).toBe('Subtitle 1'); // Points to first
    expect(orderedSubtitles[1].nextText).toBe('Subtitle 3'); // Points to third

    expect(orderedSubtitles[2].prevText).toBe('Subtitle 2'); // Points to second
    expect(orderedSubtitles[2].nextText).toBeUndefined(); // Last subtitle has no next
  });
});

describe('Store Undo/Redo for Grouping Operations', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('should support undo/redo for grouping operations', () => {
    const initialState = {
      subtitleLines: [
        { id: 1, startTime: 0, endTime: 2, text: 'Subtitle 1', status: 'normal' },
        { id: 2, startTime: 3, endTime: 5, text: 'Subtitle 2', status: 'normal' },
      ] as SubtitleLine[],
      hasUnsavedChanges: false,
    };

    store.setState(initialState);

    // Group subtitles
    store.getState().groupSubtitles([1, 2]);
    const afterGrouping = store.getState().subtitleLines.filter(sub => sub.groupId).length;
    expect(afterGrouping).toBe(2);

    // Verify can undo
    expect(store.getState().canUndo()).toBe(true);

    // Undo the grouping
    store.getState().undo();
    const afterUndo = store.getState().subtitleLines.filter(sub => sub.groupId).length;
    expect(afterUndo).toBe(0);

    // Verify can redo
    expect(store.getState().canRedo()).toBe(true);

    // Redo the grouping
    store.getState().redo();
    const afterRedo = store.getState().subtitleLines.filter(sub => sub.groupId).length;
    expect(afterRedo).toBe(2);
  });
});