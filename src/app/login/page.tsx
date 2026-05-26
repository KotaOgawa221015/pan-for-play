import type { Metadata } from 'next';
import { connection } from 'next/server';
import { FlashMessage } from '@/app/_components/FlashMessage';
import { getAuthEnv } from '@/lib/environment';
import { LoginPageClient } from './LoginPageClient';

export const metadata: Metadata = {
  title: 'ログイン | Pan for PLAY',
  description: 'Pan for PLAYにログインします。',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  await connection();
  const { msg } = await searchParams;
  const authEnv = getAuthEnv();

  return (
    <>
      <FlashMessage msg={msg} />
      <LoginPageClient
        isGoogleSignInEnabled={authEnv.googleProvider.isEnabled}
      />
    </>
  );
}
