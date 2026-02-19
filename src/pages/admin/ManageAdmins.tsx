import { useState } from 'react';
import {
    Search,
    Filter,
    Pencil,
    Archive,
    ChevronDown,
    Plus
} from 'lucide-react';

// Mock data based on the provided image
const MOCK_ADMINS = [
    { id: 1, name: 'Aaron Cruz', email: 'InternTrackAdmin01@gmail.com', dateCreated: '2026-01-09', status: 'Archived' },
    { id: 2, name: 'Jane Doe', email: 'InternTrackAdmin02@gmail.com', dateCreated: '2026-01-09', status: 'Active' },
    { id: 3, name: 'Mae Santos', email: 'InternTrackAdmin03@gmail.com', dateCreated: '2026-01-10', status: 'Active' },
];

const ManageAdmins = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Filter logic (basic implementation for the mock data)
    const filteredAdmins = MOCK_ADMINS.filter(admin => {
        const matchesSearch = admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || admin.status.toLowerCase() === statusFilter.toLowerCase();
        // Date filter is a placeholder as per requirements
        return matchesSearch && matchesStatus;
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div style={{ maxWidth: '100%', padding: '0', overflow: 'hidden' }}>
            {/* Header Section */}
            <div className="manage-interns-header">
                <h1 style={{ color: 'hsl(var(--orange))', fontSize: '2rem', margin: 0 }}>Manage Admins</h1>
                <button className="btn btn-primary" style={{ gap: '0.5rem' }}>
                    <Plus size={18} />
                    Add Admin
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Total Admin</span>
                    </div>
                    <div className="stat-value">3</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Active Admins</span>
                    </div>
                    <div className="stat-value">2</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Archived Admins</span>
                    </div>
                    <div className="stat-value">1</div>
                </div>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div className="input-group" style={{ position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                    <input
                        type="text"
                        className="input"
                        placeholder="Search by name or email"
                        style={{ paddingLeft: '3rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Filter Section */}
            <div className="manage-interns-filters">
                <div className="row" style={{ alignItems: 'center', gap: '0.5rem', minWidth: 'fit-content' }}>
                    <Filter size={20} />
                    <span style={{ fontWeight: 600 }}>Filters:</span>
                </div>

                <div className="filter-dropdown">
                    <select
                        className="select"
                        style={{ width: '100%' }}
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    >
                        <option value="all">All Date Created</option>
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>

                <div className="filter-dropdown">
                    <select
                        className="select"
                        style={{ width: '100%' }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
            </div>

            {/* Table Container - Scrollable */}
            <div className="table-container" style={{
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
                overflow: 'auto',
                backgroundColor: 'white',
                width: '100%',
                maxWidth: '100vw',
                position: 'relative'
            }}>
                <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'center' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#ff9800', color: 'white' }}>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: 'none', whiteSpace: 'nowrap' }}>Name</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: 'none', whiteSpace: 'nowrap' }}>Email Address</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: 'none', whiteSpace: 'nowrap' }}>Date Created</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: 'none', whiteSpace: 'nowrap' }}>Status</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: 'none', whiteSpace: 'nowrap' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAdmins.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                                    No admins found.
                                </td>
                            </tr>
                        ) : (
                            filteredAdmins.map((admin) => (
                                <tr key={admin.id} style={{ borderBottom: '1px solid #e5e5e5' }}>
                                    <td style={{ padding: '1rem', color: '#334155' }}>{admin.name}</td>
                                    <td style={{ padding: '1rem', color: '#334155' }}>{admin.email}</td>
                                    <td style={{ padding: '1rem', color: '#334155' }}>{formatDate(admin.dateCreated)}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span
                                            style={{
                                                color: admin.status === 'Active' ? '#22c55e' : '#8b5cf6',
                                                fontWeight: 500,
                                            }}
                                        >
                                            {admin.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                            <button
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#64748b',
                                                    padding: '4px'
                                                }}
                                                title="Edit"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#64748b',
                                                    padding: '4px'
                                                }}
                                                title="Archive"
                                            >
                                                <Archive size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageAdmins;
