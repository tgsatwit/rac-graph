import { ReactNode } from 'react';
import { AuthProvider } from '../../contexts/AuthContext';
import DashboardHeader from '../../components/DashboardHeader';
import DashboardSidebar from '../../components/DashboardSidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-screen bg-background-default">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 bg-background-default">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
} 