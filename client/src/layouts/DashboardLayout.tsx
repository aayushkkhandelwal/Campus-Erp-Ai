import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { AICopilotWidget } from '../components/ai/AICopilotWidget';

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-200 font-['Plus_Jakarta_Sans']">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      <div className="flex pt-16">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 w-full md:ml-64 p-4 sm:p-6 md:p-8 min-h-[calc(100vh-4rem)] overflow-x-hidden transition-all duration-200">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating Universal AI Copilot Widget */}
      <AICopilotWidget />
    </div>
  );
};
