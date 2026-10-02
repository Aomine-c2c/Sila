'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth';
import { ApiError } from '@/lib/api/client';
import { organizationsApi } from '@/lib/api/organizations';
import { configureApiClient } from '@/lib/api/client';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setUser, setActiveCompany } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      const { access_token } = await authApi.login(data as import('@/lib/api/auth').LoginRequest);

      // Store token first so subsequent calls are authenticated
      setToken(access_token);
      configureApiClient(() => access_token);

      // Fetch user profile
      const user = await authApi.me();
      setUser(user);

      // Try to load first company
      try {
        const companies = await organizationsApi.list();
        if (companies.length > 0) {
          setActiveCompany(companies[0]);
        }
      } catch {
        // No companies yet — will be prompted on dashboard
      }

      const requestedPath = new URLSearchParams(window.location.search).get('next');
      const destination = requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
        ? requestedPath
        : '/dashboard';
      router.replace(destination);
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
        setApiError('Unable to reach the NEIMAN API server at http://localhost:8000. Please ensure the backend is running.');
      } else {
        setApiError('Login failed. Please check your credentials and ensure the backend is active.');
      }
      // Clear token on error
      setToken(null);
    }
  };

  return (
    <div className="auth-stage relative min-h-screen bg-NEIMAN-dark flex items-center justify-center overflow-hidden px-4 py-10">
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.4) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
        aria-hidden="true"
      />

      {/* Glow orbs */}
      <div
        className="pointer-events-none absolute top-1/4 left-1/4 h-64 w-64 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(271 91% 65% / 0.10) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1fr_440px]">
        <section className="hidden max-w-2xl py-10 lg:block" aria-label="NEIMAN organization operating system">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-mono text-lg font-black text-primary-foreground">N</div>
            <div><p className="text-sm font-bold tracking-[0.2em] text-foreground">NEIMAN</p><p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Organization OS</p></div>
          </div>
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">A new kind of organization</p>
          <h2 className="max-w-xl text-5xl font-semibold leading-[1.07] tracking-[-0.045em] text-foreground xl:text-6xl">Give intelligence<br />a <span className="text-primary">place to work.</span></h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">A living operating system for people and AI employees. Shared memory, clear authority, and work that stays accountable.</p>
          <div className="org-constellation mt-12 max-w-xl" aria-hidden="true">
            <div className="constellation-orbit orbit-one" /><div className="constellation-orbit orbit-two" />
            <span className="constellation-node node-core">N</span><span className="constellation-node node-a">OPS</span><span className="constellation-node node-b">MEMORY</span><span className="constellation-node node-c">POLICY</span><span className="constellation-node node-d">AGENTS</span>
            <span className="constellation-caption">PEOPLE · AGENTS · SHARED PURPOSE</span>
          </div>
          <div className="mt-10 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px w-8 bg-primary/70" />Humans retain the final say.</div>
        </section>
        <div className="relative mx-auto w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary font-mono text-2xl font-black text-primary-foreground shadow-[0_0_36px_hsl(var(--primary)/.14)]">
              N
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                NEIMAN
              </h1>
              <p className="text-sm text-muted-foreground">Autonomous Organization OS</p>
            </div>
          </div>

          {/* Card */}
          <div className="glass rounded-2xl p-8 ring-1 ring-border">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">Sign in</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Access your AI-powered organization
              </p>
            </div>

            {/* SINGLE CONFIGURED USER (NEIMAN ADMIN) */}
            <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Primary Organization Administrator
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">Single User Mode</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setValue('email', 'admin@neiman.ai', { shouldValidate: true, shouldDirty: true });
                  setValue('password', 'password123', { shouldValidate: true, shouldDirty: true });
                }}
                className="w-full p-3 rounded-lg bg-card/90 border border-primary/40 hover:border-primary text-left transition-colors flex items-center justify-between shadow-sm"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm">System Administrator</span>
                    <span className="badge badge-primary text-[9px] py-0 px-1.5">SUPERADMIN</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono block">admin@neiman.ai</span>
                </div>
                <span className="text-xs font-mono text-primary font-semibold hover:underline">Click to Fill</span>
              </button>

              <div className="text-[10px] font-mono text-muted-foreground/90 flex items-center justify-between pt-1 border-t border-border/40">
                <span>Default Password: <code className="text-foreground font-bold">password123</code></span>
                <span>Role: Workspace Owner</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  className={`w-full rounded-lg border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 ${errors.email ? 'border-destructive' : 'border-input'
                    }`}
                  placeholder="you@company.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="login-password"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`w-full rounded-lg border bg-secondary/50 px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 ${errors.password ? 'border-destructive' : 'border-input'
                      }`}
                    placeholder="••••••••"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* API Error */}
              {apiError && (
                <div
                  className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-400"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {apiError}
                </div>
              )}

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/register"
                className="font-medium text-primary hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
