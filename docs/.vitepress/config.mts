import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

// withMermaid でラップして defineConfig を呼び出します
export default withMermaid(
  defineConfig({
    title: "Pancolle Docs",
    description: "パンコレの開発ドキュメント",
    themeConfig: {
      nav: [
        { text: 'Home', link: '/' },
      ],
      sidebar: [
        {
          text: 'ガイド',
          items: [
            { text: 'アーキテクチャ', link: '/architecture' },
            { text: 'テスト構造', link: '/testing' },
          ]
        },
        {
          text: '設定解説',
          items: [
            { text: 'Biome設定', link: '/config/biome' }
          ]
        },
        {
          text: 'データベース設計',
          items: [
            { text: '在庫ER図の解説', link: '/inventory_erd/inventory_erd_explanation' },
            { text: 'ER図 (Mermaid)', link: '/inventory_erd/inventory_erd_mermaid' }
          ]
        }
      ],
      // 検索機能を有効化する場合
      search: {
        provider: 'local'
      }
    }
  })
)
