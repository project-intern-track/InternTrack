import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import { motion } from 'framer-motion';

const DashboardLayout = () => {
    // Start with Sidebar open on large screens, closed on mobile
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex min-h-screen bg-[#f5f5f5] overflow-hidden">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile} />

            <motion.div 
                animate={{ 
                    marginLeft: sidebarOpen && !isMobile ? 288 : 0 // 288px = 72 tailwind spacing
                }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="flex-1 flex flex-col min-w-0"
            >
                <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                <main className="p-4 md:p-8 flex-1 min-w-0">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </motion.div>
        </div>
    );
};

export default DashboardLayout;
