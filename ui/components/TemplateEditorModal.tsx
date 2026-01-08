import React, { useState, useEffect } from 'react';
import { AnkiNoteType, AnkiFieldSource, AnkiCardTemplate } from '../../core/types';
import { X, Plus, Trash2, Layout, Type, Palette, GripVertical, Image as ImageIcon, Mic, Clock, BookOpen, Languages } from 'lucide-react';

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AnkiNoteType;
  onSave: (config: AnkiNoteType) => void;
}

const SOURCES: { type: AnkiFieldSource; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'Text', label: 'Text', icon: <Type size={14} />, color: 'bg-blue-600' },
  { type: 'Translation', label: 'Translation', icon: <Languages size={14} />, color: 'bg-emerald-600' },
  { type: 'Notes', label: 'Notes', icon: <BookOpen size={14} />, color: 'bg-amber-600' },
  { type: 'Image', label: 'Image', icon: <ImageIcon size={14} />, color: 'bg-purple-600' },
  { type: 'Audio', label: 'Audio', icon: <Mic size={14} />, color: 'bg-rose-600' },
  { type: 'Time', label: 'Time', icon: <Clock size={14} />, color: 'bg-slate-600' },
];

const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [activeTab, setActiveTab] = useState<'fields' | 'templates' | 'styling'>('fields');
  const [localConfig, setLocalConfig] = useState<AnkiNoteType>(config);
  const [draggingType, setDraggingType] = useState<AnkiFieldSource | null>(null);

  // Reset local state when config prop changes
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  if (!isOpen) return null;

  const handleAddField = () => {
    setLocalConfig(prev => ({
      ...prev,
      fields: [...prev.fields, { name: `Field ${prev.fields.length + 1}` }]
    }));
  };

  const handleRemoveField = (index: number) => {
    setLocalConfig(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const handleFieldNameChange = (index: number, val: string) => {
    const newFields = [...localConfig.fields];
    newFields[index].name = val;
    setLocalConfig(prev => ({ ...prev, fields: newFields }));
  };

  const handleFieldMapping = (index: number, source: AnkiFieldSource | undefined) => {
    const newFields = [...localConfig.fields];
    // Remove this source from any other field first (optional constraint: one-to-one or one-to-many? Anki usually allows one source to many fields, but user said "each Field most can correspond to one square", implying 1 field <- 1 source. But can 1 source go to multiple fields? Usually yes. )
    // Let's allow one source to be mapped to multiple fields, but one field only accepts one source.
    newFields[index].source = source;
    setLocalConfig(prev => ({ ...prev, fields: newFields }));
  }

  const handleTemplateChange = (index: number, key: keyof AnkiCardTemplate, val: string) => {
    const newTemplates = [...localConfig.templates];
    // @ts-ignore
    newTemplates[index][key] = val;
    setLocalConfig(prev => ({ ...prev, templates: newTemplates }));
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  // Drag Handlers
  const onDragStart = (e: React.DragEvent, type: AnkiFieldSource) => {
    setDraggingType(type);
    e.dataTransfer.effectAllowed = 'copy';
    // Transparent drag image or default
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggingType) {
      handleFieldMapping(index, draggingType);
      setDraggingType(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <Layout className="text-indigo-400" size={24} />
            Note Type Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-900">
          <button
            onClick={() => setActiveTab('fields')}
            className={`px-6 py-3 text-sm font-medium flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'fields' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Type size={16} /> Fields
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-6 py-3 text-sm font-medium flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'templates' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Layout size={16} /> Card Types
          </button>
          <button
            onClick={() => setActiveTab('styling')}
            className={`px-6 py-3 text-sm font-medium flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'styling' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Palette size={16} /> Styling
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900 flex flex-col">

          {/* FIELDS TAB */}
          {activeTab === 'fields' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-4 max-w-3xl mx-auto w-full overflow-y-auto pb-4">
                <p className="text-sm text-slate-400 mb-2">
                  Define your fields and map content by dragging the source blocks from the bottom onto the fields.
                </p>

                {localConfig.fields.map((field, idx) => (
                  <div key={idx} className="flex gap-4 items-center animate-in slide-in-from-left-2 duration-200 group">
                    <span className="text-slate-500 w-6 text-right font-mono text-sm pt-2">{idx + 1}.</span>

                    {/* Field Name Input */}
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Field Name</label>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => handleFieldNameChange(idx, e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Field Name"
                      />
                    </div>

                    {/* Mapping Drop Zone */}
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Mapped Content</label>
                      <div
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, idx)}
                        className={`h-[42px] border-2 border-dashed rounded flex items-center px-2 transition-colors ${
                          draggingType ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-slate-700 bg-slate-800/50'
                        }`}
                      >
                        {field.source ? (
                          <div className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-semibold text-white shadow-sm w-full justify-between ${
                            SOURCES.find(s => s.type === field.source)?.color || 'bg-slate-600'
                          }`}>
                            <div className="flex items-center gap-2">
                              {SOURCES.find(s => s.type === field.source)?.icon}
                              {field.source}
                            </div>
                            <button
                              onClick={() => handleFieldMapping(idx, undefined)}
                              className="hover:bg-black/20 rounded p-0.5"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs italic pl-2 pointer-events-none">Drop content here</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveField(idx)}
                      disabled={localConfig.fields.length <= 1}
                      className="mt-6 p-2 text-slate-500 hover:text-red-400 disabled:opacity-30 transition-colors"
                      title="Remove Field"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={handleAddField}
                  className="mt-2 flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-semibold px-2"
                >
                  <Plus size={16} /> Add Field
                </button>
              </div>

              {/* Source Palette */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <h4 className="text-xs uppercase font-bold text-slate-400 mb-3 flex items-center gap-2">
                  <GripVertical size={14} /> Draggable Content Sources
                </h4>
                <div className="flex flex-wrap gap-3 select-none">
                  {SOURCES.map((src) => (
                    <div
                      key={src.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, src.type)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white shadow cursor-grab active:cursor-grabbing hover:scale-105 transition-transform ${src.color}`}
                    >
                      {src.icon}
                      {src.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATES TAB */}
          {activeTab === 'templates' && (
            <div className="space-y-8 h-full flex flex-col">
              {localConfig.templates.map((tpl, idx) => (
                <div key={idx} className="flex flex-col gap-4 flex-1">
                  <div className="grid grid-cols-2 gap-4 h-full">
                    <div className="flex flex-col gap-2 h-full">
                      <label className="text-xs uppercase font-bold text-slate-500">Front Template</label>
                      <textarea
                        value={tpl.Front}
                        onChange={(e) => handleTemplateChange(idx, 'Front', e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded p-3 text-sm font-mono text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        spellCheck={false}
                      />
                    </div>
                    <div className="flex flex-col gap-2 h-full">
                      <label className="text-xs uppercase font-bold text-slate-500">Back Template</label>
                      <textarea
                        value={tpl.Back}
                        onChange={(e) => handleTemplateChange(idx, 'Back', e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded p-3 text-sm font-mono text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded border border-slate-700 text-xs text-slate-400">
                    Tip: Use <code className="text-indigo-400">{'{{Field Name}}'}</code> to insert fields.
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STYLING TAB */}
          {activeTab === 'styling' && (
            <div className="flex flex-col h-full gap-2">
              <label className="text-xs uppercase font-bold text-slate-500">Card Styling (CSS)</label>
              <textarea
                value={localConfig.css}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, css: e.target.value }))}
                className="flex-1 bg-slate-800 border border-slate-700 rounded p-3 text-sm font-mono text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                spellCheck={false}
              />
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
          >
            Save & Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default TemplateEditorModal;