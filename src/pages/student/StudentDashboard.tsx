import { useAuth } from '../../context/AuthContext';

const StudentDashboard = () => {
    const { user } = useAuth();

    return (
        <div>
            <h1>Welcome back, {user?.name}!</h1>
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>Student Dashboard</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
                <div className="card">
                    <h3>Total Hours</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>120/400</p>
                </div>
                <div className="card">
                    <h3>Pending Logs</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>2</p>
                </div>
                <div className="card">
                    <h3>Tasks Completed</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>15</p>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
