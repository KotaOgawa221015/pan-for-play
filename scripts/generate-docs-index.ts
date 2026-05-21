import fs from 'node:fs';
import path from 'node:path';

const docsDir = path.resolve(process.cwd(), 'docs');

const categories = [
    {
        dir: 'architecture',
        title: 'ガイド一覧',
        description: 'アーキテクチャ、データモデル、テスト構造に関するドキュメントの一覧です。'
    },
    {
        dir: 'config',
        title: '設定解説一覧',
        description: 'プロジェクトの各種設定（Biomeやpnpm等）の解説ドキュメントの一覧です。'
    },
    {
        dir: 'legal',
        title: '法的表記一覧',
        description: '利用規約やプライバシーポリシーに関するドキュメントの一覧です。'
    }
];

function getPageTitle(filePath: string, fallback: string): string {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const match = content.match(/^#\s+(.+)$/m);
        return match ? match[1].trim() : fallback;
    } catch {
        return fallback;
    }
}

function generate() {
    console.log('Generating VitePress index pages...');

    categories.forEach(({ dir, title, description }) => {
        const dirPath = path.join(docsDir, dir);
        if (!fs.existsSync(dirPath)) return;

        const files = fs.readdirSync(dirPath);
        const links: string[] = [];

        files.forEach((file) => {
            if (file.endsWith('.md') && file !== 'index.md') {
                const nameWithoutExt = path.basename(file, '.md');
                const pageTitle = getPageTitle(path.join(dirPath, file), nameWithoutExt);
                links.push(`- [${pageTitle}](./${file})`);
            }
        });

        const indexContent = [
            '---',
            'outline: deep',
            '---',
            `# ${title}`,
            '',
            description,
            '',
            '## ドキュメント一覧',
            '',
            links.join('\n'),
            ''
        ].join('\n');

        fs.writeFileSync(path.join(dirPath, 'index.md'), indexContent, 'utf8');
        console.log(`  ✓ Generated: docs/${dir}/index.md (${links.length} links)`);
    });
}

generate();