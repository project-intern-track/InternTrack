import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const TopBar = () => {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="hidden lg:flex sticky top-0 z-50 bg-white dark:bg-slate-900/50 border-b border-gray-200 dark:border-white/5 h-16 px-6 items-center justify-between backdrop-blur-md">
            {/* Left side - spacing */}
            <div className="flex-1" />

            {/* Right side - user info and notifications */}
            <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <NotificationDropdown />

                {/* Divider */}
                <div className="h-6 w-px bg-gray-200 dark:bg-white/10" />

                {/* User Info */}
                <div className="flex items-center gap-3">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center"
                    >
                        {user.avatarUrl && !user.avatarUrl.includes('ui-avatars.com') ? (
                            <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="h-full w-full rounded-lg object-cover"
                            />
                        ) : (
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <circle cx="12" cy="10" r="3" />
                                <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                            </svg>
                        )}
                    </motion.div>
                    <div className="hidden sm:block">
                        <p className="text-sm font-bold text-gray-900 dark:text-white ">
                            {user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {user.role}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
