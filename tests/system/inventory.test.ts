import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..', '..');
const tmpDir = path.join(rootDir, '.tmp');
const prismaBinary =
    process.platform === 'win32'
        ? path.join(rootDir, 'node_modules', '.bin', 'prisma.cmd')
        : path.join(rootDir, 'node_modules', '.bin', 'prisma');

describe('System Test: Inventory Lifecycle', () => {
    let testDir: string;

    beforeAll(async () => {
        mkdirSync(tmpDir, { recursive: true });
        testDir = mkdtempSync(path.join(tmpDir, 'system-test-'));
        const databaseUrl = `file:${path.join(testDir, 'system.db')}`;

        process.env.DATABASE_URL = databaseUrl;

        execFileSync(prismaBinary, ['migrate', 'deploy'], {
            cwd: rootDir,
            env: process.env,
            stdio: 'pipe',
        });
        execFileSync(process.execPath, ['--experimental-strip-types', 'prisma/seed.ts'], {
            cwd: rootDir,
            env: process.env,
            stdio: 'pipe',
        });
    });

    afterAll(async () => {
        if (testDir) {
            await rm(testDir, { force: true, recursive: true });
        }
    });

    it('納品書（シードデータ）が公開された状態で、トップページ用の在庫商品一覧がマスタ情報や数量閾値に基づいて正しいステータスで自動導出されること', async () => {
        const { getInventoryProducts } = await import('@/features/inventory/product-inventory');

        const products = await getInventoryProducts();

        expect(products.length).toBeGreaterThan(0);

        const curryBread = products.find((p) => p.name === '焼きカレーパン');
        expect(curryBread).toBeDefined();
        expect(curryBread?.count).toBe(19);
        expect(curryBread?.status).toBe('PLENTIFUL');

        const minestrone = products.find((p) => p.name === 'ミネストローネ');
        expect(minestrone).toBeDefined();
        expect(minestrone?.count).toBe(4);
        expect(minestrone?.status).toBe('FEW_LEFT');
    });
});