import type { Metadata } from 'next';
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
  const { msg } = await searchParams;
  const authEnv = getAuthEnv();

  return (
    <>
      <FlashMessage msg={msg} />
      <LoginPageClient showGoogleSignIn={authEnv.googleProvider.isEnabled} />
    </>
  );
}
