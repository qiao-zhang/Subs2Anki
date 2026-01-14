
/// <reference lib="dom" />
import React, { useEffect, useState } from 'react';
import { AnkiCard, AnkiNoteType } from '../../core/types';
import { X, RotateCw, Loader2, Image as ImageIcon, Film } from 'lucide-react';
import { useAppStore } from '../../core/store';
import { getMedia } from '../../core/db';

interface CardPreviewModalProps {
  isOpen: boolean;
  card: AnkiCard | null;
  onClose: () => void;
}

const CardPreviewModal: React.FC<CardPreviewModalProps> = ({ isOpen, card, onClose }) => {
  const { ankiConfig, updateCard } = useAppStore();

  // Loaded Media State
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [gifData, setGifData] = useState<string | null>(null);

  const [isBackSide, setIsBackSide] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');

  // Local state for media toggle, synced with card.preferredMediaType
  const isGif = card?.preferredMediaType === 'gif';

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

      // Load GIF
      if (card.gifRef) {
        getMedia(card.gifRef).then(data => {
          if (active && data && typeof data === 'string') {
            setGifData(data);
          }
        });
      }
    } else {
      setAudioUrl(null);
      setScreenshotData(null);
      setGifData(null);
    }
    return () => {
      active = false;
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [isOpen, card?.id, card?.audioRef, card?.screenshotRef, card?.gifRef]);

  // Reset side when card changes
  useEffect(() => {
    if (isOpen) {
      setIsBackSide(false);
    }
  }, [isOpen, card?.id]);

  // Request GIF generation if selected but missing
  useEffect(() => {
    if (isOpen && card && isGif && !card.gifRef && !card.gifStatus) {
      // Trigger generation by setting status to pending
      updateCard(card.id, { gifStatus: 'pending', preferredMediaType: 'gif' });
    }
  }, [isOpen, card, isGif]);

  // Generate HTML when dependencies change
  useEffect(() => {
    if (!isOpen || !card) return;

    // We pass the loaded data (screenshotData/gifData) instead of raw refs
    const content = generatePreviewHtml(
      card,
      ankiConfig,
      isBackSide,
      audioUrl,
      isGif,
      screenshotData,
      gifData
    );
    setHtmlContent(content);

  }, [isOpen, card, ankiConfig, isBackSide, audioUrl, isGif, screenshotData, gifData]);

  const toggleMediaType = (type: 'image' | 'gif') => {
    if (!card) return;
    updateCard(card.id, { preferredMediaType: type });
    if (type === 'gif' && !card.gifRef && !card.gifStatus) {
      updateCard(card.id, { gifStatus: 'pending' });
    }
  };

  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white">Card Preview</h2>
            <div className="flex flex-col gap-1 text-xs text-slate-400">
              {(card.audioStatus === 'processing' || card.audioStatus === 'pending') && (
                <span className="flex items-center gap-1 text-indigo-400"><Loader2 size={12} className="animate-spin"/> Audio Processing...</span>
              )}
              {isGif && (card.gifStatus === 'processing' || card.gifStatus === 'pending') && (
                <span className="flex items-center gap-1 text-purple-400"><Loader2 size={12} className="animate-spin"/> GIF Generating...</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-slate-800/50 p-2 border-b border-slate-700 flex justify-between items-center px-6">

          {/* Media Type Switch */}
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => toggleMediaType('image')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition ${!isGif ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <ImageIcon size={14} /> Image
            </button>
            <button
              onClick={() => toggleMediaType('gif')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mediumyb transition ${isGif ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Film size={14} /> GIF
            </button>
          </div>

          {/* Side Toggle */}
          <button
            onClick={() => setIsBackSide(!isBackSide)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition font-medium text-sm border border-slate-600"
          >
            <RotateCw size={16} />
            {isBackSide ? "Show Front" : "Show Back"}
          </button>

          <div className="w-[120px]"></div> {/* Spacer for alignment */}
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
  useGif: boolean,
  screenshotData: string | null,
  gifData: string | null
): string => {
  // 1. Prepare Field Data Map
  const fieldMap: Record<string, string> = {};

  // Decide Media Source based on loaded data
  let mediaHtml = '';
  if (useGif) {
    if (gifData) {
      mediaHtml = `<img src="${gifData}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" />`;
    } else {
      mediaHtml = `<div style="padding: 20px; text-align: center; color: #666; background: #f0f0f0; border-radius: 4px;">GIF Generating...</div>`;
    }
  } else {
    mediaHtml = screenshotData ? `<img src="${screenshotData}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" />` : '';
  }

  config.fields.forEach(field => {
    let value = '';

    if (field.source) {
      switch (field.source) {
        case 'Text': value = card.text; break;
        case 'Translation': value = card.translation; break;
        case 'Notes': value = card.notes; break;
        case 'Furigana': value = card.furigana || card.text; break;
        case 'Image': value = mediaHtml; break;
        case 'Audio': value = audioUrl ? `<div style="text-align:center; margin: 5px;"><audio controls src="${audioUrl}" style="height: 30px;"></audio></div>` : '(Audio Pending)'; break;
        case 'Time': value = card.timestampStr; break;
        case 'Sequence': value = card.timestampStr; break;
        default: value = '';
      }
    }

    fieldMap[field.name] = value;
  });

  // 2. Render Template
  const templateObj = config.templates[0];
  const frontHtml = renderTemplateString(templateObj.Front, fieldMap);

  let rawHtml = '';
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
    result = result.replace(regex, (match, innerContent) => {
      return value && value.trim() !== '' ? innerContent : '';
    });
    const regexInverted = new RegExp(`{{^${key}}}([\\s\\S]*?){{/${key}}}`, 'gm');
    result = result.replace(regexInverted, (match, innerContent) => {
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
