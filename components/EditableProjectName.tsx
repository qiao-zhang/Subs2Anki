import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface EditableProjectNameProps {
  projectName: string;
  onProjectNameChange: (newName: string) => void;
  className?: string;
}

const EditableProjectName: React.FC<EditableProjectNameProps> = ({
  projectName,
  onProjectNameChange,
  className = ''
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(projectName);
  const inputRef = useRef<HTMLInputElement>(null);

  // 当projectName改变时更新临时名称
  useEffect(() => {
    setTempName(projectName);
  }, [projectName]);

  // 编辑模式下聚焦输入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); // 选中文本以便快速替换
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    handleSubmit();
  };

  const handleSubmit = () => {
    // 只有当名称真正改变时才调用回调
    if (tempName.trim() !== '' && tempName !== projectName) {
      onProjectNameChange(tempName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      // 按ESC键取消编辑，恢复原值
      setTempName(projectName);
      setIsEditing(false);
    }
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-[120px]"
          autoFocus
        />
      ) : (
        <span
          onDoubleClick={handleDoubleClick}
          className="cursor-pointer hover:bg-slate-800/50 px-2 py-1 rounded text-sm transition-colors"
          title={t("modals.doubleClickEditProjectName", { defaultValue: "双击编辑项目名称" })}
        >
          {projectName || t("modals.unnamedProject", { defaultValue: "未命名项目" })}
        </span>
      )}
    </div>
  );
};

export default EditableProjectName;