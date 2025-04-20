'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';

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
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-gray-800">
              RAC Graph
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center">
                <div className="text-sm text-gray-700 mr-2">
                  {user.email}
                </div>
                <button
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 