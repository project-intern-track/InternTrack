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

            {/* Stats Cards */}
            <div className="stats-grid" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center', gap: '5rem' }}>
                <div style={{
                    background: '#F9F7F4',
                    borderRadius: '20px',
                    boxShadow: '0px 4px 4px 0px #00000040',
                    padding: '1.5rem',
                    textAlign: 'center',
                    width: '350px'
                }}>
                   <div style={{ fontSize: '1.375rem', fontWeight: '600', color: '#000000', marginBottom: '0.5rem' }}>Total Supervisors</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '600', color: '#2b2a2a' }}>0</div>
                </div>
                <div style={{
                    background: '#F9F7F4',
                    borderRadius: '20px',
                    boxShadow: '0px 4px 4px 0px #00000040',
                    padding: '1.5rem',
                    textAlign: 'center',
                    width: '350px'
                }}>
                    <div style={{ fontSize: '1.375rem', fontWeight: '600', color: '#000000', marginBottom: '0.5rem' }}>Active Supervisors</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '600', color: '#2b2a2a' }}>0</div>
                </div>
                <div style={{
                    background: '#F9F7F4',
                    borderRadius: '20px',
                    boxShadow: '0px 4px 4px 0px #00000040',
                    padding: '1.5rem',
                    textAlign: 'center',
                    width: '350px'
                }}>
                    <div style={{ fontSize: '1.375rem', fontWeight: '600', color: '#000000', marginBottom: '0.5rem' }}>Archived Supervisors</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '600', color: '#2b2a2a' }}>0</div>
                </div>
            </div>
        </div>
    );
};

export default ManageSupervisors;