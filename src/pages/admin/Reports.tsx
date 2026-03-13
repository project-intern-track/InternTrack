import { Search, Download } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    const navigate = useNavigate();

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
    const handleClick = () => {
        const internId = name.toLowerCase().replace(/\s+/g, '-');
        navigate(`/admin/reports/${internId}`);
    };
    return (
        <div className="intern-card" style={{
            background: '#F9F7F4',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid #e5e5e5',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            cursor: 'pointer'
        }}
            onClick={handleClick}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}>
            {/* Header */}
            <div className="intern-card-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e5e5e5' }}>
                <div className="intern-card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 className="intern-card-name" style={{ margin: '0', color: '#2b2a2a', fontSize: '1.1rem', fontWeight: '600' }}>{name}</h3>
                    <span style={{
                        ...getStatusStyle(status),
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px'
                    }}>{status}</span>
                </div>
                <p className="intern-card-email" style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>{email}</p>
            </div>

            {/* Main Content */}
            <div className="intern-card-body" style={{ marginBottom: '1rem' }}>
                <div className="intern-card-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>Role:</span>
                    <span className="intern-card-value" style={{ color: '#2b2a2a', fontSize: '0.9rem', fontWeight: '500' }}>{role}</span>
                </div>
                <div className="intern-card-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>Hours:</span>
                    <span className="intern-card-value" style={{ color: '#2b2a2a', fontSize: '0.9rem', fontWeight: '500' }}>{hours}</span>
                </div>
                <div className="intern-card-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>Attendance:</span>
                    <span className="intern-card-value" style={{ color: '#2b2a2a', fontSize: '0.9rem', fontWeight: '500' }}>{attendance}</span>
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
        <div className="reports-page">
            <style>{`
                .reports-page {
                    width: 100%;
                    box-sizing: border-box;
                    padding: 1.5rem;
                    overflow-x: hidden;
                }
                .reports-filters {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                    align-items: center;
                    margin-top: 2rem;
                    padding: 1rem;
                    background-color: #F9F7F4;
                    border-radius: 12px;
                    border: 1px solid #777777;
                    box-sizing: border-box;
                    width: 100%;
                }
                .reports-search {
                    position: relative;
                    flex: 1 1 280px;
                    min-width: 220px;
                }
                .reports-select {
                    flex: 0 1 200px;
                    min-width: 160px;
                }
                .reports-export {
                    flex: 0 0 auto;
                    min-width: 160px;
                }
                .reports-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                    gap: 1.5rem;
                    margin-top: 2rem;
                }
                .intern-card,
                .intern-card * {
                    min-width: 0;
                }
                .intern-card-header-row,
                .intern-card-row {
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }
                .intern-card-name,
                .intern-card-email,
                .intern-card-value {
                    overflow-wrap: anywhere;
                    word-break: break-word;
                }
                @media (max-width: 480px) {
                    .reports-search,
                    .reports-select,
                    .reports-export {
                        flex: 1 1 100%;
                        min-width: 100%;
                    }
                    .reports-export {
                        justify-content: center;
                    }
                    .intern-card-row {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                }
            `}</style>
            <h1 style={{ color: '#ff8800', fontSize: '2rem', margin: 0 }}>Reports Section</h1>
            <h2 style={{ fontSize: '1.2rem', margin: '0.5rem 0', color: '#2b2a2a' }}>Weekly/Monthly Summaries</h2>

            {/* Filter and Search Container */}
            <div className="reports-filters">
                {/* Search Bar */}
                <div className="reports-search">
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
                    className="reports-select"
                    style={{
                        height: '40px',
                        padding: '0 1rem',
                        paddingRight: '2.5rem',
                        border: '1px solid #777777',
                        borderRadius: '8px',
                        outline: 'none',
                        fontSize: '1rem',
                        minWidth: '180px',
                        backgroundColor: 'white',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '16px'
                    }}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                </select>

                {/* Export Button */}
                <button className="btn btn-primary reports-export" style={{
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
            <div className="reports-grid">
                {filteredInterns.map((intern, index) => (
                    <InternCard key={index} {...intern} />
                ))}
            </div>
        </div>
    );
};

export default Reports;
