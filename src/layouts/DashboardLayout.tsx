import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';

const DashboardLayout = () => {
    // Start with Sidebar open on large screens, closed on mobile
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex min-h-screen bg-[#f5f5f5]">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-72' : 'ml-0'}`}>
                <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                <main className="p-4 md:p-8 flex-1 min-w-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
