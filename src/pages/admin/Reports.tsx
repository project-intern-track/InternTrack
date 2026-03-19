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

    const getStatusClass = (status: string) => {
        if (status === 'Active') {
            return 'report-status-badge active';
        } else if (status === 'Completed') {
            return 'report-status-badge completed';
        }
        return 'report-status-badge';
    };

    const handleClick = () => {
        navigate(`/admin/reports/${id}`);
    };

    return (
        <button type="button" className="report-intern-card" onClick={handleClick}>
            <div className="report-card-header">
                <div className="report-card-header-row">
                    <h3 className="report-card-name">{name}</h3>
                    <span className={getStatusClass(status)}>{status}</span>
                </div>
                <p className="report-card-email">{email}</p>
            </div>

            <div className="report-card-meta">
                <div className="report-card-meta-row">
                    <span>Role:</span>
                    <strong>{role}</strong>
                </div>
                <div className="report-card-meta-row">
                    <span>Hours:</span>
                    <strong>{hours}</strong>
                </div>
                <div className="report-card-meta-row">
                    <span>Attendance:</span>
                    <strong>{attendance}</strong>
                </div>
            </div>

            <div className="report-card-footer">
                <p>Last update: {lastUpdate}</p>
            </div>
        </button>
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
        <div className="admin-page-shell reports-page-shell">
            <div className="reports-header-block">
                <h1 className="reports-title">Reports Section</h1>
                <h2 className="reports-subtitle">Weekly/Monthly Summaries</h2>
            </div>

            <div className="reports-filter-bar">
                <div className="reports-search-wrap">
                    <Search size={20} className="reports-search-icon" />
                    <input
                        type="text"
                        className="reports-search-input"
                        placeholder="Search by name or email"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    className="reports-status-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                </select>

                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="btn btn-primary reports-export-btn"
                >
                    <Download size={16} />
                    {isExporting ? 'Exporting...' : 'Export All'}
                </button>
            </div>

            {loading ? (
                <div className="reports-empty-state">Loading reports...</div>
            ) : filteredInterns.length === 0 ? (
                <div className="reports-empty-state">No interns found matching the filters.</div>
            ) : (
                <div className="report-intern-grid">
                    {filteredInterns.map((intern, index) => (
                        <InternCard key={intern.id || index} {...intern} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Reports;
