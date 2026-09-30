import { controlRoomApi } from './controlRoom';
import { getControlRoomPreviewState } from './controlRoomPreview';

describe('controlRoomApi.getOperationalState', () => {
  afterEach(() => { delete (global as typeof globalThis & { fetch?: typeof fetch }).fetch; });

  it('serves only the labeled synthetic fixture in explicit development preview without network access', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalBypass = process.env.NEXT_PUBLIC_NEXORA_DEV_AUTH_BYPASS;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true });
    process.env.NEXT_PUBLIC_NEXORA_DEV_AUTH_BYPASS = 'true';
    const fetchSpy = jest.fn();
    Object.defineProperty(global, 'fetch', { value: fetchSpy, configurable: true });

    try {
      const result = await controlRoomApi.getOperationalState('preview-company-nexora');

      expect(result).toEqual(getControlRoomPreviewState());
      expect(result.company_id).toBe('preview-company-nexora');
      expect(result.agents).toHaveLength(4);
      expect(result.tasks.map((task) => task.status)).toContain('BLOCKED');
      expect(result.providers.map((provider) => provider.provider)).toEqual(['anthropic', 'google', 'local']);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      if (originalNodeEnv === undefined) delete (process.env as NodeJS.ProcessEnv & { NODE_ENV?: string }).NODE_ENV;
      else Object.defineProperty(process.env, 'NODE_ENV', { value: originalNodeEnv, configurable: true });
      if (originalBypass === undefined) delete process.env.NEXT_PUBLIC_NEXORA_DEV_AUTH_BYPASS;
      else process.env.NEXT_PUBLIC_NEXORA_DEV_AUTH_BYPASS = originalBypass;
    }
  });

  it('does not fabricate tasks, providers, memories, or resource telemetry when none are returned', async () => {
    const fetchSpy = jest.fn(async (input: RequestInfo | URL) => {
      const path = String(input);
      if (path.includes('/resources/control-center')) {
        return { ok: false, status: 503, statusText: 'Unavailable', json: async () => ({ detail: 'Unavailable' }) } as Response;
      }
      if (path.endsWith('/projects')) {
        return { ok: true, status: 200, json: async () => [{ id: 'project-1', title: 'Actual project' }] } as Response;
      }
      return { ok: true, status: 200, json: async () => [] } as Response;
    });
    Object.defineProperty(global, 'fetch', { value: fetchSpy, configurable: true });

    const result = await controlRoomApi.getOperationalState('company-1');

    expect(result.tasks).toEqual([]);
    expect(result.providers).toEqual([]);
    expect(result.memories).toEqual([]);
    expect(result.resources).toEqual({
      compute_used_pct: null,
      memory_used_gb: null,
      memory_limit_gb: null,
      token_usage_total: null,
      intelligence_cost_usd: null,
      budget_allocated_usd: null,
      budget_spent_usd: null,
    });
    expect(result.unavailableSections).toContain('resource telemetry');
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/projects/project-1/tasks'), expect.any(Object));
  });
});
