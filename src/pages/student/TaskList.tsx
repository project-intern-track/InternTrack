import { ClipboardList } from 'lucide-react';

const TaskList = () => {
    return (
        <div className="placeholder-page">
            <div className="placeholder-icon">
                <ClipboardList size={48} />
            </div>
            <h1 className="placeholder-title">Task List</h1>
            <p className="placeholder-description">
                View and manage your assigned tasks, track progress, and submit completed work.
            </p>
            <div className="placeholder-badge">Coming Soon</div>
        </div>
    );
};

export default TaskList;
