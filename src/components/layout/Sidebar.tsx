import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    X,
    LogOut,
    Loader2
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
    isMobile?: boolean;
}

const Sidebar = ({ isOpen = true, onClose, isMobile = false }: SidebarProps) => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    if (!user) return null;

    const handleLogout = async () => {
        setIsLoggingOut(true);
        if (onClose) onClose();

        // Navigate immediately for better UX
        navigate('/');

        // Let signOut complete in background
        try {
            await signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const getLinks = () => {
        switch (user.role) {
            case 'intern':
                return [
                    { to: '/intern/dashboard', label: 'Dashboard' },
                    { to: '/intern/tasks', label: 'Task List' },
                    { to: '/intern/logs', label: 'Time Log' },
                    { to: '/intern/feedback', label: 'Performance Feedback' },
                    { to: '/intern/settings', label: 'Settings' },
                ];
            case 'supervisor':
                return [
                    { to: '/supervisor/dashboard', label: 'Dashboard' },
                    { to: '/supervisor/SupervisorApprovals', label: 'Approve Tasks' },
                    { to: '/supervisor/Evaluations', label: 'Evaluations' },
                    { to: '/supervisor/FeedbackDashboard', label: 'Feedback' },
                    { to: '/supervisor/settings', label: 'Settings' },
                ];
            case 'admin':
                return [
                    { to: '/admin/dashboard', label: 'Dashboard' },
                    { to: '/admin/interns', label: 'Manage Interns' },
                    { to: '/admin/attendance', label: 'Monitor Attendance' },
                    { to: '/admin/tasks', label: 'Manage Tasks' },
                    { to: '/admin/manage-admins', label: 'Manage Admins' },
                    { to: '/admin/manage-supervisors', label: 'Manage Supervisors' },
                    { to: '/admin/reports', label: 'Reports' },
                    { to: '/admin/announcements', label: 'Announcements' },
                    { to: '/admin/settings', label: 'Settings' },
                ];
            default:
                return [];
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobile && isOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/50 z-[999] md:hidden" 
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            <motion.aside 
                initial={false}
                animate={{ 
                    x: isOpen ? 0 : -288 // 288px = 72 tailwind spacing
                }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="fixed top-0 left-0 h-screen w-72 bg-[#0a0a0a] flex flex-col z-[1000] rounded-r-[25px] overflow-y-auto shadow-2xl md:shadow-none"
            >
                <button 
                    className="md:hidden absolute top-4 right-4 text-white p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer border-none bg-transparent" 
                    onClick={onClose} 
                    aria-label="Close menu"
                >
                    <X size={24} />
                </button>

                <div className="p-6 flex items-center gap-2 border-b border-white/10 mt-2 md:mt-0">
                    <div className="text-2xl font-bold flex gap-[0.15rem]">
                        <span className="text-white">Intern</span>
                        <span className="text-[#ff8c42]">Track</span>
                    </div>
                </div>

                <nav className="flex-1 py-6 px-4 overflow-y-auto">
                    <ul className="flex flex-col gap-2 list-none p-0 m-0">
                        {getLinks().map((link) => (
                            <li key={link.to} className="relative">
                                <NavLink
                                    to={link.to}
                                    className={({ isActive }) =>
                                        `flex items-center justify-between py-3.5 px-5 text-white no-underline text-[0.9375rem] font-normal rounded-xl transition-all duration-200 ${isActive ? 'bg-[#ff8c42] text-white font-medium shadow-md' : 'hover:bg-white/5'}`
                                    }
                                    onClick={() => { if (isMobile && onClose) onClose(); }}
                                >
                                    {link.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="p-4 border-t border-white/10 mt-auto">
                    <button
                        className="w-full flex items-center gap-3 py-3.5 px-5 bg-transparent border-none text-white/90 text-[0.9375rem] font-normal rounded-xl cursor-pointer transition-all duration-200 hover:bg-red-500/15 hover:text-red-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                    >
                        {isLoggingOut ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                <span>Logging out...</span>
                            </>
                        ) : (
                            <>
                                <LogOut size={20} />
                                <span>Logout</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;
