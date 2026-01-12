
/// <reference lib="dom" />
import React, { useEffect, useRef, useState } from 'react';
import { AnkiCard, AnkiNoteType } from '../../core/types';
import { X, RotateCw, Loader2, FileAudio } from 'lucide-react';
import { useAppStore } from '../../core/store';

interface CardPreviewModalProps {
  isOpen: boolean;
  card: AnkiCard | null;
  onClose: () => void;
}

const CardPreviewModal: React.FC<CardPreviewModalProps> = ({ isOpen, card, onClose }) => {
  const { ankiConfig } = useAppStore();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isBackSide, setIsBackSide] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');

  // Manage Audio URL
  useEffect(() => {
    if (isOpen && card?.audioBlob) {
      const url = URL.createObjectURL(card.audioBlob);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAudioUrl(null);
    }
  }, [isOpen, card?.audioBlob]);

  // Reset side when card changes
  useEffect(() => {
    if (isOpen) {
      setIsBackSide(false);
    }
  }, [isOpen, card?.id]);

  // Generate HTML when dependencies change
  useEffect(() => {
    if (!isOpen || !card) return;

    const content = generatePreviewHtml(card, ankiConfig, isBackSide, audioUrl);
    setHtmlContent(content);

  }, [isOpen, card, ankiConfig, isBackSide, audioUrl]);

  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white">Card Preview</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {card.audioStatus === 'processing' && <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> Processing Audio</span>}
              {card.audioStatus === 'pending' && <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> Waiting for Audio</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-slate-800/50 p-2 border-b border-slate-700 flex justify-center">
          <button
            onClick={() => setIsBackSide(!isBackSide)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-medium text-sm"
          >
            <RotateCw size={16} />
            {isBackSide ? "Show Front" : "Show Back"}
          </button>
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
  audioUrl: string | null
): string => {
  // 1. Prepare Field Data Map
  const fieldMap: Record<string, string> = {};

  config.fields.forEach(field => {
    let value = '';

    // Match source to card data
    if (field.source) {
      switch (field.source) {
        case 'Text': value = card.text; break;
        case 'Translation': value = card.translation; break;
        case 'Notes': value = card.notes; break;
        // For images, we ensure they fit within the card
        case 'Image': value = card.screenshotDataUrl ? `<img src="${card.screenshotDataUrl}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" />` : ''; break;
        // For audio, we use an HTML audio element.
        // We use a small inline player or just the element.
        // Note: Anki usually uses [sound:file.mp3].
        case 'Audio': value = audioUrl ? `<div style="text-align:center; margin: 5px;"><audio controls src="${audioUrl}" style="height: 30px;"></audio></div>` : '(Audio Pending)'; break;
        case 'Time': value = card.timestampStr; break;
        case 'Sequence': value = card.timestampStr; break;
        // Context fields (Before/After) are usually empty in this app currently,
        // but if we had them in 'card', we'd map them here.
        default: value = '';
      }
    }

    fieldMap[field.name] = value;
  });

  // 2. Render Template
  const templateObj = config.templates[0]; // Assuming single card type for now

  // We first render the Front side because Back side might reference {{FrontSide}}
  const frontHtml = renderTemplateString(templateObj.Front, fieldMap);

  let rawHtml = '';
  if (isBack) {
    rawHtml = renderTemplateString(templateObj.Back, fieldMap);
    // Handle special {{FrontSide}} field
    rawHtml = rawHtml.replace(/{{FrontSide}}/g, frontHtml);
  } else {
    rawHtml = frontHtml;
  }

  // 3. Construct Full HTML Document
  // We inject the user's CSS and some base styles to make it look good in the iframe.
  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          /* Base Reset for Preview */
          body { 
            margin: 0; 
            padding: 20px; 
            font-family: system-ui, -apple-system, sans-serif;
            background-color: #f1f5f9; /* Slate-100 */
            display: flex;
            justify-content: center;
            min-height: 100vh;
          }
          
          /* Card Container to simulate Anki's viewport */
          .card-container {
            width: 100%;
            max-width: 600px;
            background: white; /* Default background if card css is transparent */
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            border-radius: 8px;
            padding: 20px;
            overflow: hidden;
          }

          /* User Provided CSS */
          ${config.css}
          
          /* Overrides to ensure visibility if user CSS expects dark mode or specific backgrounds */
          .card { 
             /* Ensure the .card class (standard in Anki) takes up space */
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
        <script>
            // Simple script to auto-play audio if present on slide change (simulating Anki)
            // Only if it's the back side or if we want auto-play behavior
            const audios = document.querySelectorAll('audio');
            // If there is audio and it's not playing, maybe try? 
            // Browsers might block it without interaction.
        </script>
      </body>
      </html>
    `;
};

/**
 * Replaces Mustache-style placeholders in a template string with values.
 * Supports:
 * - {{Field}}
 * - {{#Field}}...{{/Field}} (Conditional existence)
 * - {{furigana:Field}} (Stripped to just Field value for this preview)
 */
const renderTemplateString = (template: string, fields: Record<string, string>): string => {
  let result = template;

  // 1. Handle Conditionals {{#Field}}...{{/Field}}
  // We simply check if the field is present and non-empty.
  // Note: This regex is non-recursive and simple.
  Object.keys(fields).forEach(key => {
    const value = fields[key];
    const regex = new RegExp(`{{#${key}}}([\\s\\S]*?){{/${key}}}`, 'gm');

    result = result.replace(regex, (match, innerContent) => {
      return value && value.trim() !== '' ? innerContent : '';
    });

    // Handle inverted section {{^Field}}...{{/Field}} (if empty)
    const regexInverted = new RegExp(`{{^${key}}}([\\s\\S]*?){{/${key}}}`, 'gm');
    result = result.replace(regexInverted, (match, innerContent) => {
      return (!value || value.trim() === '') ? innerContent : '';
    });
  });

  // 2. Handle Simple Replacements {{Field}} and {{furigana:Field}}
  Object.keys(fields).forEach(key => {
    const value = fields[key];

    // Standard
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);

    // Filter stripping (e.g. furigana:, hint:)
    // We match {{Something:Key}}
    result = result.replace(new RegExp(`{{[^}:]+:${key}}}`, 'g'), value);
  });

  // Cleanup: Remove any remaining {{tags}} that weren't matched (optional, usually Anki leaves them or shows error)
  // For a cleaner preview, we can strip them or leave them to indicate missing data.
  // Let's leave them for debugging purposes if the user made a typo in the template.

  return result;
};

export default CardPreviewModal;
