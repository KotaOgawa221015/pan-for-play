import type { Metadata } from 'next';
import { SignupPageClient } from './SignupPageClient';

export const metadata: Metadata = {
  title: 'サインアップ | パンコレ',
  description: 'パンコレの新規アカウントを作成します。',
};

export default function SignupPage() {
  return <SignupPageClient />;
}
