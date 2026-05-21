import fs from 'node:fs';
import path from 'node:path';
import nunjucks from 'nunjucks';

const docsDirectoryPath = process.cwd();
const categoryIndexTemplatePath = path.join(
  docsDirectoryPath,
  '.vitepress',
  'templates',
  'docs-category-index.j2',
);
const docsTopPageTemplatePath = path.join(
  docsDirectoryPath,
  '.vitepress',
  'templates',
  'docs-home.j2',
);

const categories = [
  {
    dir: 'architecture',
    title: 'ガイド一覧',
    topPageActionText: 'ガイドを読む',
    description:
      'アーキテクチャ、データモデル、テスト構造に関するドキュメントの一覧です。',
  },
  {
    dir: 'config',
    title: '設定解説一覧',
    topPageActionText: '設定解説を見る',
    description:
      'プロジェクトの各種設定（Biomeやpnpm等）の解説ドキュメントの一覧です。',
  },
  {
    dir: 'legal',
    title: '法的表記一覧',
    topPageActionText: '法的表記を確認',
    description:
      '利用規約やプライバシーポリシーに関するドキュメントの一覧です。',
  },
];

type IndexLink = {
  fileName: string;
  title: string;
};

type CategoryMetadata = (typeof categories)[number];

type TopPageCategoryLink = {
  actionText: string;
  dir: string;
  title: string;
};

function getPageTitle(filePath: string, fallback: string): string {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

function listCategoryLinks(categoryDirectoryPath: string): IndexLink[] {
  return fs
    .readdirSync(categoryDirectoryPath)
    .filter((fileName) => fileName.endsWith('.md') && fileName !== 'index.md')
    .sort()
    .map((fileName) => {
      const fileNameWithoutExtension = path.basename(fileName, '.md');
      return {
        fileName,
        title: getPageTitle(
          path.join(categoryDirectoryPath, fileName),
          fileNameWithoutExtension,
        ),
      };
    });
}

function writeGeneratedMarkdown(
  outputFilePath: string,
  templatePath: string,
  data: Record<string, unknown>,
) {
  const template = fs.readFileSync(templatePath, 'utf8');
  const renderedContent = nunjucks.renderString(template, data);
  fs.writeFileSync(outputFilePath, `${renderedContent.trimEnd()}\n`, 'utf8');
}

function generateCategoryIndexPage(
  category: CategoryMetadata,
): TopPageCategoryLink {
  const categoryDirectoryPath = path.join(docsDirectoryPath, category.dir);
  if (!fs.existsSync(categoryDirectoryPath)) {
    throw new Error(`Category directory not found: docs/${category.dir}`);
  }

  const linkEntries = listCategoryLinks(categoryDirectoryPath);
  writeGeneratedMarkdown(
    path.join(categoryDirectoryPath, 'index.md'),
    categoryIndexTemplatePath,
    {
      description: category.description,
      links: linkEntries,
      title: category.title,
    },
  );

  console.log(
    `  ✓ Generated: docs/${category.dir}/index.md (${linkEntries.length} links)`,
  );

  return {
    actionText: category.topPageActionText,
    dir: category.dir,
    title: category.title,
  };
}

function generateTopPage(categoryLinks: TopPageCategoryLink[]) {
  writeGeneratedMarkdown(
    path.join(docsDirectoryPath, 'index.md'),
    docsTopPageTemplatePath,
    {
      categories: categoryLinks,
    },
  );
  console.log(
    `  ✓ Generated: docs/index.md (${categoryLinks.length} categories)`,
  );
}

function generate() {
  console.log('Generating VitePress index pages...');
  const topPageLinks = categories.map((category) =>
    generateCategoryIndexPage(category),
  );
  generateTopPage(topPageLinks);
}

generate();
