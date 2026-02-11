import React, {useState, useRef, useEffect} from 'react';

interface AutoResizeEditableTextareaProps {
  initialValue: string | null;
  placeholder?: string;
  onSave: (value: string) => void | null;
  className?: string;
  textClassName?: string;
  textareaClassName?: string;
  minHeight?: number;
}

const AutoResizeEditableTextarea: React.FC<AutoResizeEditableTextareaProps> = ({
                                                                                 initialValue = '',
                                                                                 placeholder,
                                                                                 onSave,
                                                                                 className = '',
                                                                                 textClassName = '',
                                                                                 textareaClassName = '',
                                                                                 minHeight = 40,
                                                                               }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // 输入变化处理
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
  };

  // 键盘事件处理
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      setIsEditing(false);
      if (onSave && value !== initialValue) {
        onSave(value.trim());
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  // 失去焦点处理
  const handleBlur = () => {
    setIsEditing(false);
    if (onSave && value !== initialValue) {
      onSave(value.trim());
    }
  };

  return (
    <div ref={containerRef} className={`h-auto flex-1 bg-transparent border-none text-lg placeholder-slate-600 focus:ring-0 focus:outline-none px-2 font-medium ${className}`}>
      {!isEditing ? (
        <div
          className={`editable-text text-white ${textClassName}`}
          onDoubleClick={() => setIsEditing(true)}
          style={{
            minHeight: `${minHeight}px`,
            padding: '8px',
            border: '1px dashed transparent',
            cursor: 'pointer',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: '1.5'
          }}
        >
          {value || placeholder || 'Double click to edit'}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={`editable-textarea text-black ${textareaClassName}`}
          style={{
            width: '100%',
            minHeight: `${minHeight}px`,
            padding: '8px',
            resize: 'none' as const,
            lineHeight: '1.5',
            font: 'inherit',
            boxSizing: 'border-box'
          }}
        />
      )}
    </div>
  );
};

export default AutoResizeEditableTextarea;