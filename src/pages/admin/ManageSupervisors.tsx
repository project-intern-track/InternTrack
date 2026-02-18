import { Plus } from 'lucide-react';

const ManageSupervisors = () => {
    return (
        <div className="container" style={{ maxWidth: '100%', padding: '0' }}>
            {/* Header Section */}
            <div className="row row-between" style={{ marginBottom: '2rem' }}>
                <h1 style={{ color: 'hsl(var(--orange))', fontSize: '2rem', margin: 0 }}>Manage Supervisors</h1>
                <button className="btn btn-primary" style={{ gap: '0.5rem' }}>
                    <Plus size={18} />
                    Add Supervisor
                </button>
            </div>
        </div>
    );
};

export default ManageSupervisors;