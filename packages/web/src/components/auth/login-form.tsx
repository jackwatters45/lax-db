import { zodResolver } from '@hookform/resolvers/zod';
import { auth } from '@lax-db/core/auth';
import { redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getWebRequest } from '@tanstack/react-start/server';
import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

export const redirectToOrg = createServerFn().handler(async () => {
  const { headers } = getWebRequest();

  try {
    const session = await auth.api.getSession({ headers });
    if (!session?.user) {
      throw redirect({
        to: '/login',
      });
    }

    // Get user's organizations using better-auth API
    const activeOrg = await auth.api.getFullOrganization({ headers });
    if (!activeOrg) {
      throw redirect({
        to: '/organizations/create',
      });
    }

    throw redirect({
      to: '/$organizationSlug',
      params: {
        organizationSlug: activeOrg.slug,
      },
    });
  } catch (error) {
    console.error('Error in redirect-to-org:', error);
    throw redirect({
      to: '/login',
    });
  }
});

const loginSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type LoginFormProps = {
  redirect?: string;
} & React.ComponentPropsWithoutRef<'div'>;

export function LoginForm({ redirect, className, ...props }: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [lastMethod, setLastMethod] = useState<string | null>(null);

  useEffect(() => {
    setLastMethod(authClient.getLastUsedLoginMethod());
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError('');

    startTransition(async () => {
      try {
        const result = await authClient.signIn.email({
          email: data.email,
          password: data.password,
        });

        if (result.error) {
          setError(result.error.message || 'Login failed');
        } else {
          // Call server function to redirect to organization
          await redirectToOrg();
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
        );
      }
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: `${window.location.origin}/api/redirect-to-org`,
      });

      if (result.error) {
        setError(result.error.message || 'Google sign in failed');
      } else {
        // Navigate to API endpoint that will handle organization redirect
        await redirectToOrg();
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Google sign in failed',
      );
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-bold text-2xl">Login to your account</h1>
        <p className="text-balance text-muted-foreground text-sm">
          Enter your email below to login to your account
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-800 text-sm">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="m@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <a
                    href="forgot-password"
                    className="text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="relative w-full"
            disabled={isPending}
            variant="outline"
          >
            <span className="flex items-center justify-start gap-2">
              {isPending ? 'Signing in...' : 'Sign in with Email'}
            </span>
            {lastMethod === 'email' && (
              <Badge
                variant="secondary"
                className="-right-8 -translate-y-1/2 absolute top-1/2 shadow-md"
              >
                Last used
              </Badge>
            )}
          </Button>
        </form>
      </Form>

      <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-border after:border-t">
        <span className="relative z-10 bg-background px-2 text-muted-foreground">
          Or continue with
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        className="relative w-full"
        onClick={handleGoogleSignIn}
      >
        <div className="flex items-center justify-start gap-2">
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <title>Google</title>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Continue with Google</span>
        </div>
        {lastMethod === 'google' && (
          <Badge
            variant="secondary"
            className="-right-8 -translate-y-1/2 absolute top-1/2 shadow-md"
          >
            Last used
          </Badge>
        )}
      </Button>

      <div className="text-center text-sm">
        Don&apos;t have an account?{' '}
        <a href="/register" className="underline underline-offset-4">
          Sign up
        </a>
      </div>
    </div>
  );
}
