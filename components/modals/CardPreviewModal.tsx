/// <reference lib="dom" />
import React, {useEffect, useState} from 'react';
import {X, Loader2} from 'lucide-react';
import {AnkiCard, AnkiNoteType} from '@/services/types.ts';
import {useAppStore} from '@/services/store.ts';
import {getMedia} from '@/services/db.ts';

interface CardPreviewModalProps {
  isOpen: boolean;
  card: AnkiCard | null;
  onClose: () => void;
}

const CardPreviewModal: React.FC<CardPreviewModalProps> = ({isOpen, card, onClose}) => {
  const {ankiConfig} = useAppStore();

  // Loaded Media State
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [screenshotData, setScreenshotData] = useState<string | null>(null);

  const [isBackSide, setIsBackSide] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');

  // Async load all media from DB when modal opens
  useEffect(() => {
    let active = true;
    if (isOpen && card) {
      // Load Audio
      if (card.audioRef) {
        getMedia(card.audioRef).then(blob => {
          if (active && blob && blob instanceof Blob) {
            setAudioUrl(URL.createObjectURL(blob));
          }
        });
      }

      // Load Screenshot
      if (card.screenshotRef) {
        getMedia(card.screenshotRef).then(data => {
          if (active && data && typeof data === 'string') {
            setScreenshotData(data);
          }
        });
      }

    } else {
      setAudioUrl(null);
      setScreenshotData(null);
    }
    return () => {
      active = false;
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [isOpen, card?.id, card?.audioRef, card?.screenshotRef]);

  // Reset side when card changes
  useEffect(() => {
    if (isOpen) {
      setIsBackSide(false);
    }
  }, [isOpen, card?.id]);

  // Generate HTML when dependencies change
  useEffect(() => {
    if (!isOpen || !card) return;

    // We pass the loaded data (screenshotData) instead of raw refs
    const content = generatePreviewHtml(
      card,
      ankiConfig,
      isBackSide,
      audioUrl,
      screenshotData,
    );
    setHtmlContent(content);

  }, [isOpen, card, ankiConfig, isBackSide, audioUrl, screenshotData]);

  if (!isOpen || !card) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white">Card Preview</h2>
            <div className="flex flex-col gap-1 text-xs text-slate-400">
              {(card.audioStatus === 'processing' || card.audioStatus === 'pending') && (
                <span className="flex items-center gap-1 text-indigo-400"><Loader2 size={12} className="animate-spin"/> Audio Processing...</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={20}/>
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-slate-800/50 p-2 border-b border-slate-700 flex justify-center items-center">
          {/* Segmented Toggle Switch */}
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-700 inline-flex relative">
            {/* Sliding Background */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-slate-700 rounded-md transition-all duration-300 ease-out shadow-sm border border-slate-600 ${isBackSide ? 'left-[calc(50%)]' : 'left-1'}`}
            />

            <button
              onClick={() => setIsBackSide(false)}
              className={`relative z-10 px-8 py-1.5 text-sm font-medium transition-colors duration-200 rounded-md ${!isBackSide ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Front
            </button>
            <button
              onClick={() => setIsBackSide(true)}
              className={`relative z-10 px-8 py-1.5 text-sm font-medium transition-colors duration-200 rounded-md ${isBackSide ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Back
            </button>
          </div>
        </div>

        {/* Iframe Container */}
        <div className="flex-1 bg-white relative">
          <iframe
            title="Card Preview"
            srcDoc={htmlContent}
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>

      </div>
    </div>
  );
};

// --- Helper Functions for HTML Generation ---

const generatePreviewHtml = (
  card: AnkiCard,
  config: AnkiNoteType,
  isBack: boolean,
  audioUrl: string | null,
  screenshotData: string | null,
): string => {
  // 1. Prepare Field Data Map
  const fieldMap: Record<string, string> = {};

  // Decide Media Source based on loaded data
  let mediaHtml = '';
  mediaHtml = screenshotData ? `<img src="${screenshotData}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" />` : '';

  config.fields.forEach(field => {
    let value = '';

    if (field.source) {
      switch (field.source) {
        case 'Text':
          value = card.text;
          break;
        case 'Translation':
          value = card.translation;
          break;
        case 'Notes':
          value = card.notes;
          break;
        case 'Furigana':
          value = card.furigana || card.text;
          break;
        case 'Image':
          value = mediaHtml;
          break;
        case 'Audio':
          value = audioUrl ? `<div style="text-align:center; margin: 5px;"><audio controls src="${audioUrl}" style="height: 30px;"></audio></div>` : '(Audio Pending)';
          break;
        case 'Time':
          value = card.timestampStr;
          break;
        case 'Sequence':
          value = audioUrl ? audioUrl.split('/').pop() || '' : '';
          break;
        default:
          value = '';
      }
    }

    fieldMap[field.name] = value;
  });

  // 2. Render Template
  const templateObj = config.templates[0];
  const frontHtml = renderTemplateString(templateObj.Front, fieldMap);

  let rawHtml: string;
  if (isBack) {
    rawHtml = renderTemplateString(templateObj.Back, fieldMap);
    rawHtml = rawHtml.replace(/{{FrontSide}}/g, frontHtml);
  } else {
    rawHtml = frontHtml;
  }

  // 3. Construct Full HTML Document
  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            margin: 0; 
            padding: 20px; 
            font-family: system-ui, -apple-system, sans-serif;
            background-color: #f1f5f9; 
            display: flex;
            justify-content: center;
            min-height: 100vh;
          }
          .card-container {
            width: 100%;
            max-width: 600px;
            background: white; 
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            border-radius: 8px;
            padding: 20px;
            overflow: hidden;
          }
          ${config.css}
          .card { 
             min-height: 200px;
          }
          img {
            max-width: 100%;
          }
        </style>
      </head>
      <body>
        <div class="card">
           ${rawHtml}
        </div>
      </body>
      </html>
    `;
};

const renderTemplateString = (template: string, fields: Record<string, string>): string => {
  let result = template;
  Object.keys(fields).forEach(key => {
    const value = fields[key];
    const regex = new RegExp(`{{#${key}}}([\\s\\S]*?){{/${key}}}`, 'gm');
    result = result.replace(regex, (_match, innerContent) => {
      return value && value.trim() !== '' ? innerContent : '';
    });
    const regexInverted = new RegExp(`{{^${key}}}([\\s\\S]*?){{/${key}}}`, 'gm');
    result = result.replace(regexInverted, (_match, innerContent) => {
      return (!value || value.trim() === '') ? innerContent : '';
    });
  });
  Object.keys(fields).forEach(key => {
    const value = fields[key];
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    result = result.replace(new RegExp(`{{[^}:]+:${key}}}`, 'g'), value);
  });
  return result;
};

export default CardPreviewModal;
