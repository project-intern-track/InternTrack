import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    FileText,
    Calendar,
    Settings,
    LogOut,
    Users,
    Briefcase
} from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useAuth();

    if (!user) return null;

    const getLinks = () => {
        switch (user.role) {
            case 'intern':
                return [
                    { to: '/intern/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                    { to: '/intern/logs', icon: FileText, label: 'Daily Logs' },
                    { to: '/intern/schedule', icon: Calendar, label: 'Schedule' },
                ];
            case 'supervisor':
                return [
                    { to: '/supervisor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                    { to: '/supervisor/interns', icon: Users, label: 'Interns' },
                    { to: '/supervisor/approvals', icon: FileText, label: 'Approvals' },
                ];
            case 'admin':
                return [
                    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                    { to: '/admin/users', icon: Users, label: 'User Management' },
                    { to: '/admin/settings', icon: Settings, label: 'System Settings' },
                ];
            default:
                return [];
        }
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <Briefcase size={20} />
                </div>
                <span className="sidebar-title">InternTrack</span>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    {getLinks().map((link) => (
                        <li key={link.to}>
                            <NavLink
                                to={link.to}
                                className={({ isActive }) =>
                                    isActive ? 'active-link' : 'nav-link'
                                }
                            >
                                <link.icon size={20} />
                                {link.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="avatar avatar-sm" style={{ backgroundColor: 'hsl(var(--sidebar-hover))', color: 'hsl(var(--sidebar-foreground))' }}>
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                        <div className="sidebar-user-name">{user.name}</div>
                        <div className="sidebar-user-role">{user.role}</div>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', color: 'hsl(var(--danger))' }}
                >
                    <LogOut size={18} /> Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
