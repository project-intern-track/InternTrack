import { Search, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';

interface InternCardProps {
    id: number;
    name: string;
    email: string;
    role: string;
    hours: string;
    attendance: string;
    status: string;
    lastUpdate: string;
}

const InternCard = ({ id, name, email, role, hours, attendance, status, lastUpdate }: InternCardProps) => {
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
        navigate(`/admin/reports/${id}`);
    };
    return (
        <div style={{
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
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const response = await apiClient.get('/reports/interns/export', {
                params: { status: filterStatus },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `intern-reports-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const [interns, setInterns] = useState<InternCardProps[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/reports/interns');
            // The API returns an object 'data' containing the array
            setInterns(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const processedInterns = interns.map(intern => ({
        ...intern,
        status: intern.attendance === '100%' && intern.status === 'Active' ? 'Completed' : intern.status
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
        <div className="admin-page-shell">
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
                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="btn btn-primary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        height: '40px',
                        padding: '0 1.5rem',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: isExporting ? '#ccc' : '#ff8800',
                        color: 'white',
                        cursor: isExporting ? 'not-allowed' : 'pointer',
                        fontSize: '1rem'
                    }}>
                    <Download size={16} />
                    {isExporting ? 'Exporting...' : 'Export All'}
                </button>
            </div>

            {/* Cards Section */}
            {loading ? (
                <div style={{ marginTop: '2rem', textAlign: 'center', color: '#666' }}>Loading reports...</div>
            ) : filteredInterns.length === 0 ? (
                <div style={{ marginTop: '2rem', textAlign: 'center', color: '#666' }}>No interns found matching the filters.</div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1.5rem',
                    marginTop: '2rem'
                }}>
                    {filteredInterns.map((intern, index) => (
                        <InternCard key={intern.id || index} {...intern} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Reports;
