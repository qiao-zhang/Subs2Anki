/// <reference lib="dom" />
import React, {useState, useEffect} from 'react';
import {X, Save, Wifi, AlertCircle, CheckCircle2, ExternalLink} from 'lucide-react';
import {checkConnection} from '../../services/anki-connect.ts';

interface AnkiConnectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  onSave: (url: string) => void;
}

const AnkiConnectSettingsModal: React.FC<AnkiConnectSettingsModalProps> = ({isOpen, onClose, url, onSave}) => {
  const [localUrl, setLocalUrl] = useState(url);
  const [status, setStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalUrl(url);
      setStatus('idle');
      setErrorMsg('');
      // Auto-check on open
      handleCheckConnection(url).then();
    }
  }, [isOpen, url]);

  const handleCheckConnection = async (targetUrl: string) => {
    setStatus('checking');
    setErrorMsg('');
    try {
      const connected = await checkConnection(targetUrl);
      if (connected) {
        setStatus('connected');
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
    onSave(localUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">

        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <Wifi className="text-indigo-400" size={20}/> AnkiConnect Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-slate-500">AnkiConnect URL</label>
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
          <div className={`p-3 rounded-lg border text-sm flex items-start gap-3 ${
            status === 'connected' ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400' :
              status === 'error' ? 'bg-red-950/30 border-red-800 text-red-400' :
                'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            {status === 'checking' && <div
              className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent mt-0.5"/>}
            {status === 'connected' && <CheckCircle2 size={18} className="mt-0.5"/>}
            {status === 'error' && <AlertCircle size={18} className="mt-0.5"/>}

            <div className="flex-1">
              {status === 'idle' && "Click 'Test' to verify connection."}
              {status === 'checking' && "Connecting to Anki..."}
              {status === 'connected' && "Connected successfully! You can now sync cards."}
              {status === 'error' && (
                <div className="flex flex-col gap-1">
                  <span>{errorMsg}</span>
                  <span className="text-xs opacity-70">
                              Note: You may need to configure AnkiConnect to allow CORS.
                              Add <code>"webCorsOriginList": ["*"]</code> to the add-on config in Anki.
                          </span>
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Need help? <a href="https://foosoft.net/projects/anki-connect/" target="_blank" rel="noreferrer"
                          className="text-indigo-400 hover:underline inline-flex items-center gap-1">AnkiConnect
            Docs <ExternalLink size={10}/></a>
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
              <Save size={16}/> Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnkiConnectSettingsModal;
