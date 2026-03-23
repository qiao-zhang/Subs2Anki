import React from 'react';
import { useTranslation } from 'react-i18next';
import type { AnkiCard } from '@/services/types.ts';
import ProcessingOverlay from '@/components/ProcessingOverlay.tsx';

interface AppProcessingOverlaysProps {
  isSyncing: boolean;
  syncProgress: { current: number; total: number };
  isBulkCreating: boolean;
  bulkCreateProgress: { current: number; total: number };
  isExporting: boolean;
  ankiCards: AnkiCard[];
  onCancelExport: () => void;
}

const AppProcessingOverlays: React.FC<AppProcessingOverlaysProps> = ({
  isSyncing,
  syncProgress,
  isBulkCreating,
  bulkCreateProgress,
  isExporting,
  ankiCards,
  onCancelExport,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {isSyncing && (
        <ProcessingOverlay
          isInProcess={isSyncing}
          InProcessMessage={t('modals.syncingToAnki', { defaultValue: 'Syncing to Anki...' })}
          Progress={syncProgress}
        >
          {t('modals.cardsSynced', {
            defaultValue: '{{current}} / {{total}} cards synced',
            current: syncProgress.current,
            total: syncProgress.total,
          })}
        </ProcessingOverlay>
      )}

      {isBulkCreating && (
        <ProcessingOverlay
          isInProcess={isBulkCreating}
          InProcessMessage={t('modals.creatingCards', { defaultValue: 'Creating Cards...' })}
          Progress={bulkCreateProgress}
        >
          {t('modals.cardsCreated', {
            defaultValue: '{{current}} / {{total}} cards created',
            current: bulkCreateProgress.current,
            total: bulkCreateProgress.total,
          })}
        </ProcessingOverlay>
      )}

      {isExporting && (
        <ProcessingOverlay
          isInProcess={isExporting}
          InProcessMessage={t('modals.preparingExport', { defaultValue: 'Preparing Export...' })}
          onCancel={onCancelExport}
        >
          {t('modals.processingMedia', {
            defaultValue: 'Processing media ({{count}} remaining)',
            count: ankiCards.filter(c => c.audioStatus !== 'done').length,
          })}
        </ProcessingOverlay>
      )}
    </>
  );
};

export default AppProcessingOverlays;
