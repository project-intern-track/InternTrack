import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
    const { user } = useAuth();

    return (
        <div>
            <h1>Welcome back, {user?.name}!</h1>
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>Administrator Dashboard</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
                <div className="card">
                    <h3>Total Users</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>150</p>
                </div>
                <div className="card">
                    <h3>Partner Companies</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>12</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
