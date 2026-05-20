import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

// withMermaid でラップして defineConfig を呼び出します
export default withMermaid(
  defineConfig({
    base: '/pancolle/',
    title: 'Pancolle Docs',
    description: 'パンコレの開発ドキュメント',
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
      sidebar: [
        {
          text: 'ガイド',
          items: [
            { text: 'アーキテクチャ', link: '/architecture/structure' },
            { text: 'テスト構造', link: '/architecture/testing' },
            {
              text: 'デプロイレポート',
              link: '/architecture/vercel_deploy_report',
            },
            { text: 'データモデル', link: '/architecture/data_model' },
          ],
        },
        {
          text: '設定解説',
          items: [
            { text: 'Biomeの設定', link: '/config/biome' },
            {
              text: 'pnpmワークスペースの設定',
              link: '/config/pnpm_workspace',
            },
          ],
        },
      ],
      // 検索機能を有効化する場合
      search: {
        provider: 'local',
      },
    },
  }),
);
