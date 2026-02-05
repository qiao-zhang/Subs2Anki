import React, { useState, KeyboardEvent } from 'react';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
}

const TagInput: React.FC<TagInputProps> = ({ tags, onTagsChange, placeholder = "Add a tag..." }) => {
  const [inputValue, setInputValue] = useState<string>('');

  const addTag = (tag: string) => {
    const tagTrimmed = tag.trim();
    if (tagTrimmed && !tags.includes(tagTrimmed)) {
      onTagsChange([...tags, tagTrimmed]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-2 min-h-10">
        {tags.map((tag) => (
          <div 
            key={tag} 
            className="inline-flex items-center gap-1 bg-indigo-600/20 text-indigo-300 px-2 py-1 rounded text-sm"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-indigo-400 hover:text-white"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
      />
      <p className="text-xs text-slate-500 mt-1">
        Press Enter or comma (,) to add a tag
      </p>
    </div>
  );
};

export default TagInput;