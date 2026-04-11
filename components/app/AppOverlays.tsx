import React from 'react';
import {useTranslation} from 'react-i18next';
import ProcessingOverlay from '@/components/ProcessingOverlay.tsx';

interface Progress {
  current: number;
  total: number;
}

interface AppOverlaysProps {
  isSyncing: boolean;
  syncProgress: Progress;
  isBulkCreating: boolean;
  bulkCreateProgress: Progress;
  isExporting: boolean;
  pendingMediaCount: number;
  onCancelExport: () => void;
}

const AppOverlays: React.FC<AppOverlaysProps> = ({
  isSyncing,
  syncProgress,
  isBulkCreating,
  bulkCreateProgress,
  isExporting,
  pendingMediaCount,
  onCancelExport,
}) => {
  const {t} = useTranslation();

  return (
    <>
      {isSyncing && <ProcessingOverlay
        isInProcess={isSyncing}
        InProcessMessage={t('modals.syncingToAnki', {defaultValue: 'Syncing to Anki...'})}
        Progress={syncProgress}
      >
        {t('modals.cardsSynced', {
          defaultValue: '{{current}} / {{total}} cards synced',
          current: syncProgress.current,
          total: syncProgress.total,
        })}
      </ProcessingOverlay>}
      {isBulkCreating && <ProcessingOverlay
        isInProcess={isBulkCreating}
        InProcessMessage={t('modals.creatingCards', {defaultValue: 'Creating Cards...'})}
        Progress={bulkCreateProgress}
      >
        {t('modals.cardsCreated', {
          defaultValue: '{{current}} / {{total}} cards created',
          current: bulkCreateProgress.current,
          total: bulkCreateProgress.total,
        })}
      </ProcessingOverlay>}
      {isExporting && <ProcessingOverlay
        isInProcess={isExporting}
        InProcessMessage={t('modals.preparingExport', {defaultValue: 'Preparing Export...'})}
        onCancel={onCancelExport}
      >
        {t('modals.processingMedia', {
          defaultValue: 'Processing media ({{count}} remaining)',
          count: pendingMediaCount,
        })}
      </ProcessingOverlay>}
    </>
  );
};

export default AppOverlays;

