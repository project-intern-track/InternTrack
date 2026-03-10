import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import NotificationDropdown from '../components/layout/NotificationDropdown';

const DashboardLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-72 sticky top-0 h-screen bg-[#0a0a0a] rounded-tr-[25px] rounded-br-[25px]">
                <Sidebar isOpen={true} onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
                        />
                        {/* Mobile Sidebar */}
                        <motion.div
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'tween', duration: 0.3 }}
                            className="fixed left-0 top-0 h-screen w-72 bg-slate-900 dark:bg-black z-40 overflow-y-auto border-r border-white/5"
                        >
                            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col w-full lg:w-auto">
                {/* Mobile Header */}
                <div className="lg:hidden sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-white/5 h-16 flex items-center px-4 gap-3 backdrop-blur-md">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu size={24} className="text-gray-700 dark:text-gray-300" />
                    </motion.button>
                    <h1 className="text-xl font-black text-gray-900 dark:text-white">InternTrack</h1>
                    {/* Notification bell — always visible on mobile */}
                    <div className="ml-auto">
                        <NotificationDropdown />
                    </div>
                </div>

                <TopBar />

                <main className="flex-1 p-4 md:p-6 lg:p-8 w-full overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
