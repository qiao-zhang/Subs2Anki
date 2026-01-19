import React from 'react';

export type StatusMessage = 'To open video & subtitle file' | 'Generating Waveform' | 'Ready'| 'Editing Subtitle Line' | 'Adding Subtitle Line';
export type OperationMessage = '' | 'Extracting audio clip...' | 'Finished extracting audio clip: ${string}'
  | 'Exporting deck...' | 'Export completed successfully' | `Export failed: ${string}`
  | 'Syncing to Anki...' | 'Could not connect to Anki. Please check Anki & AnkiConnect is set up properly';

interface StatusBarProps {
  statusMessage?: StatusMessage;
  operationMessage?: OperationMessage;
  isProcessing?: boolean;
  progress?: number;
  progressLabel?: string;
}

const StatusBar: React.FC<StatusBarProps> = ({
  statusMessage = 'Ready',
  operationMessage = '',
  isProcessing = false,
  progress,
  progressLabel
}) => {
  return (
    <div className="h-8 flex items-center justify-between px-4 border-t border-slate-700 bg-slate-800 text-sm text-slate-300">
      <div className="flex items-center space-x-4">
        <span className={`inline-flex items-center ${isProcessing ? 'text-yellow-400' : 'text-green-400'}`}>
          {isProcessing && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {statusMessage}
        </span>
        
        {progress !== undefined && (
          <div className="flex items-center space-x-2">
            <div className="w-32 bg-slate-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span>{progressLabel || `${Math.round(progress)}%`}</span>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default StatusBar;