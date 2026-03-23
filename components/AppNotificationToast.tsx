import React from 'react';

interface AppNotificationToastProps {
  visible: boolean;
  text: string;
}

const AppNotificationToast: React.FC<AppNotificationToastProps> = ({ visible, text }) => {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed bottom-3 left-1/2 transform -translate-x-1/2 z-50 bg-slate-700/80 text-slate-200 px-4 py-2 rounded-md shadow-lg transition-opacity duration-300 border border-slate-600"
    >
      {text.substring(0, 30)}{text.length > 30 ? '...' : ''}
    </div>
  );
};

export default AppNotificationToast;
