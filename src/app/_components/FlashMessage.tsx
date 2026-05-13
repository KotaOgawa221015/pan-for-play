'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function FlashMessage({ msg }: { msg?: string }) {
  const [isExiting, setIsExiting] = useState(false);
  const pathname = usePathname();
  const validMessages = ['login_success', 'signup_success', 'logout_success'];
  const isVisible = Boolean(msg && validMessages.includes(msg));

  useEffect(() => {
    if (!isVisible) {
      setIsExiting(false);
      return;
    }

    setIsExiting(false);

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2400);

    const removeTimer = setTimeout(() => {
      window.history.replaceState(window.history.state, '', pathname);
    }, 2900);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [isVisible, pathname]);

  if (!isVisible || !msg) return null;

  const isLogout = msg === 'logout_success';

  const styles = isLogout
    ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-400'
    : 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-400';

  const messageMap: Record<string, string> = {
    login_success: 'ログインしました',
    signup_success: 'アカウントを作成しました',
    logout_success: 'ログアウトしました',
  };

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-50 border-b
        text-center py-2 text-xs font-medium 
        transition-all duration-500 ease-in-out
        ${styles}
        ${isExiting ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'}
      `}
    >
      {messageMap[msg]}
    </div>
  );
}
