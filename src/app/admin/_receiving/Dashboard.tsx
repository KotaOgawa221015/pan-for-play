'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useState } from 'react';
import {
  applyReceivingReview,
  deleteReceivingBatch,
  reapplyReceivingBatch,
  startReceivingReview,
} from '@/features/receiving/actions';
import type {
  HistoryEntry,
  ReviewDraft,
  ReviewInput,
} from '@/features/receiving/types';
import { HistoryList } from './HistoryList';
import { ReviewModal } from './ReviewModal';
import { UploadPanel } from './UploadPanel';

type Props = {
  recentHistory: HistoryEntry[];
};

export function Dashboard({ recentHistory }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<ReviewDraft | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [busyBatchId, setBusyBatchId] = useState<string | null>(null);

  const refreshPage = () => {
    router.refresh();
  };

  const handleRead = async (fileName: string) => {
    setNotice(null);
    setErrorMessage(null);
    setIsReading(true);

    try {
      const nextDraft = await startReceivingReview(fileName);
      setDraft(nextDraft);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '納品書の読み取りに失敗しました。',
      );
    } finally {
      setIsReading(false);
      refreshPage();
    }
  };

  const handleApply = async (input: ReviewInput) => {
    setIsApplying(true);
    setErrorMessage(null);

    try {
      await applyReceivingReview(input);
      setDraft(null);
      setNotice('納品書の内容を在庫へ反映しました。');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '納品書の反映に失敗しました。',
      );
      throw error;
    } finally {
      setIsApplying(false);
      refreshPage();
    }
  };

  const runBatchAction = (batchId: string, action: () => Promise<void>) => {
    setBusyBatchId(batchId);
    setNotice(null);
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await action();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : '履歴の更新に失敗しました。',
        );
      } finally {
        setBusyBatchId(null);
        refreshPage();
      }
    });
  };

  return (
    <div className="space-y-6">
      <UploadPanel
        isReading={isReading}
        onRead={handleRead}
        message={errorMessage ?? notice}
        isError={Boolean(errorMessage)}
      />

      <HistoryList
        entries={recentHistory}
        busyBatchId={busyBatchId}
        onReapply={(batchId) =>
          runBatchAction(batchId, () => reapplyReceivingBatch(batchId))
        }
        onDelete={(batchId) =>
          runBatchAction(batchId, () => deleteReceivingBatch(batchId))
        }
      />

      <ReviewModal
        draft={draft}
        isApplying={isApplying}
        onApply={handleApply}
        onClose={() => {
          if (isApplying) {
            return;
          }

          setDraft(null);
        }}
      />
    </div>
  );
}
