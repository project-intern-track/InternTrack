import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    FileText,
    Calendar,
    Settings,
    Users,
    ClipboardList,
    Bell,
    ChevronDown,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar = ({ isOpen = true, onClose }: SidebarProps) => {
    const { user } = useAuth();
    const [announcementsOpen, setAnnouncementsOpen] = useState(false);

    if (!user) return null;

    const getLinks = () => {
        switch (user.role) {
            case 'intern':
                return [
                    { to: '/intern/dashboard', label: 'Dashboard' },
                    { to: '/intern/logs', label: 'Daily Logs' },
                    { to: '/intern/schedule', label: 'Schedule' },
                    { to: '/intern/reports', label: 'Reports Section' },
                ];
            case 'supervisor':
                return [
                    { to: '/supervisor/dashboard', label: 'Dashboard' },
                    { to: '/supervisor/interns', label: 'Manage Interns' },
                    { to: '/supervisor/tasks', label: 'Manage Tasks' },
                    { to: '/supervisor/attendance', label: 'Monitor Attendance' },
                    { to: '/supervisor/reports', label: 'Reports Section' },
                ];
            case 'admin':
                return [
                    { to: '/admin/dashboard', label: 'Dashboard' },
                    { to: '/admin/interns', label: 'Manage interns' },
                    { to: '/admin/tasks', label: 'Manage tasks' },
                    { to: '/admin/attendance', label: 'Monitor attendance' },
                    { to: '/admin/reports', label: 'Reports Section' },
                ];
            default:
                return [];
        }
    };

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <button className="sidebar-close" onClick={onClose} aria-label="Close menu">
                    <X size={24} />
                </button>

                <div className="sidebar-header">
                    <img src="/heroIcon.png" alt="InternTrack" className="sidebar-logo-img" />
                    <div className="sidebar-brand">
                        <span className="sidebar-brand-intern">Intern</span>
                        <span className="sidebar-brand-track">Track</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        {getLinks().map((link) => (
                            <li key={link.to}>
                                <NavLink
                                    to={link.to}
                                    className={({ isActive }) =>
                                        isActive ? 'sidebar-link active' : 'sidebar-link'
                                    }
                                    onClick={onClose}
                                >
                                    {link.label}
                                </NavLink>
                            </li>
                        ))}
                        
                        <li>
                            <button 
                                className="sidebar-link sidebar-dropdown-toggle"
                                onClick={() => setAnnouncementsOpen(!announcementsOpen)}
                            >
                                <span>Announcements</span>
                                <ChevronDown 
                                    size={16} 
                                    className={`sidebar-dropdown-icon ${announcementsOpen ? 'open' : ''}`}
                                />
                            </button>
                            {announcementsOpen && (
                                <ul className="sidebar-submenu">
                                    <li>
                                        <NavLink 
                                            to={`/${user.role}/announcements/company`}
                                            className="sidebar-sublink"
                                            onClick={onClose}
                                        >
                                            Company Notices
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink 
                                            to={`/${user.role}/announcements/internship`}
                                            className="sidebar-sublink"
                                            onClick={onClose}
                                        >
                                            Internship Reminders
                                        </NavLink>
                                    </li>
                                </ul>
                            )}
                        </li>

                        <li>
                            <NavLink
                                to={`/${user.role}/settings`}
                                className={({ isActive }) =>
                                    isActive ? 'sidebar-link active' : 'sidebar-link'
                                }
                                onClick={onClose}
                            >
                                Settings
                            </NavLink>
                        </li>
                    </ul>
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
