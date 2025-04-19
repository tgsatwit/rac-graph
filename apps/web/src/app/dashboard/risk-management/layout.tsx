import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Risk Management | RACGraph',
  description: 'Manage risk taxonomies, control libraries, and governance data',
};

export default function RiskManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col w-full h-full min-h-screen">
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
} 