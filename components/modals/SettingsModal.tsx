import React, {useState} from 'react';
import {X, Save, Wifi, AlertCircle, CheckCircle2} from 'lucide-react';
import {checkConnection} from '@/services/anki-connect.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ankiConnectUrl: string;
  onSaveAnkiConnectUrl: (url: string) => void;
  autoDeleteSynced: boolean;
  onAutoDeleteSyncedChange: (checked: boolean) => void;
  bulkCreateLimit: number;
  onBulkCreateLimitChange: (limit: number) => void;
  showBulkCreateButton: boolean;
  onShowBulkCreateButtonChange: (checked: boolean) => void;
  audioVolume: number;
  onAudioVolumeChange: (volume: number) => void;
  onTestSuccess?: () => void; // 回调函数，在测试连接成功时调用
}

const SettingsModal: React.FC<SettingsModalProps> = ({
                                                       isOpen,
                                                       onClose,
                                                       ankiConnectUrl,
                                                       onSaveAnkiConnectUrl,
                                                       autoDeleteSynced,
                                                       onAutoDeleteSyncedChange,
                                                       bulkCreateLimit,
                                                       onBulkCreateLimitChange,
                                                       showBulkCreateButton,
                                                       onShowBulkCreateButtonChange,
  audioVolume,
  onAudioVolumeChange,
                                                       onTestSuccess
                                                     }) => {
  const [localUrl, setLocalUrl] = useState(ankiConnectUrl);
  const [status, setStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [localBulkCreateLimit, setLocalBulkCreateLimit] = useState(bulkCreateLimit);
  const [localAutoDeleteSynced, setLocalAutoDeleteSynced] = useState(autoDeleteSynced);
  const [localShowBulkCreateButton, setLocalShowBulkCreateButton] = useState(showBulkCreateButton);
  const [localAudioVolume, setLocalAudioVolume] = useState(audioVolume);

  // 检查输入的限制值是否有效
  const isValidLimit = localBulkCreateLimit >= 1 && localBulkCreateLimit <= 50;

  const handleCheckConnection = async (targetUrl: string) => {
    setStatus('checking');
    setErrorMsg('');
    try {
      const connected = await checkConnection(targetUrl);
      if (connected) {
        setStatus('connected');
        // 如果提供了测试成功回调，则调用它
        if (onTestSuccess) {
          onTestSuccess();
        }
      } else {
        setStatus('error');
        setErrorMsg('Could not connect. Is Anki running with AnkiConnect installed?');
      }
    } catch (e) {
      setStatus('error');
      setErrorMsg((e as Error).message);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 验证输入的有效性
    if (!isValidLimit) {
      alert('Bulk create limit must be between 1 and 50');
      return;
    }

    // 保存所有设置
    onSaveAnkiConnectUrl(localUrl);
    onAutoDeleteSyncedChange(localAutoDeleteSynced);
    onBulkCreateLimitChange(localBulkCreateLimit);
    onShowBulkCreateButtonChange(localShowBulkCreateButton);
    onAudioVolumeChange(localAudioVolume);

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-12">
            {/* Left Column - AnkiConnect and Sync Settings */}
            <div className="space-y-5">
              {/* AnkiConnect Settings Section */}
              <div className="space-y-4">
                <h3 className="text-md font-bold flex items-center gap-2 text-slate-300">
                  <Wifi className="text-indigo-400" size={16}/> AnkiConnect
                </h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">AnkiConnect URL</label>
                  {/*<label className="text-xs uppercase font-bold text-slate-500">AnkiConnect URL</label>*/}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={localUrl}
                      onChange={(e) => setLocalUrl(e.target.value)}
                      placeholder="http://127.0.0.1:8765"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleCheckConnection(localUrl)}
                      className="px-3 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition"
                    >
                      Test
                    </button>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className={`p-2 rounded-lg border text-xs flex items-start gap-2 ${
                  status === 'connected' ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400' :
                    status === 'error' ? 'bg-red-950/30 border-red-800 text-red-400' :
                      'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                  {status === 'checking' && <div
                    className="animate-spin rounded-full h-3 w-3 border-2 border-indigo-500 border-t-transparent mt-0.5"/>}
                  {status === 'connected' && <CheckCircle2 size={14} className="mt-0.5"/>}
                  {status === 'error' && <AlertCircle size={14} className="mt-0.5"/>}

                  <div className="flex-1">
                    {status === 'idle' && "Click 'Test' to verify connection."}
                    {status === 'checking' && "Connecting to Anki..."}
                    {status === 'connected' && "Connected successfully!"}
                    {status === 'error' && errorMsg}
                  </div>
                </div>

                <div className="text-xs text-slate-500 pt-1">
                  Need help? <a href="https://foosoft.net/projects/anki-connect/" target="_blank" rel="noreferrer"
                                className="text-indigo-400 hover:underline">Docs</a>
                </div>
              </div>

              {/* Sync Settings Section */}
              <div className="space-y-4">
                <h3 className="text-md font-bold flex items-center gap-2 text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s7-4 7-10V5l-7-3-7 3v7c0 6 7 10 7 10z"></path>
                  </svg>
                  Sync Settings
                </h3>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-slate-300">Delete card after synced</label>
                    <p className="text-xs text-slate-500">Automatically delete after sync</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localAutoDeleteSynced}
                      onChange={(e) => setLocalAutoDeleteSynced(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div
                      className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - Bulk Creation and UI Settings */}
            <div className="space-y-5">
              {/* Bulk Creation Settings Section */}
              <div className="space-y-4">
                <h3 className="text-md font-bold flex items-center gap-2 text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                  Bulk Creation
                </h3>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-slate-300">Show Bulk Create Button</label>
                    <p className="text-xs text-slate-500">Display in subtitle column</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localShowBulkCreateButton}
                      onChange={(e) => setLocalShowBulkCreateButton(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div
                      className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Max Cards Per Bulk Operation</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={localBulkCreateLimit}
                      onChange={(e) => setLocalBulkCreateLimit(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm"
                    />
                    <span className="text-sm text-slate-400">cards (max 50)</span>
                    {!isValidLimit && (
                      <span className="text-xs text-red-400">Invalid</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Limit to prevent memory issues</p>
                </div>



              </div>
              <div className="space-y-4">
                <h3 className="text-md font-bold flex items-center gap-2 text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                  Audio Volume
                </h3>
                {/* Audio Volume Control */}
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <input
                      type="range"
                      min="0.1"
                      max="5"
                      step="0.1"
                      value={localAudioVolume}
                      onChange={(e) => setLocalAudioVolume(parseFloat(e.target.value))}
                      className="w-full bg-slate-700 accent-indigo-500 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-slate-400 w-12">{localAudioVolume.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-slate-500">Adjust volume of generated audio clips (1.0 = normal)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-800 mt-6">
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
              disabled={!isValidLimit}
            >
              <Save size={16}/> Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;