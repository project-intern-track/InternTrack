import { useAuth } from '../../context/AuthContext';

const SupervisorDashboard = () => {
    const { user } = useAuth();

    return (
        <div>
            <h1>Welcome back, {user?.name}!</h1>
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>Supervisor Dashboard</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
                <div className="card">
                    <h3>Active Interns</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>8</p>
                </div>
                <div className="card">
                    <h3>Logs to Review</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'hsl(var(--warning))' }}>5</p>
                </div>
            </div>
        </div>
    );
};

export default SupervisorDashboard;
