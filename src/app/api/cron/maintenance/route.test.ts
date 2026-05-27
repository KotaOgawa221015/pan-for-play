import { beforeEach, describe, expect, it, vi } from 'vitest';

const { runRetentionCleanup, getCronSecret } = vi.hoisted(() => ({
  runRetentionCleanup: vi.fn(),
  getCronSecret: vi.fn(),
}));

vi.mock('@/features/retention/cleanup', () => ({
  runRetentionCleanup,
}));

vi.mock('@/lib/environment', () => ({
  getCronSecret,
}));

import { GET } from './route';

describe('cron maintenance route', () => {
  beforeEach(() => {
    runRetentionCleanup.mockReset();
    getCronSecret.mockReset();
    getCronSecret.mockReturnValue('test-secret');
  });

  it('rejects requests without a valid cron secret', async () => {
    const response = await GET(
      new Request('http://localhost/api/cron/maintenance'),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: 'Unauthorized',
    });
    expect(runRetentionCleanup).not.toHaveBeenCalled();
  });

  it('runs cleanup when the cron secret matches', async () => {
    runRetentionCleanup.mockResolvedValue({
      cutoff: '2026-05-01T00:00:00.000Z',
      deletedStatusChanges: 3,
      deletedFridges: 1,
      deletedUsers: 2,
      deletedUploadBatches: 4,
    });

    const response = await GET(
      new Request('http://localhost/api/cron/maintenance', {
        headers: {
          authorization: 'Bearer test-secret',
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      cutoff: '2026-05-01T00:00:00.000Z',
      deletedStatusChanges: 3,
      deletedFridges: 1,
      deletedUsers: 2,
      deletedUploadBatches: 4,
    });
    expect(runRetentionCleanup).toHaveBeenCalledTimes(1);
  });
});
