import { Bell } from 'lucide-react';
import { useParams } from 'react-router-dom';

const Announcements = () => {
    const { type } = useParams<{ type: string }>();
    
    const title = type === 'company' ? 'Company Notices' : 'Internship Reminders';
    const description = type === 'company' 
        ? 'Post and manage company announcements for interns.'
        : 'Create and manage internship reminders and important dates.';

    return (
        <div className="placeholder-page">
            <div className="placeholder-icon">
                <Bell size={48} />
            </div>
            <h1 className="placeholder-title">{title}</h1>
            <p className="placeholder-description">
                {description}
            </p>
            <div className="placeholder-badge">Coming Soon</div>
        </div>
    );
};

export default Announcements;
