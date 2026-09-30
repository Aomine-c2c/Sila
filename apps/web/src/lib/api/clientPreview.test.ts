import { api, ApiError } from './client';

describe('API client local preview isolation', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalBypass = process.env.NEXT_PUBLIC_NEXORA_DEV_AUTH_BYPASS;
  const originalFetch = global.fetch;

  beforeEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true });
    process.env.NEXT_PUBLIC_NEXORA_DEV_AUTH_BYPASS = 'true';
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  afterAll(() => {
    if (originalNodeEnv === undefined) delete (process.env as NodeJS.ProcessEnv & { NODE_ENV?: string }).NODE_ENV;
    else Object.defineProperty(process.env, 'NODE_ENV', { value: originalNodeEnv, configurable: true });
    if (originalBypass === undefined) delete process.env.NEXT_PUBLIC_NEXORA_DEV_AUTH_BYPASS;
    else process.env.NEXT_PUBLIC_NEXORA_DEV_AUTH_BYPASS = originalBypass;
    global.fetch = originalFetch;
  });

  it('serves a fixture locally and rejects unsupported reads and every write before fetch', async () => {
    const organizations = await api.get<Array<{ id: string }>>('/api/v1/companies/me');
    expect(organizations[0].id).toBe('preview-company-nexora');

    await expect(api.get('/api/v1/companies/preview-company-nexora/missing-domain')).rejects.toMatchObject({ status: 501 });
    await expect(api.post('/api/v1/companies/preview-company-nexora/decisions', {})).rejects.toBeInstanceOf(ApiError);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
