import type { Metadata } from 'next';
import { connection } from 'next/server';
import { FlashMessage } from '@/app/_components/FlashMessage';
import { getAuthEnv } from '@/lib/environment';
import { LoginPageClient } from './LoginPageClient';

export const metadata: Metadata = {
  title: 'ログイン | パンコレ',
  description: 'パンコレにログインします。',
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
      <LoginPageClient showGoogleSignIn={authEnv.googleProvider.isEnabled} />
    </>
  );
}
