'use server';

import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { getAuthEnv } from '@/lib/environment';
import { auth, signIn, signOut } from './auth';

export async function loginWithGoogleAction() {
  const authEnv = getAuthEnv();
  if (!authEnv.googleProvider.isEnabled) {
    return { error: 'Google sign-in is not configured.' };
  }

  try {
    await signIn('google', { redirectTo: '/' });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return {
      error:
        'Googleログインに失敗しました。しばらくしてから再試行してください。',
    };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' });
}

export async function loginAsUserAction() {
  const _session = await auth();
  if (process.env.NODE_ENV === 'development') {
    try {
      await signIn('dev-user', { redirectTo: '/' });
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }
      return {
        error:
          'ユーザーがデータベースに見つかりません。ターミナルで `pnpm db:seed` を実行して初期データを投入してください。',
      };
    }
  }
}

export async function loginAsAdminAction() {
  const _session = await auth();
  if (process.env.NODE_ENV === 'development') {
    try {
      await signIn('dev-admin', { redirectTo: '/' });
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }
      return {
        error:
          'ユーザーがデータベースに見つかりません。ターミナルで `pnpm db:seed` を実行して初期データを投入してください。',
      };
    }
  }
}
