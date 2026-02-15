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
                    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                    { to: '/student/logs', icon: FileText, label: 'Daily Logs' },
                    { to: '/student/schedule', icon: Calendar, label: 'Schedule' },
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
        <aside style={{
            width: '260px',
            backgroundColor: 'hsl(var(--card))',
            borderRight: '1px solid hsl(var(--border))',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            left: 0,
            top: 0
        }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'hsl(var(--primary))', padding: '0.25rem', borderRadius: '4px', color: 'white', display: 'flex' }}>
                    <Briefcase size={20} />
                </div>
                <span style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>InternTrack</span>
            </div>

            <nav style={{ flex: 1, padding: '1rem' }}>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {getLinks().map((link) => (
                        <li key={link.to}>
                            <NavLink
                                to={link.to}
                                className={({ isActive }) =>
                                    isActive ? 'active-link' : 'nav-link'
                                }
                                style={({ isActive }) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    textDecoration: 'none',
                                    color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                    backgroundColor: isActive ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                                    fontWeight: isActive ? 500 : 400,
                                    transition: 'all 0.2s'
                                })}
                            >
                                <link.icon size={20} />
                                {link.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div style={{ padding: '1rem', borderTop: '1px solid hsl(var(--border))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0 0.5rem' }}>
                    <img
                        src={user.avatarUrl}
                        alt={user.name}
                        style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                    />
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', textTransform: 'capitalize' }}>{user.role}</div>
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
