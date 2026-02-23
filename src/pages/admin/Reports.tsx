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
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const interns = [
        {
            name: 'Kevin Lim',
            email: 'kevinlim@gmail.com',
            role: 'Fullstack Developer',
            hours: '400h',
            attendance: '75%',
            status: 'Active',
            lastUpdate: '2 hours ago'
        },
        {
            name: 'Alex John Ramirez',
            email: 'alexjohnramirez@email.com',
            role: 'Frontend Developer',
            hours: '300h',
            attendance: '45%',
            status: 'Active',
            lastUpdate: '5 hours ago'
        },
        {
            name: 'Bianca Louise Santos',
            email: 'bianca.santos@email.com',
            role: 'UI/UX Designer',
            hours: '450h',
            attendance: '65%',
            status: 'Active',
            lastUpdate: '1 hour ago'
        },
        {
            name: 'Jewel Gonzales',
            email: 'jewelgonzales@email.com',
            role: 'Data Analyst',
            hours: '486h',
            attendance: '96%',
            status: 'Active',
            lastUpdate: '7 hours ago'
        },
        {
            name: 'Alex Wilson',
            email: 'alex.w@email.com',
            role: 'Mobile Dev',
            hours: '450h',
            attendance: '94%',
            status: 'Active',
            lastUpdate: '6 hours ago'
        },
        {
            name: 'Lisa Brown',
            email: 'lisabrown@email.com',
            role: 'QA Tester',
            hours: '300h',
            attendance: '100%',
            status: 'Completed',
            lastUpdate: '1 week ago'
        }
    ];

    const processedInterns = interns.map(intern => ({
        ...intern,
        status: intern.attendance === '100%' ? 'Completed' : intern.status
    }));

    const filteredInterns = processedInterns.filter(intern => {
        const matchesStatus = filterStatus === 'all' || 
            (filterStatus === 'active' && intern.status === 'Active') ||
            (filterStatus === 'completed' && intern.status === 'Completed');
        
        const matchesSearch = searchTerm === '' || 
            intern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            intern.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesStatus && matchesSearch;
    });

    return (
        <div>
            <h1 style={{ color: '#ff8800', fontSize: '2rem', margin: 0 }}>Reports Section</h1>
            <h2 style={{ fontSize: '1.2rem', margin: '0.5rem 0', color: '#2b2a2a' }}>Weekly/Monthly Summaries</h2>

            {/* Filter and Search Container */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#F9F7F4',
                borderRadius: '12px',
                border: '1px solid #777777'
            }}>
                {/* Search Bar */}
                <div style={{
                    position: 'relative',
                    flex: '1',
                    minWidth: '200px'
                }}>
                    <Search
                        size={20}
                        style={{
                            position: 'absolute',
                            left: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#666'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search by name or email"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            paddingLeft: '3rem',
                            width: '100%',
                            height: '40px',
                            border: '1px solid #777777',
                            borderRadius: '8px',
                            outline: 'none',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                {/* Dropdown Filter */}
                <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                        height: '40px',
                        padding: '0 1rem',
                        border: '1px solid #777777',
                        borderRadius: '8px',
                        outline: 'none',
                        fontSize: '1rem',
                        minWidth: '180px',
                        backgroundColor: 'white'
                    }}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                </select>

                {/* Export Button */}
                <button className="btn btn-primary" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    height: '40px',
                    padding: '0 1.5rem',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: '#ff8800',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '1rem'
                }}>
                    <Download size={16} />
                    Export All
                </button>
            </div>

            {/* Cards Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1.5rem',
                marginTop: '2rem'
            }}>
                {filteredInterns.map((intern, index) => (
                    <InternCard key={index} {...intern} />
                ))}
            </div>
        </div>
    );
};

export default Reports;
