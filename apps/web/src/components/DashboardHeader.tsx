'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function DashboardHeader() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-blue-gray-200">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-lg font-semibold text-text-dark">Dashboard</span>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3">
                <UserCircleIcon className="h-6 w-6 text-text-muted" />
                <div className="text-sm text-text-default hidden sm:block">
                  {user.email}
                </div>
                <button
                  title="Sign out"
                  className="flex items-center text-sm font-medium text-text-muted hover:text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-md p-1"
                  onClick={handleSignOut}
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span className="sr-only">Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 