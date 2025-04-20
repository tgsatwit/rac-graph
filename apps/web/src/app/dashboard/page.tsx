'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import StatsCard from '../../components/StatsCard';
import { UsersIcon, PresentationChartLineIcon, ExclamationTriangleIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-default">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Sample data for stats cards
  const stats = [
    {
      title: 'Total Users',
      value: '2,356',
      change: { value: '+3%', isPositive: true },
      icon: <UsersIcon className="w-6 h-6" />,
      iconBgColorClass: 'bg-warning' // Argon Orange
    },
    {
      title: 'Process Models',
      value: '150',
      change: { value: '+5.4%', isPositive: true },
      icon: <PresentationChartLineIcon className="w-6 h-6" />,
      iconBgColorClass: 'bg-primary' // Argon Blue
    },
    {
      title: 'Active Risks',
      value: '35',
      change: { value: '-2%', isPositive: false },
      icon: <ExclamationTriangleIcon className="w-6 h-6" />,
      iconBgColorClass: 'bg-danger' // Argon Red
    },
    {
      title: 'Compliance Rate',
      value: '98.7%',
      change: { value: '+0.5%', isPositive: true },
      icon: <ChartBarIcon className="w-6 h-6" />,
      iconBgColorClass: 'bg-info' // Argon Cyan
    },
  ];

  return (
    <div className="w-full">
      {/* Stats Grid - Use responsive grid columns */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            iconBgColorClass={stat.iconBgColorClass}
          />
        ))}
      </div>

      {/* Placeholder for other dashboard content (Charts, Tables etc.) */}
      <h2 className="text-xl font-semibold text-text-dark mb-4">Further Analysis</h2>
      <div className="bg-white shadow-md rounded-lg border border-blue-gray-200 p-6">
        <p className="text-text-default">Your charts and tables will go here...</p>
        {/* Example: <YourChartComponent data={...} /> */} 
      </div>

    </div>
  );
} 