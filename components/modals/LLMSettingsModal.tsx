/// <reference lib="dom" />
import React from 'react';
import { X, Bot, Save, Globe, Cpu, Zap } from 'lucide-react';
import { LLMSettings } from '@/services/gemini.ts';

interface LLMSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: LLMSettings;
  onSave: (settings: LLMSettings) => void;
}

const LLMSettingsModal: React.FC<LLMSettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = React.useState<LLMSettings>(settings);

  React.useEffect(() => {
    if (isOpen) setLocalSettings(settings);
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <Bot className="text-indigo-400" size={20} /> AI Model Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            {/* Provider Selection */}
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-slate-500 flex items-center gap-2">
                <Globe size={14} /> Provider
              </label>
              <select
                value={localSettings.provider}
                onChange={(e) => setLocalSettings({ ...localSettings, provider: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
              >
                <option value="gemini">Google Gemini (Recommended)</option>
                <option value="openai-compatible">OpenAI Compatible (Local/Custom)</option>
                <option value="chrome-ai">Chrome Built-in AI (Experimental)</option>
              </select>
            </div>

            {/* Model Name */}
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-slate-500 flex items-center gap-2">
                <Cpu size={14} /> Model Name
              </label>
              <input
                type="text"
                value={localSettings.model}
                onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value })}
                placeholder="e.g., gemini-3-flash-preview"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-mono"
              />
            </div>

            {/* Auto Analyze Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Zap size={14} className="text-amber-400" /> Auto-Analyze
                </span>
                <span className="text-[10px] text-slate-500">Analyze cards as soon as they are created</span>
              </div>
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, autoAnalyze: !localSettings.autoAnalyze })}
                className={`w-10 h-5 rounded-full transition-colors relative ${localSettings.autoAnalyze ? 'bg-indigo-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${localSettings.autoAnalyze ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 flex items-center gap-2"
            >
              <Save size={16} /> Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LLMSettingsModal;