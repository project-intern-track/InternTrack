import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import type { Users, OJTType } from '../../types/database.types';

// Predefined OJT roles
const OJT_ROLES = [
    'UI/UX Designer',
    'Back-end Developer',
    'Front-end Developer',
    'Fullstack Developer',
    'Mobile Developer',
    'Quality Assurance',
    'Data Analyst',
    'Project Manager',
    'Multimedia',
    'IT Support',
];

// Shape of the edit form data
interface EditFormData {
    full_name: string;
    email: string;
    ojt_role: string;
    ojt_id: string;
    start_date: string;
    required_hours: string;
    ojt_type: OJTType | '';
}

const ManageInterns = () => {
    const [interns, setInterns] = useState<Users[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Edit modal
    const [editingIntern, setEditingIntern] = useState<Users | null>(null);
    const [editForm, setEditForm] = useState<EditFormData>({
        full_name: '',
        email: '',
        ojt_role: '',
        ojt_id: '',
        start_date: '',
        required_hours: '',
        ojt_type: '',
    });
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    // Stats
    const [stats, setStats] = useState({ totalInterns: 0, totalRoles: 0, archivedInterns: 0 });

    // Filters
    const [searchInput, setSearchInput] = useState('');       // what the user types (immediate)
    const [debouncedSearch, setDebouncedSearch] = useState(''); // actual search sent to backend
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [startDateFilter, setStartDateFilter] = useState('all');
    const [requiredHoursFilter, setRequiredHoursFilter] = useState('all');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounce search input → debouncedSearch (300ms)
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(searchInput);
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchInput]);

    // Load interns with current filters
    const loadInterns = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await userService.fetchInterns({
                search: debouncedSearch || undefined,
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
    }, [debouncedSearch, sortDirection, roleFilter, statusFilter]);

    // Load stats on mount
    useEffect(() => {
        const loadMeta = async () => {
            try {
                const statsData = await userService.getInternStats();
                setStats(statsData);
            } catch (err) {
                console.error('Error loading stats:', err);
            }
        };
        loadMeta();
    }, []);

    // Reload interns when filters change
    useEffect(() => {
        loadInterns();
    }, [loadInterns]);

    // Client-side filtering & sorting for Start Date and Required Hours
    const filteredInterns = useMemo(() => {
        let result = [...interns];

        // --- Start Date filter ---
        if (startDateFilter === 'this-month') {
            const now = new Date();
            result = result.filter(i => {
                if (!i.start_date) return false;
                const d = new Date(i.start_date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
        } else if (startDateFilter === 'this-year') {
            const year = new Date().getFullYear();
            result = result.filter(i => {
                if (!i.start_date) return false;
                return new Date(i.start_date).getFullYear() === year;
            });
        }
        // Sort by start date
        if (startDateFilter === 'newest') {
            result.sort((a, b) => {
                const da = a.start_date ? new Date(a.start_date).getTime() : 0;
                const db = b.start_date ? new Date(b.start_date).getTime() : 0;
                return db - da;
            });
        } else if (startDateFilter === 'oldest') {
            result.sort((a, b) => {
                const da = a.start_date ? new Date(a.start_date).getTime() : 0;
                const db = b.start_date ? new Date(b.start_date).getTime() : 0;
                return da - db;
            });
        }

        // --- Required Hours filter ---
        if (requiredHoursFilter === '100-200') {
            result = result.filter(i => i.required_hours != null && i.required_hours >= 100 && i.required_hours <= 200);
        } else if (requiredHoursFilter === '201-300') {
            result = result.filter(i => i.required_hours != null && i.required_hours >= 201 && i.required_hours <= 300);
        } else if (requiredHoursFilter === '301-400') {
            result = result.filter(i => i.required_hours != null && i.required_hours >= 301 && i.required_hours <= 400);
        }
        // Sort by required hours
        if (requiredHoursFilter === 'highest') {
            result.sort((a, b) => (b.required_hours ?? 0) - (a.required_hours ?? 0));
        } else if (requiredHoursFilter === 'lowest') {
            result.sort((a, b) => (a.required_hours ?? 0) - (b.required_hours ?? 0));
        }

        return result;
    }, [interns, startDateFilter, requiredHoursFilter]);

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

    // ---------- Edit modal helpers ----------
    const openEditModal = (intern: Users) => {
        setEditingIntern(intern);
        setEditForm({
            full_name: intern.full_name ?? '',
            email: intern.email ?? '',
            ojt_role: intern.ojt_role ?? '',
            ojt_id: intern.ojt_id?.toString() ?? '',
            start_date: intern.start_date ?? '',
            required_hours: intern.required_hours?.toString() ?? '',
            ojt_type: intern.ojt_type ?? '',
        });
        setEditError(null);
        document.body.style.overflow = 'hidden';
    };

    const closeEditModal = () => {
        setEditingIntern(null);
        setEditError(null);
        document.body.style.overflow = '';
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleEditSave = async () => {
        if (!editingIntern) return;

        // Basic validation
        if (!editForm.full_name.trim()) {
            setEditError('Full name is required.');
            return;
        }
        if (!editForm.email.trim()) {
            setEditError('Email is required.');
            return;
        }

        try {
            setSaving(true);
            setEditError(null);

            const updates: Partial<Users> = {
                full_name: editForm.full_name.trim(),
                email: editForm.email.trim(),
                ojt_role: editForm.ojt_role.trim() || undefined,
                ojt_id: editForm.ojt_id ? parseInt(editForm.ojt_id, 10) : undefined,
                start_date: editForm.start_date || undefined,
                required_hours: editForm.required_hours ? parseInt(editForm.required_hours, 10) : undefined,
                ojt_type: (editForm.ojt_type as OJTType) || undefined,
            };

            await userService.updateIntern(editingIntern.id, updates);
            closeEditModal();
            // Refresh the table and stats
            await loadInterns();
            const statsData = await userService.getInternStats();
            setStats(statsData);
        } catch (err) {
            setEditError(err instanceof Error ? err.message : 'Failed to update intern.');
        } finally {
            setSaving(false);
        }
    };

    // Export to CSV
    const handleExportCSV = () => {
        if (filteredInterns.length === 0) return;

        const headers = ['Name', 'Role', 'Email', 'OJT ID', 'Start Date', 'Required Hours', 'Status'];
        const rows = filteredInterns.map(intern => [
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
        <div style={{ maxWidth: '100%', padding: '0', overflow: 'hidden' }}>
            {/* Header Section */}
            <div className="manage-interns-header">
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
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
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
                        style={{ paddingRight: '2.5rem', width: '100%' }}
                        value={sortDirection}
                        onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                    >
                        <option value="asc">Name: A → Z</option>
                        <option value="desc">Name: Z → A</option>
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>

                <div className="filter-dropdown">
                    <select
                        className="select"
                        style={{ width: '100%' }}
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        {OJT_ROLES.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>

                <div className="filter-dropdown">
                    <select
                        className="select"
                        style={{ width: '100%' }}
                        value={startDateFilter}
                        onChange={(e) => setStartDateFilter(e.target.value)}
                    >
                        <option value="all">All Start Date</option>
                        <option value="newest">Newest to Oldest</option>
                        <option value="oldest">Oldest to Newest</option>
                        <option value="this-month">This Month</option>
                        <option value="this-year">This Year</option>
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>

                <div className="filter-dropdown-wide">
                    <select
                        className="select"
                        style={{ width: '100%' }}
                        value={requiredHoursFilter}
                        onChange={(e) => setRequiredHoursFilter(e.target.value)}
                    >
                        <option value="all">All Required Hours</option>
                        <option value="100-200">100-200 hours</option>
                        <option value="201-300">201-300 hours</option>
                        <option value="301-400">301-400 hours</option>
                        <option value="highest">Highest to Lowest</option>
                        <option value="lowest">Lowest to Highest</option>
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

            {/* Table Container - Scrollable */}
            <div className="table-container" style={{
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
                overflow: 'auto',
                backgroundColor: 'white',
                width: '100%',
                maxWidth: '100vw', // Ensure it doesn't exceed viewport width
                position: 'relative'
            }}>

                <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', textAlign: 'center' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#ff9800', color: 'white' }}>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: 'none', whiteSpace: 'nowrap' }}>Name</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: 'none', whiteSpace: 'nowrap' }}>Role</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: 'none', whiteSpace: 'nowrap' }}>Email Address</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: 'none', whiteSpace: 'nowrap' }}>OJT ID</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: 'none', whiteSpace: 'nowrap' }}>Start Date</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: 'none', whiteSpace: 'nowrap' }}>Required Hours</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: 'none', whiteSpace: 'nowrap' }}>Status</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: 'none', whiteSpace: 'nowrap' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: '#64748b' }}>
                                        <Loader2 size={24} className="spinner" />
                                        <span>Loading interns...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredInterns.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                                    No interns found.
                                </td>
                            </tr>
                        ) : (
                            filteredInterns.map((intern) => (
                                <tr key={intern.id} style={{ borderBottom: '1px solid #e5e5e5' }}>
                                    <td style={{ padding: '1rem', color: '#334155' }}>{intern.full_name}</td>
                                    <td style={{ padding: '1rem', color: '#334155' }}>{intern.ojt_role || '—'}</td>
                                    <td style={{ padding: '1rem', color: '#334155' }}>{intern.email}</td>
                                    <td style={{ padding: '1rem', color: '#334155' }}>{intern.ojt_id || '—'}</td>
                                    <td style={{ padding: '1rem', color: '#334155' }}>{formatDate(intern.start_date)}</td>
                                    <td style={{ padding: '1rem', color: '#334155' }}>{intern.required_hours ? `${intern.required_hours} hours` : '—'}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span
                                            style={{
                                                color: intern.status === 'active' ? '#22c55e' : '#8b5cf6',
                                                fontWeight: 500,
                                                textTransform: 'capitalize',
                                            }}
                                        >
                                            {intern.status}
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
                                                onClick={() => openEditModal(intern)}
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

            {/* ===== Edit Intern Modal ===== */}
            {editingIntern && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(2px)'
                }} onClick={closeEditModal}>
                    <div className="edit-modal-panel" onClick={(e) => e.stopPropagation()}>
                        {/* Heading */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ color: '#ea580c', margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Edit Intern Information</h2>
                        </div>

                        {editError && (
                            <div style={{
                                padding: '0.75rem 1rem',
                                marginBottom: '1.5rem',
                                backgroundColor: 'hsl(var(--danger) / 0.1)',
                                color: 'hsl(var(--danger))',
                                borderRadius: '8px',
                                border: '1px solid hsl(var(--danger) / 0.2)',
                                fontSize: '0.875rem',
                            }}>
                                {editError}
                            </div>
                        )}

                        {/* Full Name */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Full Name:</label>
                            <input
                                className="input"
                                name="full_name"
                                value={editForm.full_name}
                                onChange={handleEditChange}
                                placeholder="Enter full name"
                                style={{ width: '100%', backgroundColor: 'white' }}
                            />
                        </div>

                        {/* Email */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Email Address:</label>
                            <input
                                className="input"
                                name="email"
                                type="email"
                                value={editForm.email}
                                onChange={handleEditChange}
                                placeholder="Enter email address"
                                style={{ width: '100%', backgroundColor: 'white' }}
                            />
                        </div>

                        {/* OJT Role & OJT ID */}
                        <div className="modal-grid-2col">
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>OJT Role:</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        className="select"
                                        name="ojt_role"
                                        value={editForm.ojt_role}
                                        onChange={handleEditChange}
                                        style={{ width: '100%', backgroundColor: 'white' }}
                                    >
                                        <option value="">Select Role</option>
                                        {OJT_ROLES.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>OJT ID:</label>
                                <input
                                    className="input"
                                    name="ojt_id"
                                    type="number"
                                    value={editForm.ojt_id}
                                    onChange={handleEditChange}
                                    placeholder="e.g. 1101"
                                    style={{ width: '100%', backgroundColor: 'white' }}
                                />
                            </div>
                        </div>

                        {/* Start Date & Required Hours */}
                        <div className="modal-grid-2col">
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Start Date:</label>
                                <input
                                    className="input"
                                    name="start_date"
                                    type="date"
                                    value={editForm.start_date}
                                    onChange={handleEditChange}
                                    style={{ width: '100%', backgroundColor: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Required Hours:</label>
                                <input
                                    className="input"
                                    name="required_hours"
                                    type="number"
                                    value={editForm.required_hours}
                                    onChange={handleEditChange}
                                    placeholder="e.g. 600"
                                    style={{ width: '100%', backgroundColor: 'white' }}
                                />
                            </div>
                        </div>

                        {/* OJT Type */}
                        <div style={{ marginBottom: '3rem' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>OJT Type:</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    className="select"
                                    name="ojt_type"
                                    value={editForm.ojt_type}
                                    onChange={handleEditChange}
                                    style={{ width: '100%', backgroundColor: 'white' }}
                                >
                                    <option value="">Select OJT Type</option>
                                    <option value="required">Required</option>
                                    <option value="voluntary">Voluntary</option>
                                </select>
                                <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="row" style={{ justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                className="btn"
                                onClick={closeEditModal}
                                disabled={saving}
                                style={{ backgroundColor: 'white', color: '#ea580c', border: 'none', padding: '0.75rem 1.5rem' }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleEditSave}
                                disabled={saving}
                                style={{ backgroundColor: '#ff8c42', border: 'none', padding: '0.75rem 1.5rem' }}
                            >
                                {saving ? <Loader2 className="spinner" size={18} /> : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageInterns;
