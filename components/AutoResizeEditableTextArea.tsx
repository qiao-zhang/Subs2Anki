import React, {useState, useRef, useEffect, useCallback} from 'react';

interface AutoResizeEditableTextareaProps {
  initialValue: string | null;
  placeholder?: string;
  onSave: (value: string) => void | null;
  className?: string;
  textClassName?: string;
  textareaClassName?: string;
  minHeight?: number;
  maxHeight?: number;
}

const AutoResizeEditableTextarea: React.FC<AutoResizeEditableTextareaProps> = ({
                                                                                 initialValue = '',
                                                                                 placeholder,
                                                                                 onSave,
                                                                                 className = '',
                                                                                 textClassName = '',
                                                                                 textareaClassName = '',
                                                                                 minHeight = 40,
                                                                                 maxHeight = 300
                                                                               }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [isDoubleClick, setIsDoubleClick] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);
  const clickCount = useRef(0);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // 自动调整高度的核心函数 [1,4,6](@ref)
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      // 重置高度以确保 scrollHeight 计算准确 [1,5](@ref)
      textareaRef.current.style.height = 'auto';

      // 获取内容的实际滚动高度 [1,6](@ref)
      const scrollHeight = textareaRef.current.scrollHeight;

      // 限制在最小和最大高度之间 [5](@ref)
      const newHeight = Math.max(minHeight, Math.min(maxHeight, scrollHeight));
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [minHeight, maxHeight]);

  /*
  // 内容变化时调整高度 [2,5](@ref)
  useEffect(() => {
    if (isEditing) {
      adjustTextareaHeight();
    }
  }, [value, isEditing, adjustTextareaHeight]);
   */

  /*
  // 编辑模式切换时调整高度
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      // 使用 useLayoutEffect 的同步特性避免闪烁 [1,4](@ref)
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
        adjustTextareaHeight();
      }, 0);
    }
  }, [isEditing, adjustTextareaHeight]);
   */

  // 双击逻辑
  const handleDoubleClick = useCallback(() => {
    setIsDoubleClick(true);
    setIsEditing(true);
  }, []);

  // 点击检测逻辑
  const handleClick = useCallback(() => {
    clickCount.current += 1;

    if (clickCount.current === 1) {
      clickTimer.current = setTimeout(() => {
        clickCount.current = 0;
        setIsDoubleClick(false);
      }, 300);
    } else if (clickCount.current === 2) {
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
      }
      handleDoubleClick();
      clickCount.current = 0;
    }
  }, [handleDoubleClick]);

  // 外部点击检测
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isEditing) {
          setIsEditing(false);
          if (onSave && value !== initialValue) {
            onSave(value);
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, value, initialValue, onSave]);

  // 输入变化处理
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
  };

  // 键盘事件处理
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      setIsEditing(false);
      if (onSave) {
        onSave(value);
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
      onSave(value);
    }
  };

  return (
    <div ref={containerRef} className={`auto-resize-editable ${className}`}>
      {!isEditing ? (
        <div
          className={`editable-text text-white ${textClassName}`}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
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
            maxHeight: `${maxHeight}px`,
            padding: '8px',
            // border: '1px solid #ddd',
            // borderRadius: '4px',
            resize: 'none' as const,
            // overflow: 'hidden',
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