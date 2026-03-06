import React, { useState, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  availableTags?: string[];
}

const TagInput: React.FC<TagInputProps> = ({ tags, onTagsChange, placeholder, availableTags = [] }) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // Filter available tags that match the current input
  const filteredTags = availableTags
    .filter(tag => 
      tag.toLowerCase().includes(inputValue.toLowerCase()) && 
      !tags.includes(tag)
    )
    .slice(0, 10); // Limit to 10 suggestions

  const addTag = (tag: string) => {
    const tagTrimmed = tag.trim();
    if (tagTrimmed && !tags.includes(tagTrimmed)) {
      onTagsChange([...tags, tagTrimmed]);
      setInputValue('');
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (selectedIndex >= 0 && filteredTags[selectedIndex]) {
        addTag(filteredTags[selectedIndex]);
      } else {
        addTag(inputValue);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredTags.length > 0) {
        setShowDropdown(true);
        setSelectedIndex(prev => (prev < filteredTags.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredTags.length > 0) {
        setShowDropdown(true);
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredTags.length - 1));
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowDropdown(true);
    setSelectedIndex(-1);
  };

  const handleBlur = () => {
    // Delay closing to allow click on dropdown item
    setTimeout(() => {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }, 200);
  };

  return (
    <div className="w-full relative">
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

      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder || t("modals.addATag", { defaultValue: "Add a tag..." })}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
        />
        {availableTags.length > 0 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
            <ChevronDown size={16} />
          </div>
        )}
      </div>

      {showDropdown && filteredTags.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-40 max-h-48 overflow-y-auto">
          {filteredTags.map((tag, index) => (
            <button
              key={tag}
              onClick={() => addTag(tag)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition ${
                index === selectedIndex ? 'bg-slate-700 text-indigo-300' : 'text-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-1">
        {t("modals.pressEnterOrCommaToAddTag", { defaultValue: "Press Enter or comma (,) to add a tag" })}
        {availableTags.length > 0 && (
          <span className="ml-1">
            {t("modals.useArrowKeysToNavigate", { defaultValue: "Use ↑↓ to navigate suggestions" })}
          </span>
        )}
      </p>
    </div>
  );
};

export default TagInput;