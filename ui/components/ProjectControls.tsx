import React from 'react';
import { Save, Upload } from 'lucide-react';

interface ProjectControlsProps {
  onSaveProject: () => void;
  onLoadProject: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProjectControls: React.FC<ProjectControlsProps> = ({
  onSaveProject,
  onLoadProject
}) => {
  return (
    <div className="flex items-center gap-1 ml-auto">
      <label className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition cursor-pointer"
             title="Load Project">
        <input
          type="file"
          accept=".subs2anki,.json"
          onChange={onLoadProject}
          className="hidden"
        />
        <Upload size={16} />
      </label>
      <button
        onClick={onSaveProject}
        className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition flex items-center gap-1"
        title="Save Project"
      >
        <Save size={14} />
      </button>
    </div>
  );
};

export default ProjectControls;