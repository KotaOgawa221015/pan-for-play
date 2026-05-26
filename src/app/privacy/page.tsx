import fs from 'node:fs/promises';
import path from 'node:path';
import type { Metadata } from 'next';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | Pan for PLAY',
};

export default async function PrivacyPage() {
  const filePath = path.join(process.cwd(), 'docs', 'legal', 'privacy.md');
  const markdownContent = await fs.readFile(filePath, 'utf8');

  const contentWithoutFrontmatter = markdownContent.replace(
    /^---[\s\S]*?---\n/,
    '',
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8 text-zinc-800 dark:text-zinc-200">
      <div className="max-w-2xl mx-auto space-y-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
        <div className="prose dark:prose-invert max-w-none prose-emerald">
          <ReactMarkdown>{contentWithoutFrontmatter}</ReactMarkdown>
        </div>

        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <Link
            href="/login"
            className="text-sm text-emerald-600 font-semibold hover:underline"
          >
            ログイン画面に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
