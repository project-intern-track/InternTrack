import { Search, Download } from 'lucide-react';
import { useState } from 'react';

interface InternCardProps {
    name: string;
    email: string;
    role: string;
    hours: string;
    attendance: string;
    status: string;
    lastUpdate: string;
}

const InternCard = ({ name, email, role, hours, attendance, status, lastUpdate }: InternCardProps) => {
    const getStatusStyle = (status: string) => {
        if (status === 'Active') {
            return {
                backgroundColor: '#dcfce7',
                color: '#166534'
            };
        } else if (status === 'Completed') {
            return {
                backgroundColor: '#dbeafe',
                color: '#1e40af'
            };
        }
        return {};
    };

    return (
        <div style={{
            background: '#F9F7F4',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid #e5e5e5',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e5e5e5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: '0', color: '#2b2a2a', fontSize: '1.1rem', fontWeight: '600' }}>{name}</h3>
                    <span style={{
                        ...getStatusStyle(status),
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px'
                    }}>{status}</span>
                </div>
                <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>{email}</p>
            </div>

            {/* Main Content */}
            <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>Role:</span>
                    <span style={{ color: '#2b2a2a', fontSize: '0.9rem', fontWeight: '500' }}>{role}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>Hours:</span>
                    <span style={{ color: '#2b2a2a', fontSize: '0.9rem', fontWeight: '500' }}>{hours}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>Attendance:</span>
                    <span style={{ color: '#2b2a2a', fontSize: '0.9rem', fontWeight: '500' }}>{attendance}</span>
                </div>
            </div>

            {/* Footer */}
            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #e5e5e5' }}>
                <p style={{ margin: '0', color: '#999', fontSize: '0.8rem' }}>Last update: {lastUpdate}</p>
            </div>
        </div>
    );
};
const Reports = () => {
    return (
        <div className="placeholder-page">
            <div className="placeholder-icon">
            </div>
            <h1 className="placeholder-title">Reports Section</h1>
            <p className="placeholder-description">
                Generate comprehensive reports and analytics for the entire program.
            </p>
            <div className="placeholder-badge">Coming Soon</div>
        </div>
    );
};

export default Reports;
