import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

const siteBase = process.env.GITHUB_ACTIONS === 'true' ? '/pancolle/' : '/';

function getPageTitle(filePath: string, fallback: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : fallback;
  } catch {
    return fallback;
  }
}

function autoGenerateSidebar() {
  const docsDir = path.resolve(__dirname, '..');
  const categories = [
    { dir: 'architecture', text: 'ガイド' },
    { dir: 'config', text: '設定解説' },
    { dir: 'legal', text: '法的表記' },
  ];

  return categories.map(({ dir, text }) => {
    const items: { text: string; link: string }[] = [];
    const dirPath = path.join(docsDir, dir);

    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      files.forEach((file) => {
        if (file.endsWith('.md') && file !== 'index.md') {
          const nameWithoutExt = path.basename(file, '.md');
          const title = getPageTitle(path.join(dirPath, file), nameWithoutExt);
          items.push({
            text: title,
            link: `/${dir}/${nameWithoutExt}`,
          });
        }
      });
    }

    return {
      text,
      link: `/${dir}/`,
      items,
    };
  });
}

export default withMermaid(
  defineConfig({
    base: siteBase,
    title: 'Pancolle Docs',
    description: 'パンコレの開発ドキュメント',

    vite: {
      optimizeDeps: {
        include: ['dayjs', '@braintree/sanitize-url'],
      },
      resolve: {
        alias: {
          dayjs: 'dayjs',
          '@braintree/sanitize-url': '@braintree/sanitize-url',
        },
      },
    },

    themeConfig: {
      lastUpdated: {
        text: '最終更新日',
        formatOptions: {
          dateStyle: 'full',
          timeStyle: 'short',
        },
      },
      editLink: {
        pattern:
          'https://github.com/kotaogawa221015/pancolle/edit/main/docs/:path',
        text: 'このページを編集する',
      },
      nav: [{ text: 'Home', link: '/' }],

      sidebar: autoGenerateSidebar(),

      search: {
        provider: 'local',
      },
    },
  }),
);
