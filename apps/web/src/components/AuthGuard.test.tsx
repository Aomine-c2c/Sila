import { fireEvent, render, screen, waitFor } from '@testing-library/react';
var mockReplace: jest.Mock;
var mockRouter: { replace: jest.Mock };
var mockStore: jest.Mock;
const mockSetUser = jest.fn();
const mockLogout = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => {
    if (!mockRouter) {
      mockReplace = jest.fn();
      mockRouter = { replace: mockReplace };
    }
    return mockRouter;
  },
  usePathname: () => '/dashboard/agents',
}));

jest.mock('@/store/auth', () => {
  mockStore = jest.fn() as jest.Mock & { persist: { hasHydrated: jest.Mock; onFinishHydration: jest.Mock } };
  Object.assign(mockStore, {
    persist: {
      hasHydrated: jest.fn(() => true),
      onFinishHydration: jest.fn(() => jest.fn()),
    },
  });
  return { useAuthStore: mockStore };
});
jest.mock('@/lib/api/auth', () => ({ authApi: { me: jest.fn() } }));

import { AuthGuard } from './AuthGuard';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

const mockUser = {
  id: 'user-1', email: 'operator@example.com', username: 'operator',
  first_name: 'Alex', last_name: 'Operator', is_active: true,
  is_superuser: false, created_at: '', updated_at: '',
};

describe('AuthGuard', () => {
  let token: string | null;

  beforeEach(() => {
    jest.clearAllMocks();
    token = 'valid-token';
    mockStore.mockImplementation((selector: (state: unknown) => unknown) => selector({
      token,
      setUser: mockSetUser,
      logout: mockLogout,
    }));
  });

  it('redirects to login and does not render protected content without a token', async () => {
    token = null;
    render(<AuthGuard><div>Protected dashboard</div></AuthGuard>);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(
      '/auth/login?next=%2Fdashboard%2Fagents'
    ));
    expect(screen.queryByText('Protected dashboard')).not.toBeInTheDocument();
    expect(authApi.me).not.toHaveBeenCalled();
  });

  it('validates a persisted token and renders only after loading the user', async () => {
    jest.mocked(authApi.me).mockResolvedValue(mockUser);
    render(<AuthGuard><div>Protected dashboard</div></AuthGuard>);

    expect(screen.getByText('Checking your session…')).toBeInTheDocument();
    expect(await screen.findByText('Protected dashboard')).toBeInTheDocument();
    expect(mockSetUser).toHaveBeenCalledWith(mockUser);
  });

  it('clears an expired token and redirects back to the requested page', async () => {
    jest.mocked(authApi.me).mockRejectedValue(new ApiError(401, {}, 'Session expired'));
    render(<AuthGuard><div>Protected dashboard</div></AuthGuard>);

    await waitFor(() => expect(mockLogout).toHaveBeenCalled());
    expect(mockReplace).toHaveBeenCalledWith('/auth/login?next=%2Fdashboard%2Fagents');
    expect(screen.queryByText('Protected dashboard')).not.toBeInTheDocument();
  });

  it('offers a retry when session verification fails temporarily', async () => {
    jest.mocked(authApi.me).mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce(mockUser);
    render(<AuthGuard><div>Protected dashboard</div></AuthGuard>);

    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Protected dashboard')).toBeInTheDocument();
    expect(authApi.me).toHaveBeenCalledTimes(2);
  });

  it('bypasses auth only when the explicit development flag is enabled', () => {
    const originalNodeEnv = Object.getOwnPropertyDescriptor(process.env, 'NODE_ENV');
    const originalFlag = process.env.NEXT_PUBLIC_NEIMAN_DEV_AUTH_BYPASS;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true, configurable: true });
    process.env.NEXT_PUBLIC_NEIMAN_DEV_AUTH_BYPASS = 'true';
    try {
      render(<AuthGuard><div>Preview dashboard</div></AuthGuard>);
      expect(screen.getByText('Preview dashboard')).toBeInTheDocument();
      expect(authApi.me).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    } finally {
      if (originalNodeEnv) Object.defineProperty(process.env, 'NODE_ENV', originalNodeEnv);
      if (originalFlag === undefined) delete process.env.NEXT_PUBLIC_NEIMAN_DEV_AUTH_BYPASS;
      else process.env.NEXT_PUBLIC_NEIMAN_DEV_AUTH_BYPASS = originalFlag;
    }
  });

  it('does not enable the bypass in production even when the flag is present', () => {
    const originalNodeEnv = Object.getOwnPropertyDescriptor(process.env, 'NODE_ENV');
    const originalFlag = process.env.NEXT_PUBLIC_NEIMAN_DEV_AUTH_BYPASS;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true, configurable: true });
    process.env.NEXT_PUBLIC_NEIMAN_DEV_AUTH_BYPASS = 'true';
    try {
      render(<AuthGuard><div>Protected production content</div></AuthGuard>);
      expect(screen.getByText('Checking your session…')).toBeInTheDocument();
      expect(authApi.me).toHaveBeenCalled();
    } finally {
      if (originalNodeEnv) Object.defineProperty(process.env, 'NODE_ENV', originalNodeEnv);
      if (originalFlag === undefined) delete process.env.NEXT_PUBLIC_NEIMAN_DEV_AUTH_BYPASS;
      else process.env.NEXT_PUBLIC_NEIMAN_DEV_AUTH_BYPASS = originalFlag;
    }
  });
});
