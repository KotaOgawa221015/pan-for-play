'use server';

import { auth, signIn, signOut } from './auth';

export async function loginWithGoogleAction() {
  await signIn('google', { redirectTo: '/' });
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' });
}

export async function loginAsUserAction() {
  const _session = await auth();
  if (process.env.NODE_ENV === 'development') {
    await signIn('dev-user', { redirectTo: '/' });
  }
}

export async function loginAsAdminAction() {
  const _session = await auth();
  if (process.env.NODE_ENV === 'development') {
    await signIn('dev-admin', { redirectTo: '/' });
  }
}
