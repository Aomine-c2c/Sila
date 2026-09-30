'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

const schema = z
  .object({
    email: z.string().email('Invalid email address'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username too long')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, _ and - allowed'),
    first_name: z.string().min(1, 'First name is required').max(100),
    last_name: z.string().min(1, 'Last name is required').max(100),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'At least one uppercase letter')
      .regex(/[0-9]/, 'At least one number'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      await authApi.register({
        email: data.email,
        username: data.username,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
      });
      setSuccess(true);
      setTimeout(() => router.replace('/auth/login'), 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError('Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="auth-stage relative min-h-screen bg-nexora-dark flex items-center justify-center overflow-hidden py-12">
      {/* Background */}
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
      <div
        className="pointer-events-none absolute top-1/4 right-1/3 h-64 w-64 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.10) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md px-4">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary font-mono text-2xl font-black text-primary-foreground shadow-[0_0_36px_hsl(var(--primary)/.14)]">
            N
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">NEXORA</h1>
            <p className="text-sm text-muted-foreground">Autonomous Organization OS</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 ring-1 ring-border">
          {success ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-400" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-foreground">Account created!</h2>
              <p className="text-sm text-muted-foreground">Redirecting you to sign in…</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">Create account</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Build your AI-powered organization
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="register-first-name"
                      className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                      First name
                    </label>
                    <input
                      id="register-first-name"
                      type="text"
                      autoComplete="given-name"
                      className={`w-full rounded-lg border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                        errors.first_name ? 'border-destructive' : 'border-input'
                      }`}
                      placeholder="Alice"
                      {...register('first_name')}
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-xs text-red-400">{errors.first_name.message}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="register-last-name"
                      className="mb-1.5 block text-sm font-medium text-foreground"
                    >
                      Last name
                    </label>
                    <input
                      id="register-last-name"
                      type="text"
                      autoComplete="family-name"
                      className={`w-full rounded-lg border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                        errors.last_name ? 'border-destructive' : 'border-input'
                      }`}
                      placeholder="Smith"
                      {...register('last_name')}
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-xs text-red-400">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label
                    htmlFor="register-username"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Username
                  </label>
                  <input
                    id="register-username"
                    type="text"
                    autoComplete="username"
                    className={`w-full rounded-lg border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                      errors.username ? 'border-destructive' : 'border-input'
                    }`}
                    placeholder="alice_smith"
                    {...register('username')}
                  />
                  {errors.username && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                      <AlertCircle className="h-3 w-3" aria-hidden="true" />
                      {errors.username.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="register-email"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Email
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    className={`w-full rounded-lg border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
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
                    htmlFor="register-password"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className={`w-full rounded-lg border bg-secondary/50 px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
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

                {/* Confirm */}
                <div>
                  <label
                    htmlFor="register-confirm"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Confirm password
                  </label>
                  <input
                    id="register-confirm"
                    type="password"
                    autoComplete="new-password"
                    className={`w-full rounded-lg border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                      errors.confirm_password ? 'border-destructive' : 'border-input'
                    }`}
                    placeholder="••••••••"
                    {...register('confirm_password')}
                  />
                  {errors.confirm_password && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                      <AlertCircle className="h-3 w-3" aria-hidden="true" />
                      {errors.confirm_password.message}
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
                  id="register-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary w-full disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Creating account…
                    </>
                  ) : (
                    'Create account'
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
