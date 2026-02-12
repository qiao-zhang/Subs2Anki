import React, {useEffect} from 'react';
import { useTranslation } from 'react-i18next';

interface ShortcutsCheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutsCheatSheetModal: React.FC<ShortcutsCheatSheetModalProps> = ({isOpen, onClose}) => {
  const { t } = useTranslation();
  const shortcuts = [
    {keys: ['/'], description: t("shortcuts.showHideCheatsheet", { defaultValue: "Show/Hide this cheatsheet" })},
    {keys: ['Space'], description: t("shortcuts.replayCurrentRegion", { defaultValue: "Replay the current region" })},
    {keys: ['P'], description: t("shortcuts.playPause", { defaultValue: "Play/Pause" })},
    {keys: ['↑', 'K'], description: t("shortcuts.previousSubtitle", { defaultValue: "Previous subtitle line" })},
    {keys: ['↓', 'J'], description: t("shortcuts.nextSubtitle", { defaultValue: "Next subtitle line" })},
    {keys: ['H'], description: t("shortcuts.hideUnhideRegions", { defaultValue: "Hide/Unhide the subtitle regions" })},
    {keys: ['V'], description: t("shortcuts.videoOnlyMode", { defaultValue: "Turn on/off the video-only mode" })},
    {keys: ['C'], description: t("shortcuts.createAnkiCard", { defaultValue: "Create Anki card for current subtitle line" })},
    {keys: ['I'], description: t("shortcuts.toggleStatus", { defaultValue: "Toggle status of current subtitle line" })},
    {keys: ['B'], description: t("shortcuts.breakUpLine", { defaultValue: "Break up current subtitle line into 2 new lines" })},
    {keys: ['M'], description: t("shortcuts.mergeLines", { defaultValue: "Merge selected subtitle lines" })},
    {keys: ['Ctrl + Z', 'U'], description: t("shortcuts.undoAction", { defaultValue: "Undo last action" })},
    {keys: ['Ctrl + Y', 'Ctrl + Shift + Z'], description: t("shortcuts.redoAction", { defaultValue: "Redo last undone action" })},
  ];

  // 处理ESC键关闭模态框
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-700"
        onClick={(e) => e.stopPropagation()} // 防止点击内容区域关闭模态框
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">{t("shortcuts.title", { defaultValue: "Shortcuts Cheatsheet" })}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label={t("modals.close")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            {shortcuts.map((item, index) => (
              <div key={index} className="flex items-start">
                <div className="flex items-center mr-6 min-w-[200px]">
                  {item.keys.map((key, keyIndex) => (
                    <React.Fragment key={keyIndex}>
                      <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 border border-gray-300 rounded dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                        {key}
                      </kbd>
                      {keyIndex < item.keys.length - 1 && (
                        <span className="mx-1 text-gray-500 dark:text-gray-400">{t("shortcuts.or")}</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <div className="text-sm text-gray-300 dark:text-gray-300 pt-1">
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsCheatSheetModal;