import { Bell, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopBarProps {
    onMenuClick?: () => void;
}

const TopBar = ({ onMenuClick }: TopBarProps) => {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="bg-[#e8ddd0] mx-4 mt-4 md:mx-8 md:mt-6 p-4 md:px-8 flex justify-between items-center rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 md:gap-4">
                {onMenuClick && (
                    <button 
                        onClick={onMenuClick} 
                        className="p-1.5 md:p-2 -ml-2 bg-transparent border-none text-[#333] hover:text-[#ff8c42] cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff8c42]/50 rounded-lg" 
                        aria-label="Toggle menu"
                    >
                        <Menu size={24} />
                    </button>
                )}
                
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden flex items-center justify-center text-[#555] font-semibold text-base shrink-0">
                        {user.avatarUrl && !user.avatarUrl.includes('ui-avatars.com') ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <svg
                                width="100%"
                                height="100%"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
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
                    <div className="flex flex-col">
                        <div className="font-bold text-lg md:text-xl text-black leading-tight">{user.name}</div>
                        <div className="text-sm md:text-[0.9375rem] text-[#ff8c42] capitalize leading-tight font-medium">{user.role}</div>
                    </div>
                </div>
            </div>
            <button className="p-2 bg-transparent border-none cursor-pointer text-[#333] hover:text-[#ff8c42] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff8c42]/50 rounded-lg" aria-label="Notifications">
                <Bell size={20} />
            </button>
        </div>
    );
};

export default TopBar;
