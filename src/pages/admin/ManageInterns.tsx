import { useState, useEffect, useCallback } from 'react';
import {
    Search,
    Filter,
    Pencil,
    Archive,
    ChevronDown,
    Download,
    Loader2
} from 'lucide-react';
import { userService } from '../../services/userServices';
import type { Users } from '../../types/database.types';

const ManageInterns = () => {
    const [interns, setInterns] = useState<Users[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Stats
    const [stats, setStats] = useState({ totalInterns: 0, totalRoles: 0, archivedInterns: 0 });

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);

    // Load interns with current filters
    const loadInterns = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await userService.fetchInterns({
                search: searchTerm || undefined,
                role: roleFilter,
                status: statusFilter,
                sortDirection,
            });
            setInterns(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch interns');
        } finally {
            setLoading(false);
        }
    }, [searchTerm, sortDirection, roleFilter, statusFilter]);

    // Load stats and roles on mount
    useEffect(() => {
        const loadMeta = async () => {
            try {
                const [statsData, roles] = await Promise.all([
                    userService.getInternStats(),
                    userService.getOjtRoles(),
                ]);
                setStats(statsData);
                setAvailableRoles(roles);
            } catch (err) {
                console.error('Error loading stats/roles:', err);
            }
        };
        loadMeta();
    }, []);

    // Reload interns when filters change
    useEffect(() => {
        loadInterns();
    }, [loadInterns]);

    // Handle archive toggle
    const handleArchiveToggle = async (intern: Users) => {
        try {
            await userService.toggleArchiveIntern(intern.id, intern.status);
            // Refresh both the list and stats
            await loadInterns();
            const statsData = await userService.getInternStats();
            setStats(statsData);
        } catch (err) {
            console.error('Error toggling archive:', err);
            alert(err instanceof Error ? err.message : 'Failed to update intern');
        }
    };

    // Export to CSV
    const handleExportCSV = () => {
        if (interns.length === 0) return;

        const headers = ['Name', 'Role', 'Email', 'OJT ID', 'Start Date', 'Required Hours', 'Status'];
        const rows = interns.map(intern => [
            intern.full_name,
            intern.ojt_role || '',
            intern.email,
            intern.ojt_id?.toString() || '',
            intern.start_date || '',
            intern.required_hours ? `${intern.required_hours} hours` : '',
            intern.status,
        ]);

        const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `interns_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Format the date for display
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    };

    return (
        <div className="container" style={{ maxWidth: '100%', padding: '0' }}>
            {/* Header Section */}
            <div className="row row-between" style={{ marginBottom: '2rem' }}>
                <h1 style={{ color: 'hsl(var(--orange))', fontSize: '2rem', margin: 0 }}>Manage Interns</h1>
                <button className="btn btn-primary" onClick={handleExportCSV} style={{ gap: '0.5rem' }}>
                    <Download size={18} />
                    Export to CSV
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Total Interns</span>
                    </div>
                    <div className="stat-value">{stats.totalInterns}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Total Roles</span>
                    </div>
                    <div className="stat-value">{stats.totalRoles}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Archived Interns</span>
                    </div>
                    <div className="stat-value">{stats.archivedInterns}</div>
                </div>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div className="input-group" style={{ position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                    <input
                        type="text"
                        className="input"
                        placeholder="Search by name, role, email, or OJT ID"
                        style={{ paddingLeft: '3rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Filter Section */}
            <div className="row" style={{
                marginBottom: '1.5rem',
                gap: '1rem',
                flexWrap: 'wrap',
                border: '1px solid hsl(var(--border))',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(var(--card))',
                alignItems: 'center'
            }}>
                <div className="row" style={{ alignItems: 'center', gap: '0.5rem', minWidth: 'fit-content' }}>
                    <Filter size={20} />
                    <span style={{ fontWeight: 600 }}>Filters:</span>
                </div>

                <div style={{ position: 'relative', minWidth: '150px' }}>
                    <select
                        className="select"
                        style={{ paddingRight: '2.5rem' }}
                        value={sortDirection}
                        onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                    >
                        <option value="asc">Name: A → Z</option>
                        <option value="desc">Name: Z → A</option>
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>

                <div style={{ position: 'relative', minWidth: '150px' }}>
                    <select
                        className="select"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        {availableRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>

                <div style={{ position: 'relative', minWidth: '150px' }}>
                    <select className="select" disabled>
                        <option>All Start Date</option>
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>

                <div style={{ position: 'relative', minWidth: '150px' }}>
                    <select className="select" disabled>
                        <option>All Required Hours</option>
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>

                <div style={{ position: 'relative', minWidth: '150px' }}>
                    <select
                        className="select"
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

            {/* Error Banner */}
            {error && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    backgroundColor: 'hsl(var(--danger) / 0.1)',
                    color: 'hsl(var(--danger))',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid hsl(var(--danger) / 0.2)',
                }}>
                    {error}
                </div>
            )}

            {/* Table */}
            <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border))' }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Email Address</th>
                            <th>OJT ID</th>
                            <th>Start Date</th>
                            <th>Required Hours</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                                        <Loader2 size={24} className="spinner" />
                                        <span>Loading interns...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : interns.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'hsl(var(--muted-foreground))' }}>
                                    No interns found.
                                </td>
                            </tr>
                        ) : (
                            interns.map((intern) => (
                                <tr key={intern.id}>
                                    <td>{intern.full_name}</td>
                                    <td>{intern.ojt_role || '—'}</td>
                                    <td>{intern.email}</td>
                                    <td>{intern.ojt_id || '—'}</td>
                                    <td>{formatDate(intern.start_date)}</td>
                                    <td>{intern.required_hours ? `${intern.required_hours} hours` : '—'}</td>
                                    <td>
                                        <span
                                            style={{
                                                color: intern.status === 'active' ? 'hsl(var(--success))' : '#8b5cf6',
                                                fontWeight: 500,
                                                textTransform: 'capitalize',
                                            }}
                                        >
                                            {intern.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="row row-sm">
                                            <button className="btn btn-ghost btn-sm" style={{ padding: '0.25rem' }} title="Edit">
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                style={{ padding: '0.25rem' }}
                                                title={intern.status === 'active' ? 'Archive' : 'Restore'}
                                                onClick={() => handleArchiveToggle(intern)}
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

export default ManageInterns;
