import { Bell } from 'lucide-react';
import { useParams } from 'react-router-dom';

const Announcements = () => {
    const { type } = useParams<{ type: string }>();
    
    const title = type === 'company' ? 'Company Notices' : 'Internship Reminders';
    const description = type === 'company' 
        ? 'Stay updated with important company announcements and news.'
        : 'View reminders and important dates for your internship.';

    return (
        <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-5 text-[#FF8800]">
                    <Bell size={36} />
                </div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
                    {description}
                </p>
                <span className="inline-block px-4 py-1.5 rounded-full bg-[#FF8800] text-white text-xs font-bold tracking-wide shadow-[0_0_12px_rgba(255,136,0,0.3)]">
                    Coming Soon
                </span>
            </div>
        </div>
    );
};

export default Announcements;
