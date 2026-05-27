'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useReducer, useState } from 'react';
import { deleteReceivingBatch } from '@/features/receiving/history/delete-batch';
import { applyReceivingReview } from '@/features/receiving/publication/apply-review';
import { reapplyReceivingBatch } from '@/features/receiving/publication/reapply-batch';
import { startReceivingReview } from '@/features/receiving/start-review';
import type {
  HistoryEntry,
  ReviewDraft,
  ReviewInput,
} from '@/features/receiving/types';
import { HistoryList } from './HistoryList';
import { ReapplyModal } from './ReapplyModal';
import { ReviewModal } from './ReviewModal';
import { UploadPanel } from './UploadPanel';

type State = {
  draft: ReviewDraft | null;
  draftFridgeId: string | null;
  isModalOpen: boolean;
  notice: string | null;
  errorMessage: string | null;
  isReading: boolean;
  isApplying: boolean;
  busyBatchId: string | null;
  uploadKey: number;
};

type Action =
  | { type: 'START_READING' }
  | { type: 'READ_SUCCESS'; draft: ReviewDraft; fridgeId: string }
  | { type: 'READ_ERROR'; error: string }
  | { type: 'START_APPLYING' }
  | { type: 'APPLY_SUCCESS' }
  | { type: 'APPLY_ERROR'; error: string }
  | { type: 'START_BATCH_ACTION'; batchId: string }
  | { type: 'BATCH_ACTION_FINISH' }
  | { type: 'BATCH_ACTION_ERROR'; error: string }
  | { type: 'CLOSE_DRAFT' }
  | { type: 'OPEN_DRAFT' }
  | { type: 'DISCARD_DRAFT' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_READING':
      return { ...state, isReading: true, notice: null, errorMessage: null };
    case 'READ_SUCCESS':
      return {
        ...state,
        isReading: false,
        draft: action.draft,
        draftFridgeId: action.fridgeId,
        isModalOpen: true,
        uploadKey: state.uploadKey + 1,
      };
    case 'READ_ERROR':
      return {
        ...state,
        isReading: false,
        errorMessage: action.error,
        uploadKey: state.uploadKey + 1,
      };
    case 'START_APPLYING':
      return { ...state, isApplying: true, errorMessage: null };
    case 'APPLY_SUCCESS':
      return {
        ...state,
        isApplying: false,
        draft: null,
        draftFridgeId: null,
        isModalOpen: false,
        notice: null,
        uploadKey: state.uploadKey + 1,
      };
    case 'APPLY_ERROR':
      return { ...state, isApplying: false, errorMessage: action.error };
    case 'START_BATCH_ACTION':
      return {
        ...state,
        busyBatchId: action.batchId,
        notice: null,
        errorMessage: null,
      };
    case 'BATCH_ACTION_FINISH':
      return { ...state, busyBatchId: null };
    case 'BATCH_ACTION_ERROR':
      return { ...state, busyBatchId: null, errorMessage: action.error };
    case 'CLOSE_DRAFT':
      return {
        ...state,
        isModalOpen: false,
      };
    case 'OPEN_DRAFT':
      return {
        ...state,
        isModalOpen: true,
      };
    case 'DISCARD_DRAFT':
      return {
        ...state,
        draft: null,
        draftFridgeId: null,
        isModalOpen: false,
        uploadKey: state.uploadKey + 1,
      };
    default:
      return state;
  }
}

type Props = {
  recentHistory: HistoryEntry[];
  fridges: { id: string; name: string; isDefault: boolean }[];
};

const readActionTimeoutMs = 15_000;

