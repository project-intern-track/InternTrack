import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    X,
    LogOut,
    Loader2
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar = ({ isOpen = true, onClose }: SidebarProps) => {
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
                    { to: '/supervisor/SupervisorAnnouncements', label: 'Announcements' },
                    { to: '/supervisor/SupervisorApprovals', label: 'Approve Tasks' },
                    { to: '/supervisor/InternPerformance', label: 'Intern Performance' },
                    { to: '/supervisor/Evaluations', label: 'Evaluations' },
                    { to: '/supervisor/MonitorAttendance', label: 'Attendance' },
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
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <button
                        className="sidebar-logout-btn"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                    >
                        {isLoggingOut ? (
                            <>
                                <Loader2 size={20} className="spinner" />
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
            </aside>
        </>
    );
};

export default Sidebar;
