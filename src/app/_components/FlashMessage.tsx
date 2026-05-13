'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function FlashMessage({ msg }: { msg?: string }) {
  const [isVisible, setIsVisible] = useState(!!msg);
  const [isExiting, setIsExiting] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const validMessages = ['login_success', 'signup_success', 'logout_success'];

    if (msg && validMessages.includes(msg)) {
      setIsVisible(true);
      setIsExiting(false);

      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, 2400);

      const removeTimer = setTimeout(() => {
        setIsVisible(false);
        router.replace(pathname, { scroll: false });
      }, 2900);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [msg, pathname, router]);

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