import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, ListTodo, Clock, Star, Bell, Settings,
    ClipboardCheck, FileText, MessageSquare,
    Users, CalendarCheck, Shield, UserCheck, BarChart3, Megaphone,
    LogOut, Loader2, X, ChevronLeft, ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
}

interface NavLink {
    to: string;
    label: string;
    icon: LucideIcon;
}

interface NavSection {
    label: string;
    links: NavLink[];
}

const Sidebar = ({ isOpen: _isOpen = true, onClose, collapsed = false, onToggleCollapse }: SidebarProps) => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    if (!user) return null;

    const handleLogout = async () => {
        setIsLoggingOut(true);
        if (onClose) onClose();
        navigate('/');
        try {
            await signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const getNavSections = (): NavSection[] => {
        switch (user.role) {
            case 'intern':
                return [
                    {
                        label: 'Main',
                        links: [
                            { to: '/intern/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                            { to: '/intern/tasks', label: 'My Tasks', icon: ListTodo },
                            { to: '/intern/logs', label: 'Time Log', icon: Clock },
                            { to: '/intern/feedback', label: 'Feedback', icon: Star },
                        ],
                    },
                    {
                        label: 'Account',
                        links: [
                            { to: '/intern/notifications', label: 'Notifications', icon: Bell },
                            { to: '/intern/settings', label: 'Settings', icon: Settings },
                        ],
                    },
                ];
            case 'supervisor':
                return [
                    {
                        label: 'Main',
                        links: [
                            { to: '/supervisor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                            { to: '/supervisor/SupervisorApprovals', label: 'Approve Tasks', icon: ClipboardCheck },
                            { to: '/supervisor/Evaluations', label: 'Evaluations', icon: FileText },
                            { to: '/supervisor/FeedbackDashboard', label: 'Feedback', icon: MessageSquare },
                        ],
                    },
                    {
                        label: 'Account',
                        links: [
                            { to: '/supervisor/notifications', label: 'Notifications', icon: Bell },
                            { to: '/supervisor/settings', label: 'Settings', icon: Settings },
                        ],
                    },
                ];
            case 'admin':
                return [
                    {
                        label: 'Management',
                        links: [
                            { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                            { to: '/admin/interns', label: 'Manage Interns', icon: Users },
                            { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
                            { to: '/admin/logs', label: 'My Time Log', icon: Clock },
                            { to: '/admin/tasks', label: 'Manage Tasks', icon: ListTodo },
                            { to: '/admin/manage-admins', label: 'Manage Admins', icon: Shield },
                            { to: '/admin/manage-supervisors', label: 'Supervisors', icon: UserCheck },
                            { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
                            { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
                        ],
                    },
                    {
                        label: 'Account',
                        links: [
                            { to: '/admin/notifications', label: 'Notifications', icon: Bell },
                            { to: '/admin/settings', label: 'Settings', icon: Settings },
                        ],
                    },
                ];
            default:
                return [];
        }
    };

    const navSections = getNavSections();
    const initials = user.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'IT';

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] relative overflow-hidden">
            {/* Header */}
            <div
                className={`flex items-center border-b border-white/10 h-16 flex-shrink-0 transition-all duration-300 ${
                    collapsed ? 'justify-center px-0' : 'px-4 gap-2.5'
                }`}
            >
                <img
                    src="/heroIcon.png"
                    alt="InternTrack"
                    className="w-9 h-9 min-w-[36px] object-contain flex-shrink-0"
                />
                <AnimatePresence initial={false}>
                    {!collapsed && (
                        <motion.span
                            key="brand"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-white font-bold text-lg overflow-hidden whitespace-nowrap"
                        >
                            Intern<span className="text-[#FF8800]">Track</span>
                        </motion.span>
                    )}
                </AnimatePresence>
                {/* Mobile close button */}
                {!collapsed && onClose && (
                    <button
                        onClick={onClose}
                        className="ml-auto p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors lg:hidden"
                        aria-label="Close menu"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden space-y-5" style={{ scrollbarWidth: 'none' }}>
                {navSections.map((section) => (
                    <div key={section.label}>
                        <AnimatePresence initial={false}>
                            {!collapsed && (
                                <motion.p
                                    key={`lbl-${section.label}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-3 mb-2"
                                >
                                    {section.label}
                                </motion.p>
                            )}
                        </AnimatePresence>
                        <ul className="space-y-0.5">
                            {section.links.map((link) => {
                                const Icon = link.icon;
                                return (
                                    <li key={link.to}>
                                        <NavLink
                                            to={link.to}
                                            onClick={onClose}
                                            title={collapsed ? link.label : undefined}
                                            className={({ isActive }) =>
                                                `flex items-center rounded-xl transition-all duration-200 group
                                                ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5 gap-3'}
                                                ${
                                                    isActive
                                                        ? 'bg-[#FF8800] shadow-[0_0_16px_rgba(255,136,0,0.25)]'
                                                        : 'hover:bg-white/5'
                                                }`
                                            }
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    <Icon
                                                        size={18}
                                                        className={`flex-shrink-0 transition-colors ${
                                                            isActive
                                                                ? 'text-white'
                                                                : 'text-white/45 group-hover:text-white/80'
                                                        }`}
                                                    />
                                                    <AnimatePresence initial={false}>
                                                        {!collapsed && (
                                                            <motion.span
                                                                key="lbl"
                                                                initial={{ opacity: 0, width: 0 }}
                                                                animate={{ opacity: 1, width: 'auto' }}
                                                                exit={{ opacity: 0, width: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                className={`text-sm whitespace-nowrap overflow-hidden transition-colors ${
                                                                    isActive
                                                                        ? 'text-white font-semibold'
                                                                        : 'text-white/55 font-medium group-hover:text-white'
                                                                }`}
                                                            >
                                                                {link.label}
                                                            </motion.span>
                                                        )}
                                                    </AnimatePresence>
                                                </>
                                            )}
                                        </NavLink>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* Footer: collapse toggle + logout + user profile */}
            <div className="border-t border-white/10 p-3 space-y-1 flex-shrink-0">
                {/* Desktop collapse toggle — lives in the footer */}
                {onToggleCollapse && (
                    <motion.button
                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                        whileTap={{ scale: 0.96 }}
                        onClick={onToggleCollapse}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        className={`w-full hidden lg:flex items-center rounded-xl px-3 py-2.5 text-white/40 hover:text-white/80 transition-colors ${
                            collapsed ? 'justify-center' : 'gap-3'
                        }`}
                    >
                        {collapsed ? <ChevronRight size={16} /> : (
                            <>
                                <ChevronLeft size={16} />
                                <AnimatePresence initial={false}>
                                    <motion.span
                                        key="collapse-lbl"
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="text-xs font-medium whitespace-nowrap overflow-hidden"
                                    >
                                        Collapse
                                    </motion.span>
                                </AnimatePresence>
                            </>
                        )}
                    </motion.button>
                )}
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    title={collapsed ? 'Logout' : undefined}
                    className={`w-full flex items-center rounded-xl px-3 py-2.5 text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
                        collapsed ? 'justify-center' : 'gap-3'
                    }`}
                >
                    {isLoggingOut ? (
                        <Loader2 size={20} className="animate-spin flex-shrink-0" />
                    ) : (
                        <LogOut size={20} className="flex-shrink-0" />
                    )}
                    <AnimatePresence initial={false}>
                        {!collapsed && (
                            <motion.span
                                key="logout-lbl"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-sm font-medium whitespace-nowrap overflow-hidden"
                            >
                                {isLoggingOut ? 'Logging out...' : 'Logout'}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>

                <div className={`flex items-center rounded-xl px-3 py-2 ${collapsed ? 'justify-center' : 'gap-3'}`}>
                    <div className="w-8 h-8 min-w-[32px] rounded-lg bg-gradient-to-br from-[#FF8800]/70 to-orange-600/70 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {initials}
                    </div>
                    <AnimatePresence initial={false}>
                        {!collapsed && (
                            <motion.div
                                key="user-info"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden min-w-0"
                            >
                                <p className="text-white text-sm font-semibold truncate max-w-[140px]">{user.name}</p>
                                <div className="flex items-center gap-1.5">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                                    <p className="text-white/40 text-xs capitalize">{user.role}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

        </div>
    );
};

export default Sidebar;
