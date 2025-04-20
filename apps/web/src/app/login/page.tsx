'use client';

import LoginForm from '../../components/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-default py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <LoginForm />
        <div className="text-center mt-4">
          <p className="text-sm text-text-default">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-primary hover:text-primary/90">
              Register here
            </Link>
          </p>
          <p className="text-sm text-text-default mt-2">
            <Link href="/reset-password" className="font-medium text-primary hover:text-primary/90">
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 