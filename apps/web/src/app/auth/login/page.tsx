'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bot, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
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

      router.replace('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError('Login failed. Please try again.');
      }
      // Clear token on error
      setToken(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-nexora-dark flex items-center justify-center overflow-hidden">
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

      <div className="relative w-full max-w-md px-4">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30">
            <Bot className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              NEXORA
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
                className={`w-full rounded-lg border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 ${
                  errors.email ? 'border-destructive' : 'border-input'
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
                  className={`w-full rounded-lg border bg-secondary/50 px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 ${
                    errors.password ? 'border-destructive' : 'border-input'
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
  );
}
