import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Pencil, AlertCircle, Search, Download, Filter, Archive, X, Loader2 } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import DropdownSelect from '../../components/DropdownSelect';
import MobileFilterDrawer from '../../components/MobileFilterDrawer';
import ModalPortal from '../../components/ModalPortal';
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
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
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
        <div className="admin-page-shell w-full space-y-6 overflow-hidden">
            {/* Header Section */}
            <div className="manage-interns-header">
                <h1 className="text-3xl font-bold text-orange-600 m-0">Manage Interns</h1>
                <button className="btn btn-primary gap-2" onClick={handleExportCSV}>
                    <Download size={18} />
                    Export to CSV
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid manage-users-stats-grid">
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
            <div className="manage-interns-filters !hidden items-center gap-4 min-[851px]:!flex">
                <div className="flex flex-row items-center gap-2 min-w-fit">
                    <Filter size={20} />
                    <span className="font-semibold">Filters:</span>
                </div>

                <div className="flex w-full flex-col flex-wrap gap-4 md:w-auto md:flex-row">
                    <div className="filter-dropdown">
                        <DropdownSelect
                            value={sortDirection}
                            onChange={(value) => setSortDirection(value as 'asc' | 'desc')}
                            options={[
                                { value: 'asc', label: 'Name: A to Z' },
                                { value: 'desc', label: 'Name: Z to A' },
                            ]}
                            buttonClassName="select w-full pr-4"
                        />
                    </div>

                    <div className="filter-dropdown">
                        <DropdownSelect
                            value={roleFilter}
                            onChange={setRoleFilter}
                            options={[
                                { value: 'all', label: 'All Roles' },
                                ...OJT_ROLES.map((role) => ({ value: role, label: role })),
                            ]}
                            buttonClassName="select w-full pr-4"
                        />
                    </div>

                    <div className="filter-dropdown">
                        <DropdownSelect
                            value={startDateFilter}
                            onChange={setStartDateFilter}
                            options={[
                                { value: 'all', label: 'All Start Date' },
                                { value: 'newest', label: 'Newest to Oldest' },
                                { value: 'oldest', label: 'Oldest to Newest' },
                                { value: 'this-month', label: 'This Month' },
                                { value: 'this-year', label: 'This Year' },
                            ]}
                            buttonClassName="select w-full pr-4"
                        />
                    </div>

                    <div className="filter-dropdown-wide">
                        <DropdownSelect
                            value={requiredHoursFilter}
                            onChange={setRequiredHoursFilter}
                            options={[
                                { value: 'all', label: 'All Required Hours' },
                                { value: '100-200', label: '100-200 hours' },
                                { value: '201-300', label: '201-300 hours' },
                                { value: '301-400', label: '301-400 hours' },
                                { value: 'highest', label: 'Highest to Lowest' },
                                { value: 'lowest', label: 'Lowest to Highest' },
                            ]}
                            buttonClassName="select w-full pr-4"
                        />
                    </div>

                    <div className="filter-dropdown">
                        <DropdownSelect
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={[
                                { value: 'all', label: 'All Status' },
                                { value: 'active', label: 'Active' },
                                { value: 'archived', label: 'Archived' },
                            ]}
                            buttonClassName="select w-full pr-4"
                        />
                    </div>
                </div>
            </div>

            <MobileFilterDrawer
                open={isFilterDrawerOpen}
                onOpen={() => setIsFilterDrawerOpen(true)}
                onClose={() => setIsFilterDrawerOpen(false)}
                bodyClassName="space-y-4"
            >
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Name</label>
                    <DropdownSelect
                        value={sortDirection}
                        onChange={(value) => {
                            setSortDirection(value as 'asc' | 'desc');
                            setIsFilterDrawerOpen(false);
                        }}
                        options={[
                            { value: 'asc', label: 'Name: A to Z' },
                            { value: 'desc', label: 'Name: Z to A' },
                        ]}
                        buttonClassName="select w-full pr-4"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Role</label>
                    <DropdownSelect
                        value={roleFilter}
                        onChange={(value) => {
                            setRoleFilter(value);
                            setIsFilterDrawerOpen(false);
                        }}
                        options={[
                            { value: 'all', label: 'All Roles' },
                            ...OJT_ROLES.map((role) => ({ value: role, label: role })),
                        ]}
                        buttonClassName="select w-full pr-4"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Start Date</label>
                    <DropdownSelect
                        value={startDateFilter}
                        onChange={(value) => {
                            setStartDateFilter(value);
                            setIsFilterDrawerOpen(false);
                        }}
                        options={[
                            { value: 'all', label: 'All Start Date' },
                            { value: 'newest', label: 'Newest to Oldest' },
                            { value: 'oldest', label: 'Oldest to Newest' },
                            { value: 'this-month', label: 'This Month' },
                            { value: 'this-year', label: 'This Year' },
                        ]}
                        buttonClassName="select w-full pr-4"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Required Hours</label>
                    <DropdownSelect
                        value={requiredHoursFilter}
                        onChange={(value) => {
                            setRequiredHoursFilter(value);
                            setIsFilterDrawerOpen(false);
                        }}
                        options={[
                            { value: 'all', label: 'All Required Hours' },
                            { value: '100-200', label: '100-200 hours' },
                            { value: '201-300', label: '201-300 hours' },
                            { value: '301-400', label: '301-400 hours' },
                            { value: 'highest', label: 'Highest to Lowest' },
                            { value: 'lowest', label: 'Lowest to Highest' },
                        ]}
                        buttonClassName="select w-full pr-4"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Status</label>
                    <DropdownSelect
                        value={statusFilter}
                        onChange={(value) => {
                            setStatusFilter(value);
                            setIsFilterDrawerOpen(false);
                        }}
                        options={[
                            { value: 'all', label: 'All Status' },
                            { value: 'active', label: 'Active' },
                            { value: 'archived', label: 'Archived' },
                        ]}
                        buttonClassName="select w-full pr-4"
                    />
                </div>
            </MobileFilterDrawer>

            {/* Error Banner */}
            {error && (
                <div className="p-4 mb-4 rounded-md border border-red-200 bg-red-50 text-red-700">
                    {error}
                </div>
            )}

            {/* Table Container - Scrollable */}
            <div className="table-container rounded-lg border border-slate-200 overflow-auto bg-white w-full max-w-[100vw] relative hidden min-[851px]:block">

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

            {/* Mobile card view */}
            <div className="min-[851px]:hidden space-y-3">
                {paginatedInterns.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">No interns found.</div>
                ) : (
                    paginatedInterns.map((intern) => (
                        <div key={intern.id} className="rounded-lg border border-gray-200 bg-white p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-slate-800">{intern.full_name}</span>
                                <span className={`text-xs font-medium capitalize ${intern.status === 'active' ? 'text-green-500' : 'text-violet-500'}`}>
                                    {intern.status}
                                </span>
                            </div>
                            <div className="text-sm text-slate-500 mb-0.5">{intern.ojt_role || '—'}</div>
                            <div className="text-sm text-slate-500 mb-0.5">{intern.email}</div>
                            <div className="text-xs text-slate-400 mb-3">
                                OJT ID: {intern.ojt_id || '—'} &nbsp;·&nbsp; Start: {formatDate(intern.start_date)} &nbsp;·&nbsp; {intern.required_hours ? `${intern.required_hours} hrs` : '— hrs'}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-orange-50 text-orange-600"
                                    onClick={() => openEditModal(intern)}
                                >
                                    <Pencil size={14} /> Edit
                                </button>
                                <button
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-slate-50 text-slate-600"
                                    onClick={() => handleArchiveToggle(intern)}
                                >
                                    <Archive size={14} /> {intern.status === 'active' ? 'Archive' : 'Restore'}
                                </button>
                            </div>
                        </div>
                    ))
                )}
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
                <ModalPortal>
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4" onClick={() => setArchiveTarget(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10 shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start gap-4 mb-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${archiveTarget.status === 'active' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                                <AlertCircle size={20} className={archiveTarget.status === 'active' ? 'text-amber-600' : 'text-emerald-600'} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-0.5">
                                    {archiveTarget.status === 'active' ? 'Archive Intern' : 'Restore Intern'}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Are you sure you want to {archiveTarget.status === 'active' ? 'archive' : 'restore'}{' '}
                                    <span className="font-semibold text-gray-700 dark:text-gray-200">{archiveTarget.full_name}</span>?
                                    {archiveTarget.status === 'active' && ' This will revoke their access to the system.'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end mt-5">
                            <button
                                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                                onClick={() => setArchiveTarget(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all ${archiveTarget.status === 'active' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                                onClick={confirmArchive}
                            >
                                {archiveTarget.status === 'active' ? 'Archive' : 'Restore'}
                            </button>
                        </div>
                    </div>
                </div>
                </ModalPortal>
            )}

            {/* ===== Edit Intern Modal ===== */}
            {editingIntern && (
                <ModalPortal>
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4" onClick={closeEditModal}>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10 shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-gray-100 dark:border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                    <Pencil size={16} className="text-[#FF8800]" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white m-0 leading-tight">Edit Intern</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 m-0">{editingIntern.full_name}</p>
                                </div>
                            </div>
                            <button onClick={closeEditModal} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            {editError && (
                                <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg text-sm text-red-700 dark:text-red-400">
                                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                                    {editError}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                                    <input
                                        className="input w-full bg-white dark:bg-slate-800 text-sm"
                                        name="full_name"
                                        value={editForm.full_name}
                                        onChange={handleEditChange}
                                        placeholder="Enter full name"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                                    <input
                                        className="input w-full bg-white dark:bg-slate-800 text-sm"
                                        name="email"
                                        type="email"
                                        value={editForm.email}
                                        onChange={handleEditChange}
                                        placeholder="Enter email address"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">OJT Role</label>
                                    <DropdownSelect
                                        value={editForm.ojt_role}
                                        onChange={(value) => handleEditChange({ target: { name: 'ojt_role', value } } as React.ChangeEvent<HTMLSelectElement>)}
                                        options={[
                                            { value: '', label: 'Select Role' },
                                            ...OJT_ROLES.map((role) => ({ value: role, label: role })),
                                        ]}
                                        buttonClassName="select w-full bg-white dark:bg-slate-800 pr-4 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">OJT ID</label>
                                    <input
                                        className="input w-full bg-white dark:bg-slate-800 text-sm"
                                        name="ojt_id"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={4}
                                        value={editForm.ojt_id}
                                        onChange={handleEditChange}
                                        placeholder="e.g. 1101"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Start Date</label>
                                    <input
                                        className="input w-full bg-white dark:bg-slate-800 text-sm"
                                        name="start_date"
                                        type="date"
                                        value={editForm.start_date}
                                        onChange={handleEditChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Required Hours</label>
                                    <input
                                        className="input w-full bg-white dark:bg-slate-800 text-sm"
                                        name="required_hours"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={4}
                                        value={editForm.required_hours}
                                        onChange={handleEditChange}
                                        placeholder="e.g. 600"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">OJT Type</label>
                                    <DropdownSelect
                                        value={editForm.ojt_type}
                                        onChange={(value) => handleEditChange({ target: { name: 'ojt_type', value } } as React.ChangeEvent<HTMLSelectElement>)}
                                        options={[
                                            { value: '', label: 'Select OJT Type' },
                                            { value: 'required', label: 'Required' },
                                            { value: 'voluntary', label: 'Voluntary' },
                                        ]}
                                        buttonClassName="select w-full bg-white dark:bg-slate-800 pr-4 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-2 px-6 pb-6 pt-2 border-t border-gray-100 dark:border-white/10">
                            <button
                                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-50"
                                onClick={closeEditModal}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF8800] hover:bg-[#E67A00] text-white text-sm font-semibold transition-all disabled:opacity-50"
                                onClick={handleEditSave}
                                disabled={saving}
                            >
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
                </ModalPortal>
            )}
        </div>
    );
};

export default ManageInterns;
