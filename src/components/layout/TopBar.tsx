import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TopBar = () => {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="topbar">
            <div className="topbar-user">
                <div className="topbar-avatar">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} />
                    ) : (
                        <span>{user.name.split(' ').map(n => n[0]).join('').toUpperCase()}</span>
                    )}
                </div>
                <div className="topbar-user-info">
                    <div className="topbar-user-name">{user.name}</div>
                    <div className="topbar-user-role">{user.role}</div>
                </div>
            </div>
            <button className="topbar-notification" aria-label="Notifications">
                <Bell size={20} />
            </button>
        </div>
    );
};

export default TopBar;
