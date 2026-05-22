'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useReducer } from 'react';

type MessagePhase = 'idle' | 'visible' | 'exiting';

type State = {
  phase: MessagePhase;
};

type Action = { type: 'SHOW' } | { type: 'EXIT' } | { type: 'RESET' };

function flashMessageReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SHOW':
      return { phase: 'visible' };
    case 'EXIT':
      return { phase: 'exiting' };
    case 'RESET':
      return { phase: 'idle' };
    default:
      return state;
  }
}

export function FlashMessage({ msg }: { msg?: string }) {
  const router = useRouter();
  const validMessages = [
    'login_success',
    'signup_success',
    'logout_success',
    'session_invalid',
    'apply_success',
  ];
  const isTriggered = Boolean(msg && validMessages.includes(msg));

  const [state, dispatch] = useReducer(flashMessageReducer, { phase: 'idle' });

  useEffect(() => {
    if (!isTriggered) {
      dispatch({ type: 'RESET' });
      return;
    }

    dispatch({ type: 'SHOW' });

    const exitTimer = setTimeout(() => {
      dispatch({ type: 'EXIT' });
    }, 2400);

    const removeTimer = setTimeout(() => {
      router.replace(window.location.pathname, { scroll: false });
    }, 2900);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [isTriggered, router]);

  if (state.phase === 'idle' || !msg) return null;

  const isAlert = msg === 'logout_success' || msg === 'session_invalid';

  const styles = isAlert
    ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-400'
    : 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-400';

  const messageMap: Record<string, string> = {
    login_success: 'ログインしました',
    signup_success: 'アカウントを作成しました',
    logout_success: 'ログアウトしました',
    session_invalid: 'セッションが無効です。再ログインしてください。',
    apply_success: '納品書が適用されました',
  };

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-50 border-b
        text-center py-2 text-xs font-medium 
        transition-all duration-500 ease-in-out
        ${styles}
        /* 💡 state.phase に応じてアニメーションクラスを切り替え */
        ${state.phase === 'exiting' ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'}
      `}
    >
      {messageMap[msg]}
    </div>
  );
}
