'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Import Horizon UI components (Placeholders - create/copy these later)
// import Balance from '../../components/admin/dashboards/default/Balance'; 
// import DailyTraffic from '../../components/admin/dashboards/default/DailyTraffic';
// import MostVisited from '../../components/admin/dashboards/default/MostVisitedTable';
// import OverallRevenue from '../../components/admin/dashboards/default/OverallRevenue';
// import ProfitEstimation from '../../components/admin/dashboards/default/ProfitEstimation';
// import ProjectStatus from '../../components/admin/dashboards/default/ProjectStatus';
// import YourCard from '../../components/admin/dashboards/default/YourCard';
// import YourTransfers from '../../components/admin/dashboards/default/YourTransfers';

// Placeholder for data import
// import tableDataMostVisited from 'variables/dashboards/default/tableDataMostVisited';

// Define a type for the placeholder data
type MostVisitedRow = {
  pageName: string;
  visitors: string | number;
  unique: string | number;
  clients: string | number;
  bounceRate: string | number;
};

const tableDataMostVisited: MostVisitedRow[] = []; // Placeholder data with type

// Placeholder components (replace with actual imports)
const PlaceholderComponent = ({ name }: { name: string }) => (
  <div className="bg-gray-200 dark:bg-navy-700 p-4 rounded-xl h-48 flex items-center justify-center text-gray-500">
    {name} Placeholder
  </div>
);
const Balance = () => <PlaceholderComponent name="Balance" />;
const DailyTraffic = () => <PlaceholderComponent name="DailyTraffic" />;
const MostVisited = ({ tableData }: { tableData: MostVisitedRow[] }) => <PlaceholderComponent name="MostVisitedTable" />;
const OverallRevenue = () => <PlaceholderComponent name="OverallRevenue" />;
const ProfitEstimation = () => <PlaceholderComponent name="ProfitEstimation" />;
const ProjectStatus = () => <PlaceholderComponent name="ProjectStatus" />;
const YourCard = () => <PlaceholderComponent name="YourCard" />;
const YourTransfers = () => <PlaceholderComponent name="YourTransfers" />;


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
      <div className="min-h-screen flex items-center justify-center bg-background-100 dark:bg-background-900">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div> {/* Use brand color */} 
      </div>
    );
  }

  // Horizon UI Dashboard structure
  return (
     <div className="mt-3 flex h-full w-full flex-col gap-[20px] rounded-[20px] md:mt-3 xl:flex-row"> {/* Adjusted top margin */} 
      <div className="h-full w-full rounded-[20px]">
        {/* left side */}
        <div className="col-span-9 h-full w-full rounded-t-2xl xl:col-span-6">
          {/* overall & Balance */}
          <div className="mb-5 grid grid-cols-6 gap-5">
            <div className="col-span-6 h-full w-full rounded-xl 3xl:col-span-4">
              <OverallRevenue />
            </div>
            <div className="col-span-6 w-full 3xl:col-span-2">
              <Balance />
            </div>
          </div>
          {/* Daily Traffic and.. */}
          <div className="mt-5 grid w-full grid-cols-6 gap-5">
            <div className="col-span-6 md:col-span-3 3xl:col-span-2">
              <DailyTraffic />
            </div>
            <div className="col-span-6 md:col-span-3 3xl:col-span-2">
              <ProjectStatus />
            </div>
            <div className="col-span-6 3xl:col-span-2">
              <ProfitEstimation />
            </div>
          </div>
          {/* Your Transfers & tables */}
          <div className="mt-5 grid w-full grid-cols-6 gap-5">
            <div className="col-span-6 3xl:col-span-2">
              <YourTransfers />
            </div>
            <div className="col-span-6 3xl:col-span-4">
              <MostVisited tableData={tableDataMostVisited} />
            </div>
          </div>
        </div>
      </div>

      {/* line - Optional separator */}
      {/* <div className="flex w-0 bg-gray-200 dark:bg-navy-700 xl:w-px" /> */}

      {/* right section */}
      <div className="h-full w-full xl:w-[400px] xl:min-w-[300px] 2xl:min-w-[400px]">
        <YourCard />
      </div>
    </div>
  );
} 