import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import NotificationDropdown from '../components/layout/NotificationDropdown';

const DashboardLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const location = useLocation();
    const prefersReducedMotion = useReducedMotion();

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950">
            {/* Desktop Sidebar — CSS width transition (avoids reflow on framer-motion JS thread) */}
            <div
                style={{ width: sidebarCollapsed ? 72 : 260 }}
                className="hidden lg:block sticky top-0 h-screen bg-[#0a0a0a] rounded-tr-[25px] rounded-br-[25px] overflow-visible flex-shrink-0 transition-[width] duration-300 ease-in-out"
            >
                <Sidebar
                    isOpen={true}
                    onClose={() => setSidebarOpen(false)}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
                />
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
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[45] lg:hidden"
                        />
                        {/* Mobile Sidebar */}
                        <motion.div
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'tween', duration: 0.3 }}
                            className="fixed left-0 top-0 h-screen w-[260px] bg-[#0a0a0a] z-[55] rounded-tr-[25px] rounded-br-[25px]"
                        >
                            <Sidebar
                                isOpen={sidebarOpen}
                                onClose={() => setSidebarOpen(false)}
                                collapsed={false}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
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
                    <div className="ml-auto">
                        <NotificationDropdown />
                    </div>
                </div>

                <TopBar />

                <main className="flex-1 p-4 md:p-6 lg:p-8 w-full overflow-y-auto">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={location.pathname}
                            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
