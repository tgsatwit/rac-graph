'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from 'shared';
import { HomeIcon, UsersIcon, BookOpenIcon, MagnifyingGlassIcon, CogIcon, PresentationChartLineIcon, ExclamationTriangleIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline'; // Example using Heroicons

interface MenuItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

// Updated icons using Heroicons (replace placeholders)
const menuItems: Record<UserRole, MenuItem[]> = {
  [UserRole.ADMIN]: [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Users', href: '/dashboard/users', icon: UsersIcon },
    { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: BookOpenIcon },
    { name: 'Search KB', href: '/dashboard/knowledge/search', icon: MagnifyingGlassIcon },
    { name: 'Process Models', href: '/dashboard/processes', icon: PresentationChartLineIcon }, // Placeholder
    { name: 'Risk Management', href: '/dashboard/risk-management', icon: ExclamationTriangleIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
  ],
  [UserRole.ANALYST]: [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: BookOpenIcon },
    { name: 'Search KB', href: '/dashboard/knowledge/search', icon: MagnifyingGlassIcon },
    { name: 'Process Models', href: '/dashboard/processes', icon: PresentationChartLineIcon }, // Placeholder
    { name: 'Risk Management', href: '/dashboard/risk-management', icon: ExclamationTriangleIcon },
    { name: 'Analysis', href: '/dashboard/analysis', icon: MagnifyingGlassIcon }, // Placeholder
    { name: 'Reports', href: '/dashboard/reports', icon: DocumentChartBarIcon }, // Placeholder
  ],
  [UserRole.REVIEWER]: [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Process Models', href: '/dashboard/processes', icon: PresentationChartLineIcon }, // Placeholder
    { name: 'Risk Management', href: '/dashboard/risk-management', icon: ExclamationTriangleIcon },
    { name: 'Analysis', href: '/dashboard/analysis', icon: MagnifyingGlassIcon }, // Placeholder
    { name: 'Reports', href: '/dashboard/reports', icon: DocumentChartBarIcon }, // Placeholder
  ],
};

export default function DashboardSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const userRole = (user as any)?.role as UserRole || UserRole.REVIEWER;
  const items = menuItems[userRole] || menuItems[UserRole.REVIEWER];

  return (
    // Apply Argon dark background and text color
    <div className="bg-default text-text-light w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out flex flex-col">
      <div className="flex items-center space-x-2 px-4 mb-5">
        {/* Consider adding a logo here */} 
        <span className="text-2xl font-semibold">RAC Graph</span>
      </div>
      
      <nav className="flex-grow">
        <ul className="space-y-1">
          {items.map((item: MenuItem) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 py-2.5 px-4 rounded-md transition duration-150 ease-in-out text-sm font-medium ${ 
                    isActive 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-blue-gray-300 hover:bg-blue-gray-700 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Optional Footer or User section */}
      <div className="mt-auto p-4 border-t border-blue-gray-700">
        {/* Add user info or sign out? */}
      </div>
    </div>
  );
} 