export function Dashboard({ recentHistory, fridges }: Props) {
  const { refresh, replace } = useRouter();
  const [reapplyBatchId, setReapplyBatchId] = useState<string | null>(null);
  const [reapplyFridgeId, setReapplyFridgeId] = useState('');
  const [isReapplying, setIsReapplying] = useState(false);
  const [state, dispatch] = useReducer(reducer, {
    draft: null,
    draftFridgeId: null,
    isModalOpen: false,
    notice: null,
    errorMessage: null,
    isReading: false,
    isApplying: false,
    busyBatchId: null,
    uploadKey: 0,
  });

  const {
    draft,
    isModalOpen,
    notice,
    errorMessage,
    isReading,
    isApplying,
    busyBatchId,
    uploadKey,
  } = state;

  const refreshPage = () => {
    refresh();
  };
  const selectedReapplyEntry =
    recentHistory.find((entry) => entry.id === reapplyBatchId) ?? null;

  const handleRead = async (formData: FormData) => {
    dispatch({ type: 'START_READING' });
    const fridgeId = formData.get('fridgeId') as string;

    try {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new Error(
              '読み取りがタイムアウトしました。別の納品書をアップロードして再度お試しください。',
            ),
          );
        }, readActionTimeoutMs);
      });
      const result = await (async () => {
        try {
          return await Promise.race([startReceivingReview(formData), timeout]);
        } finally {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        }
      })();
      if (result.ok) {
        dispatch({ type: 'READ_SUCCESS', draft: result.draft, fridgeId });
      } else {
        dispatch({ type: 'READ_ERROR', error: result.error });
      }
    } catch (error) {
      dispatch({
        type: 'READ_ERROR',
        error:
          error instanceof Error
            ? error.message
            : '納品書の読み取りに失敗しました。',
      });
    } finally {
      refreshPage();
    }
  };

  const handleApply = async (input: ReviewInput) => {
    dispatch({ type: 'START_APPLYING' });

    try {
      await applyReceivingReview(input);
      const fridgeName =
        fridges.find((f) => f.id === state.draftFridgeId)?.name || '';
      dispatch({ type: 'APPLY_SUCCESS' });
      replace(
        `/admin?msg=apply_success&fridgeName=${encodeURIComponent(fridgeName)}`,
        { scroll: false },
      );
    } catch (error) {
      dispatch({
        type: 'APPLY_ERROR',
        error:
          error instanceof Error
            ? error.message
            : '納品書の反映に失敗しました。',
      });
      throw error;
    } finally {
      refreshPage();
    }
  };

  const runBatchAction = (
    batchId: string,
    action: () => Promise<void>,
    messages?: { success: string; failed: string },
  ) => {
    dispatch({ type: 'START_BATCH_ACTION', batchId });

    startTransition(async () => {
      try {
        await action();
        dispatch({ type: 'BATCH_ACTION_FINISH' });
        if (messages) {
          replace(`/admin?msg=${messages.success}`, { scroll: false });
        }
      } catch (error) {
        dispatch({
          type: 'BATCH_ACTION_ERROR',
          error:
            error instanceof Error
              ? error.message
              : '履歴の更新に失敗しました。',
        });
        if (messages) {
          replace(`/admin?msg=${messages.failed}`, { scroll: false });
        }
      } finally {
        refreshPage();
      }
    });
  };

  const openReapplyModal = (batchId: string) => {
    setReapplyBatchId(batchId);

    const targetEntry = recentHistory.find((entry) => entry.id === batchId);
    const appliedNames = targetEntry?.appliedFridgeNames ?? [];

    // 適用済みの冷蔵庫を除外
    const availableFridges = fridges.filter(
      (f) => !appliedNames.includes(f.name),
    );

    // 選択可能な冷蔵庫の中から初期値を選択（デフォルトの冷蔵庫があれば優先）
    const initialFridgeId =
      availableFridges.find((f) => f.isDefault)?.id ??
      availableFridges[0]?.id ??
      '';

    setReapplyFridgeId(initialFridgeId);
  };

  const closeReapplyModal = () => {
    if (isReapplying) {
      return;
    }
    setReapplyBatchId(null);
  };

  const submitReapply = () => {
    if (!reapplyBatchId || !reapplyFridgeId) {
      return;
    }

    const targetBatchId = reapplyBatchId;
    const targetFridgeId = reapplyFridgeId;
    const fridgeName = fridges.find((f) => f.id === targetFridgeId)?.name || '';
    dispatch({ type: 'START_BATCH_ACTION', batchId: targetBatchId });
    setIsReapplying(true);

    startTransition(async () => {
      try {
        await reapplyReceivingBatch({
          batchId: targetBatchId,
          fridgeId: targetFridgeId,
        });
        dispatch({ type: 'BATCH_ACTION_FINISH' });
        setReapplyBatchId(null);
        replace(
          `/admin?msg=reapply_success&fridgeName=${encodeURIComponent(fridgeName)}`,
          { scroll: false },
        );
      } catch (error) {
        dispatch({
          type: 'BATCH_ACTION_ERROR',
          error:
            error instanceof Error
              ? error.message
              : '納品書の再適用に失敗しました。',
        });
        replace('/admin?msg=reapply_failed', { scroll: false });
      } finally {
        setIsReapplying(false);
        refreshPage();
      }
    });
  };

  const requestDeleteBatch = (batchId: string) => {
    const targetEntry = recentHistory.find((entry) => entry.id === batchId);
    const label = targetEntry?.originalFileName ?? 'この納品書';
    if (
      !confirm(
        `「${label}」を削除しますか？\nこの納品書を適用中の冷蔵庫は、削除後に未適用になります。`,
      )
    ) {
      return;
    }

    runBatchAction(batchId, () => deleteReceivingBatch(batchId), {
      success: 'delete_success',
      failed: 'delete_failed',
    });
  };

  return (
    <div className="space-y-6">
      <UploadPanel
        key={uploadKey}
        fridges={fridges}
        isReading={isReading}
        hasDraft={draft !== null}
        draftFileName={draft?.originalFileName}
        onRead={handleRead}
        onOpenDraft={() => dispatch({ type: 'OPEN_DRAFT' })}
        onDeleteDraft={() => dispatch({ type: 'DISCARD_DRAFT' })}
        message={errorMessage ?? notice}
        isError={Boolean(errorMessage)}
      />

      <HistoryList
        entries={recentHistory}
        busyBatchId={busyBatchId}
        onReapply={openReapplyModal}
        onDelete={requestDeleteBatch}
      />

      <ReapplyModal
        isOpen={reapplyBatchId !== null}
        fileName={selectedReapplyEntry?.originalFileName ?? null}
        lines={selectedReapplyEntry?.lines ?? []}
        fridges={fridges}
        appliedFridgeNames={selectedReapplyEntry?.appliedFridgeNames ?? []}
        selectedFridgeId={reapplyFridgeId}
        isSubmitting={isReapplying}
        onSelectFridge={setReapplyFridgeId}
        onClose={closeReapplyModal}
        onSubmit={submitReapply}
      />

      {isModalOpen && (
        <ReviewModal
          key={draft?.batchId ?? 'draft-closed'}
          draft={draft}
          isApplying={isApplying}
          onApply={handleApply}
          onClose={() => {
            if (isApplying) {
              return;
            }
            dispatch({ type: 'CLOSE_DRAFT' });
          }}
        />
      )}
    </div>
  );
}
