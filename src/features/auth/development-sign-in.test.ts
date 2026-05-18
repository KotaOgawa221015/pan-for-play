import { describe, expect, it, vi } from 'vitest';
import { createDevelopmentSignInProviders } from './development-sign-in';

describe('createDevelopmentSignInProviders', () => {
  type ProviderShape = { type?: string };
  const dependencies = {
    findDevelopmentAdmin: vi.fn(async () => null),
    findDevelopmentUser: vi.fn(async () => null),
  };

  it('returns no credentials providers outside development', () => {
    const providers = createDevelopmentSignInProviders('production');

    expect(providers).toEqual([]);
  });

  it('returns development credentials providers in development', () => {
    const providers = createDevelopmentSignInProviders(
      'development',
      dependencies,
    ) as ProviderShape[];
    const credentialsProviders = providers.filter(
      (provider) => provider.type === 'credentials',
    );

    expect(credentialsProviders).toHaveLength(2);
  });
});
