import type { Metadata } from 'next';
import { LoginPageClient } from './LoginPageClient';
import { FlashMessage } from '@/app/_components/FlashMessage';

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

  return (
    <>
      <FlashMessage msg={msg} />
      <LoginPageClient />
    </>
  );
}
