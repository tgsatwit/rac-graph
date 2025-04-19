import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from 'shared';

// Menu items based on user role
const menuItems = {
  [UserRole.ADMIN]: [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Users', href: '/dashboard/users', icon: '👥' },
    { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: '📚' },
    { name: 'Search KB', href: '/dashboard/knowledge/search', icon: '🔎' },
    { name: 'Process Models', href: '/dashboard/processes', icon: '🔄' },
    { name: 'Risk Management', href: '/dashboard/risk-management', icon: '⚠️' },
    { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
  ],
  [UserRole.ANALYST]: [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Knowledge Base', href: '/dashboard/knowledge', icon: '📚' },
    { name: 'Search KB', href: '/dashboard/knowledge/search', icon: '🔎' },
    { name: 'Process Models', href: '/dashboard/processes', icon: '🔄' },
    { name: 'Risk Management', href: '/dashboard/risk-management', icon: '⚠️' },
    { name: 'Analysis', href: '/dashboard/analysis', icon: '🔍' },
    { name: 'Reports', href: '/dashboard/reports', icon: '📝' },
  ],
  [UserRole.REVIEWER]: [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Process Models', href: '/dashboard/processes', icon: '🔄' },
    { name: 'Risk Management', href: '/dashboard/risk-management', icon: '⚠️' },
    { name: 'Analysis', href: '/dashboard/analysis', icon: '🔍' },
    { name: 'Reports', href: '/dashboard/reports', icon: '📝' },
  ],
};

export default function DashboardSidebar() {
  const { currentUser } = useAuth();
  const pathname = usePathname();

  // Default to Reviewer role if user or role not available
  const userRole = currentUser?.role || UserRole.REVIEWER;
  const items = menuItems[userRole] || menuItems[UserRole.REVIEWER];

  return (
    <div className="bg-gray-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out">
      <div className="flex items-center space-x-2 px-4">
        <span className="text-2xl font-extrabold">RAC Graph</span>
      </div>
      
      <nav>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center space-x-2 py-2.5 px-4 rounded transition duration-200 ${
                  pathname === item.href ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
} 