import React from 'react';
import { Save, FolderOpen, Settings, RotateCcw } from 'lucide-react';

interface ProjectControlsProps {
  onSaveProject: () => void;
  onLoadProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenSettings: () => void;
  onResetProject: () => void;
  hasProjectData: boolean;
}

const ProjectControls: React.FC<ProjectControlsProps> = ({
  onSaveProject,
  onLoadProject,
  onOpenSettings,
  onResetProject,
  hasProjectData
}) => {
  return (
    <div className="flex gap-1 ml-auto">
      <input
        type="file"
        id="load-project-input"
        className="hidden"
        accept=".json,.subs2anki"
        onChange={onLoadProject}
      />
      <label
        htmlFor="load-project-input"
        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 transition cursor-pointer"
        title="Load Project"
      >
        <FolderOpen size={14} />
      </label>
      <button
        onClick={onSaveProject}
        disabled={!hasProjectData}
        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 transition"
        title="Save Project"
      >
        <Save size={14} />
      </button>
      <button
        onClick={onOpenSettings}
        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 transition"
        title="Settings"
      >
        <Settings size={14} />
      </button>
      {hasProjectData && (
        <button
          onClick={onResetProject}
          className="p-1.5 hover:bg-slate-700 rounded text-slate-400 transition"
          title="Reset Project"
        >
          <RotateCcw size={14} />
        </button>
      )}
    </div>
  );
};

export default ProjectControls;