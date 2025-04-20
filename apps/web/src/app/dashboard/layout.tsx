'use client'; // Add use client directive

import { ReactNode, useState } from 'react';
import { AuthProvider } from '../../contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Import components (assuming they will be created/copied later)
// import Navbar from '../../components/navbar/Navbar'; // Placeholder
// import Sidebar from '../../components/sidebar/Sidebar'; // Placeholder
// import Footer from '../../components/footer/Footer'; // Remove Footer import for now

// Simplified context for layout state (replace with actual context if needed)
// import { ConfiguratorContext } from 'contexts/ConfiguratorContext';

// Placeholder for routes if needed for Sidebar/Navbar
// import routes from 'routes';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  // Basic state for sidebar (replace with context/props if using Horizon components directly)
  const [open, setOpen] = useState(false);
  const [mini, setMini] = useState(false); // Example state for mini sidebar
  const [hovered, setHovered] = useState(false); // Example state for hover
  const pathname = usePathname();

  // Placeholder for dynamic values usually derived from context/routes
  const theme = 'light'; // Example
  const brandText = 'Dashboard'; // Example
  const secondary = false; // Example

  // Navigation links
  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Processes', path: '/dashboard/processes' },
    { name: 'Risk Management', path: '/dashboard/risk-management' },
    { name: 'Knowledge Base', path: '/dashboard/knowledge' },
    { name: 'Reports', path: '/dashboard/reports' },
    { name: 'Users', path: '/dashboard/users' },
  ];

  return (
    <AuthProvider>
      <div className="flex h-full w-full bg-background-100 dark:bg-background-900"> {/* Use Horizon bg color */} 
        {/* <Sidebar 
          routes={routes} // Pass routes if needed
          open={open}
          setOpen={() => setOpen(!open)}
          hovered={hovered}
          setHovered={setHovered}
          mini={mini}
          variant="admin"
        /> */}
        {/* Placeholder for Sidebar */} 
        <div className="w-64 h-screen bg-white dark:bg-navy-800 shadow-md"> {/* Basic Sidebar Placeholder */} 
           <p className="p-4 text-center font-bold">RAC Graph</p>
           {/* Add navigation links here */}
           <nav className="mt-6">
             {navLinks.map((link) => (
               <Link
                 key={link.path}
                 href={link.path}
                 className={`flex items-center px-6 py-3 text-sm ${
                   pathname === link.path || (link.path !== '/dashboard' && pathname.startsWith(link.path))
                     ? 'bg-blue-50 text-blue-700 font-medium dark:bg-navy-700 dark:text-blue-400'
                     : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-navy-700'
                 }`}
               >
                 <span>{link.name}</span>
               </Link>
             ))}
           </nav>
        </div>

        {/* Navbar & Main Content */} 
        <div className="h-full w-full font-dm dark:bg-navy-900"> {/* Use DM Sans */} 
          {/* Main Content */}
          <main
            className={`mx-2.5 flex-none transition-all dark:bg-navy-900 md:pr-2 ${
              // Simplified margin logic (adjust based on actual Sidebar component)
              mini === false
                ? 'xl:ml-[313px]' // Full sidebar width + margin
                : mini === true && hovered === true
                ? 'xl:ml-[313px]' // Expanded mini sidebar
                : 'ml-0 xl:ml-[142px]' // Collapsed mini sidebar (adjust width)
            } `}
          >
            {/* <Navbar 
              onOpenSidenav={() => setOpen(!open)}
              brandText={brandText}
              secondary={secondary}
              theme={theme}
              setTheme={() => {}} // Replace with actual theme toggle logic
              hovered={hovered}
              mini={mini}
              setMini={setMini}
            /> */}
            {/* Placeholder for Navbar */} 
            <div className="h-16 bg-white dark:bg-navy-800 shadow-sm flex items-center px-4 mb-4"> {/* Basic Navbar Placeholder */} 
              <p className="font-bold">{brandText}</p>
            </div>

            <div className="mx-auto min-h-screen p-2 !pt-[10px] md:p-2"> {/* Adjusted padding top */} 
              {children}
            </div>
            {/* <div className="p-3">
              <Footer /> // Remove Footer usage for now
            </div> */}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
} 