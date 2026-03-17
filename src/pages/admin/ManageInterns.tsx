import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Pencil, AlertCircle, Search, Download, Filter, ChevronDown, Archive } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import { userService } from '../../services/userServices';
import { useRealtime } from '../../hooks/useRealtime';
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
    const [interns, setInterns] = useState<Users[] | null>(null);
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

    // Archive Confirmation Modal State
    const [archiveTarget, setArchiveTarget] = useState<Users | null>(null);

    // Stats
    const [stats, setStats] = useState<{ totalInterns: number, totalRoles: number, archivedInterns: number } | null>(null);

    // Filters
    const [searchInput, setSearchInput] = useState('');       // what the user types (immediate)
    const [debouncedSearch, setDebouncedSearch] = useState(''); // actual search sent to backend
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [startDateFilter, setStartDateFilter] = useState('all');
    const [requiredHoursFilter, setRequiredHoursFilter] = useState('all');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

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

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, sortDirection, roleFilter, statusFilter, startDateFilter, requiredHoursFilter]);

    // Load interns with current filters
    const loadInterns = useCallback(async () => {
        try {
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
        }

    }, [debouncedSearch, sortDirection, roleFilter, statusFilter]);

    // Load stats
    const loadStats = useCallback(async () => {
        try {
            const statsData = await userService.getInternStats();
            setStats(statsData);
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    }, []);

    // Load stats on mount
    useEffect(() => {
        loadStats();
    }, [loadStats]);

    // Reload interns when filters change
    useEffect(() => {
        loadInterns();
    }, [loadInterns]);

    // Re-fetch both list and stats whenever users table changes in real-time
    useRealtime('users', () => { loadInterns(); loadStats(); });

    // Client-side filtering & sorting for Start Date and Required Hours
    const filteredInterns = useMemo(() => {

        if (!interns) return [];

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

    // Pagination Derived State
    const totalPages = Math.ceil(filteredInterns.length / ITEMS_PER_PAGE);
    const paginatedInterns = filteredInterns.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Handle archive toggle — opens confirmation modal
    const handleArchiveToggle = (intern: Users) => {
        setArchiveTarget(intern);
    };

    // Confirm archive action
    const confirmArchive = async () => {
        if (!archiveTarget) return;
        try {
            await userService.toggleArchiveIntern(archiveTarget.id, archiveTarget.status);
            setArchiveTarget(null);
            // Refresh both the list and stats
            await loadInterns();
            const statsData = await userService.getInternStats();
            setStats(statsData);
        } catch (err) {
            console.error('Error toggling archive:', err);
            alert(err instanceof Error ? err.message : 'Failed to update intern');
            setArchiveTarget(null);
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
        const { name, value } = e.target;

        // Full Name: reject any numeric characters
        if (name === 'full_name' && /\d/.test(value)) {
            return;
        }

        // OJT ID: allow only digits, max 4 characters
        if (name === 'ojt_id') {
            if (value !== '' && (!/^\d*$/.test(value) || value.length > 4)) {
                return;
            }
        }

        // Required Hours: allow only digits, max 4 characters
        if (name === 'required_hours') {
            if (value !== '' && (!/^\d*$/.test(value) || value.length > 4)) {
                return;
            }
        }

        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditSave = async () => {
        if (!editingIntern) return;

        // ---- Validation ----
        if (!editForm.full_name.trim()) {
            setEditError('Full name is required.');
            return;
        }
        // Full Name must not contain numbers
        if (/\d/.test(editForm.full_name)) {
            setEditError('Full name must not contain numeric characters.');
            return;
        }
        if (!editForm.email.trim()) {
            setEditError('Email is required.');
            return;
        }
        // OJT ID must be exactly 4 digits
        if (editForm.ojt_id && !/^\d{4}$/.test(editForm.ojt_id)) {
            setEditError('OJT ID must be exactly 4 digits.');
            return;
        }
        // Required Hours must be at most 4 digits
        if (editForm.required_hours && !/^\d{1,4}$/.test(editForm.required_hours)) {
            setEditError('Required Hours must be at most 4 digits.');
            return;
        }
        // Voluntary OJT type requires at least 500 hours
        if (editForm.ojt_type === 'voluntary' && editForm.required_hours) {
            const hours = parseInt(editForm.required_hours, 10);
            if (hours < 500) {
                setEditError('When OJT Type is Voluntary, Required Hours must be 500 or more.');
                return;
            }
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

    if (!interns || !stats) return <PageLoader message="Loading interns..." />;

    return (
        <div className="admin-page-shell max-w-full p-0 overflow-hidden">
            {/* Header Section */}
            <div className="manage-interns-header">
                <h1 className="text-3xl font-bold text-orange-600 m-0">Manage Interns</h1>
                <button className="btn btn-primary gap-2" onClick={handleExportCSV}>
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
            <div className="mb-6">
                <div className="input-group admin-search-wrap">
                    <Search size={20} className="admin-search-icon" />
                    <input
                        type="text"
                        className="input admin-search-input"
                        placeholder="Search by name, role, email, or OJT ID"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>
            </div>

            {/* Filter Section */}
            <div className="manage-interns-filters">
                <div className="row items-center gap-2 min-w-fit">
                    <Filter size={20} />
                    <span className="font-semibold">Filters:</span>
                </div>

                <div className="filter-dropdown">
                    <select
                        className="select pr-10 w-full"
                        value={sortDirection}
                        onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                    >
                        <option value="asc">Name: A → Z</option>
                        <option value="desc">Name: Z → A</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="filter-dropdown">
                    <select
                        className="select w-full"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        {OJT_ROLES.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="filter-dropdown">
                    <select
                        className="select w-full"
                        value={startDateFilter}
                        onChange={(e) => setStartDateFilter(e.target.value)}
                    >
                        <option value="all">All Start Date</option>
                        <option value="newest">Newest to Oldest</option>
                        <option value="oldest">Oldest to Newest</option>
                        <option value="this-month">This Month</option>
                        <option value="this-year">This Year</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="filter-dropdown-wide">
                    <select
                        className="select w-full"
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
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="filter-dropdown">
                    <select
                        className="select w-full"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="p-4 mb-4 rounded-md border border-red-200 bg-red-50 text-red-700">
                    {error}
                </div>
            )}

            {/* Table Container - Scrollable */}
            <div className="table-container rounded-lg border border-slate-200 overflow-auto bg-white w-full max-w-[100vw] relative">

                <table className="w-full min-w-[1000px] border-collapse text-center">
                    <thead>
                        <tr className="bg-orange-500 text-white">
                            <th className="p-4 font-semibold border-b-0 whitespace-nowrap">Name</th>
                            <th className="p-4 font-semibold border-b-0 whitespace-nowrap">Role</th>
                            <th className="p-4 font-semibold border-b-0 whitespace-nowrap">Email Address</th>
                            <th className="p-4 font-semibold border-b-0 whitespace-nowrap">OJT ID</th>
                            <th className="p-4 font-semibold border-b-0 whitespace-nowrap">Start Date</th>
                            <th className="p-4 font-semibold border-b-0 whitespace-nowrap">Required Hours</th>
                            <th className="p-4 font-semibold border-b-0 whitespace-nowrap">Status</th>
                            <th className="p-4 font-semibold border-b-0 whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedInterns.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-12 px-4 text-slate-500">
                                    No interns found.
                                </td>
                            </tr>
                        ) : (
                            paginatedInterns.map((intern) => (
                                <tr key={intern.id} className="border-b border-slate-200">
                                    <td className="p-4 text-slate-700">{intern.full_name}</td>
                                    <td className="p-4 text-slate-700">{intern.ojt_role || '—'}</td>
                                    <td className="p-4 text-slate-700">{intern.email}</td>
                                    <td className="p-4 text-slate-700">{intern.ojt_id || '—'}</td>
                                    <td className="p-4 text-slate-700">{formatDate(intern.start_date)}</td>
                                    <td className="p-4 text-slate-700">{intern.required_hours ? `${intern.required_hours} hours` : '—'}</td>
                                    <td className="p-4">
                                        <span
                                            className={`font-medium capitalize ${intern.status === 'active' ? 'text-green-500' : 'text-violet-500'}`}
                                        >
                                            {intern.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                className="bg-transparent border-none cursor-pointer text-slate-500 p-1"
                                                title="Edit"
                                                onClick={() => openEditModal(intern)}
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                className="bg-transparent border-none cursor-pointer text-slate-500 p-1"
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="pagination-controls">
                    <div className="pagination-summary">
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredInterns.length)} of {filteredInterns.length} interns
                    </div>
                    <div className="pagination-buttons">
                        <button
                            className="pagination-btn pagination-arrow"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Prev
                        </button>
                        {[...Array(totalPages)].map((_, i) => {
                            const page = i + 1;
                            if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                                return (
                                    <button
                                        key={page}
                                        className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                );
                            } else if (
                                page === currentPage - 2 ||
                                page === currentPage + 2
                            ) {
                                return <span key={page} className="pagination-ellipsis">...</span>;
                            }
                            return null;
                        })}
                        <button
                            className="pagination-btn pagination-arrow"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* ===== Archive Confirmation Modal ===== */}
            {archiveTarget && (
                <div className="modal-overlay" onClick={() => setArchiveTarget(null)}>
                    <div className="manage-interns-modal bg-[#e6ded6] rounded-xl p-8 w-full max-w-[440px]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
                            <h2 className="text-orange-600 m-0 text-xl font-bold">
                                {archiveTarget.status === 'active' ? 'Archive Intern' : 'Restore Intern'}
                            </h2>
                        </div>
                        <p className="m-0 mb-6 text-slate-700 leading-6">
                            Are you sure you want to {archiveTarget.status === 'active' ? 'archive' : 'restore'}{' '}
                            <strong>{archiveTarget.full_name}</strong>?
                            {archiveTarget.status === 'active' && ' This will revoke their access to the system.'}
                        </p>
                        <div className="flex justify-end gap-4">
                            <button
                                className="btn bg-white text-orange-600 border-none px-6 py-3"
                                onClick={() => setArchiveTarget(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary border-none px-6 py-3"
                                onClick={confirmArchive}
                            >
                                {archiveTarget.status === 'active' ? 'Confirm Archive' : 'Confirm Restore'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Edit Intern Modal ===== */}
            {editingIntern && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm" onClick={closeEditModal}>
                    <div className="edit-modal-panel" onClick={(e) => e.stopPropagation()}>
                        {/* Heading */}
                        <div className="mb-8">
                            <h2 className="text-orange-600 m-0 text-2xl font-bold">Edit Intern Information</h2>
                        </div>

                        {editError && (
                            <div className="p-3 px-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
                                {editError}
                            </div>
                        )}

                        {/* Full Name */}
                        <div className="mb-6">
                            <label className="block font-semibold mb-2">Full Name:</label>
                            <input
                                className="input w-full bg-white"
                                name="full_name"
                                value={editForm.full_name}
                                onChange={handleEditChange}
                                placeholder="Enter full name"
                            />
                        </div>

                        {/* Email */}
                        <div className="mb-6">
                            <label className="block font-semibold mb-2">Email Address:</label>
                            <input
                                className="input w-full bg-white"
                                name="email"
                                type="email"
                                value={editForm.email}
                                onChange={handleEditChange}
                                placeholder="Enter email address"
                            />
                        </div>

                        {/* OJT Role & OJT ID */}
                        <div className="modal-grid-2col">
                            <div>
                                <label className="block font-semibold mb-2">OJT Role:</label>
                                <div className="relative">
                                    <select
                                        className="select w-full bg-white"
                                        name="ojt_role"
                                        value={editForm.ojt_role}
                                        onChange={handleEditChange}
                                    >
                                        <option value="">Select Role</option>
                                        {OJT_ROLES.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block font-semibold mb-2">OJT ID:</label>
                                <input
                                    className="input w-full bg-white"
                                    name="ojt_id"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={4}
                                    value={editForm.ojt_id}
                                    onChange={handleEditChange}
                                    placeholder="e.g. 1101"
                                />
                            </div>
                        </div>

                        {/* Start Date & Required Hours */}
                        <div className="modal-grid-2col">
                            <div>
                                <label className="block font-semibold mb-2">Start Date:</label>
                                <input
                                    className="input w-full bg-white"
                                    name="start_date"
                                    type="date"
                                    value={editForm.start_date}
                                    onChange={handleEditChange}
                                />
                            </div>
                            <div>
                                <label className="block font-semibold mb-2">Required Hours:</label>
                                <input
                                    className="input w-full bg-white"
                                    name="required_hours"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={4}
                                    value={editForm.required_hours}
                                    onChange={handleEditChange}
                                    placeholder="e.g. 600"
                                />
                            </div>
                        </div>

                        {/* OJT Type */}
                        <div className="mb-12">
                            <label className="block font-semibold mb-2">OJT Type:</label>
                            <div className="relative">
                                <select
                                    className="select w-full bg-white"
                                    name="ojt_type"
                                    value={editForm.ojt_type}
                                    onChange={handleEditChange}
                                >
                                    <option value="">Select OJT Type</option>
                                    <option value="required">Required</option>
                                    <option value="voluntary">Voluntary</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="row justify-end gap-4">
                            <button
                                className="btn bg-white text-orange-600 border-none px-6 py-3"
                                onClick={closeEditModal}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary border-none px-6 py-3"
                                onClick={handleEditSave}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageInterns;
