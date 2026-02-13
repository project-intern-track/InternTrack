import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import { useNavigate } from 'react-router-dom';
import { Briefcase, User, Users, ShieldCheck } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = (role: UserRole) => {
        login(role);
        navigate(`/${role}/dashboard`);
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <Briefcase size={40} /> InternTrack
                </h1>
                <p style={{ color: 'hsl(var(--muted-foreground))', marginTop: '0.5rem' }}>
                    Centralized Internship Management Platform
                </p>
            </div>

            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Select User Role</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <button onClick={() => handleLogin('intern')} className="btn" style={{ justifyContent: 'flex-start', border: '1px solid hsl(var(--border))', background: 'white' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                            <User size={20} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: '600' }}>Intern</div>
                            <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>Access logs, tasks, and reports</div>
                        </div>
                    </button>

                    <button onClick={() => handleLogin('supervisor')} className="btn" style={{ justifyContent: 'flex-start', border: '1px solid hsl(var(--border))', background: 'white' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'hsl(var(--secondary) / 0.1)', color: 'hsl(var(--secondary))' }}>
                            <Users size={20} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: '600' }}>Supervisor</div>
                            <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>Manage interns and verify logs</div>
                        </div>
                    </button>

                    <button onClick={() => handleLogin('admin')} className="btn" style={{ justifyContent: 'flex-start', border: '1px solid hsl(var(--border))', background: 'white' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'hsl(var(--accent) / 0.1)', color: 'hsl(var(--accent))' }}>
                            <ShieldCheck size={20} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: '600' }}>Administrator</div>
                            <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>System settings and user management</div>
                        </div>
                    </button>

                </div>
            </div>
        </div>
    );
};

export default Login;
