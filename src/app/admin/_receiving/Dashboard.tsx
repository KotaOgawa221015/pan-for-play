'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useReducer } from 'react';
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
import { ReviewModal } from './ReviewModal';
import { UploadPanel } from './UploadPanel';

type State = {
  draft: ReviewDraft | null;
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
  | { type: 'READ_SUCCESS'; draft: ReviewDraft }
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
        isModalOpen: false,
        uploadKey: state.uploadKey + 1,
      };
    default:
      return state;
  }
}

type Props = {
  recentHistory: HistoryEntry[];
};

export function Dashboard({ recentHistory }: Props) {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, {
    draft: null,
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
    router.refresh();
  };

  const handleRead = async (formData: FormData) => {
    dispatch({ type: 'START_READING' });

    try {
      const nextDraft = await startReceivingReview(formData);
      dispatch({ type: 'READ_SUCCESS', draft: nextDraft });
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
      dispatch({ type: 'APPLY_SUCCESS' });
      router.replace('/admin?msg=apply_success', { scroll: false });
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

  const runBatchAction = (batchId: string, action: () => Promise<void>) => {
    dispatch({ type: 'START_BATCH_ACTION', batchId });

    startTransition(async () => {
      try {
        await action();
        dispatch({ type: 'BATCH_ACTION_FINISH' });
      } catch (error) {
        dispatch({
          type: 'BATCH_ACTION_ERROR',
          error:
            error instanceof Error
              ? error.message
              : '履歴の更新に失敗しました。',
        });
      } finally {
        refreshPage();
      }
    });
  };

  return (
    <div className="space-y-6">
      <UploadPanel
        key={uploadKey}
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
        onReapply={(batchId) =>
          runBatchAction(batchId, () => reapplyReceivingBatch(batchId))
        }
        onDelete={(batchId) =>
          runBatchAction(batchId, () => deleteReceivingBatch(batchId))
        }
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
