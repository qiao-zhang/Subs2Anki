import React from 'react';
import { Save, FolderOpen } from 'lucide-react';

interface ProjectControlsProps {
  onSaveProject: () => void;
  onLoadProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProjectControls: React.FC<ProjectControlsProps> = ({
  onSaveProject,
  onLoadProject
}) => {
  return (
    <div className="flex gap-1 ml-auto">
      <input
        type="file"
        id="load-project-input"
        className="hidden"
        accept=".json"
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
        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 transition"
        title="Save Project"
      >
        <Save size={14} />
      </button>
    </div>
  );
};

export default ProjectControls;