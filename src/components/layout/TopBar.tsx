import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TopBar = () => {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="topbar">
            <div className="topbar-user">
                <div className="topbar-avatar">
                    {user.avatarUrl && !user.avatarUrl.includes('ui-avatars.com') ? (
                        <img src={user.avatarUrl} alt={user.name} />
                    ) : (
                        <svg
                            width="44"
                            height="44"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#555"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="10" r="3" />
                            <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                        </svg>
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
