import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    Search,
    Filter,
    Pencil,
    Archive,
    ChevronDown,
    Download,
    Users as UsersIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

    if (!interns || !stats) return null;

    return (
        <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h1 className="text-3xl font-extrabold text-[#ff7a00]">Manage Interns</h1>
                <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 bg-[#ff7a00] text-white px-4 py-2 rounded-lg hover:bg-[#e55a00] transition font-medium"
                >
                    <Download size={18} />
                    Export to CSV
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                >
                    <p className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-3">Total Interns</p>
                    <h3 className="text-5xl font-black text-gray-900 leading-none tracking-tight">{stats.totalInterns}</h3>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                >
                    <p className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-3">Total Roles</p>
                    <h3 className="text-5xl font-black text-gray-900 leading-none tracking-tight">{stats.totalRoles}</h3>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                >
                    <p className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-3">Archived Interns</p>
                    <h3 className="text-5xl font-black text-gray-900 leading-none tracking-tight">{stats.archivedInterns}</h3>
                </motion.div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    className="w-full pl-12 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00] bg-white"
                    placeholder="Search by name, role, email, or OJT ID"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                />
            </div>

            {/* Filter Section */}
            <div className="flex flex-wrap items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2 font-semibold text-gray-700">
                    <Filter size={20} />
                    <span>Filters:</span>
                </div>

                {/* Sort */}
                <div className="relative">
                    <select
                        className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-[#ff7a00] text-sm"
                        value={sortDirection}
                        onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                    >
                        <option value="asc">Name: A → Z</option>
                        <option value="desc">Name: Z → A</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>

                {/* Role */}
                <div className="relative">
                    <select
                        className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-[#ff7a00] text-sm"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        {OJT_ROLES.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>

                {/* Start Date */}
                <div className="relative">
                    <select
                        className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-[#ff7a00] text-sm"
                        value={startDateFilter}
                        onChange={(e) => setStartDateFilter(e.target.value)}
                    >
                        <option value="all">All Start Date</option>
                        <option value="newest">Newest to Oldest</option>
                        <option value="oldest">Oldest to Newest</option>
                        <option value="this-month">This Month</option>
                        <option value="this-year">This Year</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>

                {/* Required Hours */}
                <div className="relative">
                    <select
                        className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-[#ff7a00] text-sm"
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
                    <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>

                {/* Status */}
                <div className="relative">
                    <select
                        className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-[#ff7a00] text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
                    {error}
                </div>
            )}

            {/* Table Container */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6"
            >
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-center">
                        <thead>
                            <tr className="bg-[#ff7a00] text-white">
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Name</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Role</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Email Address</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">OJT ID</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Start Date</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Required Hours</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Status</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedInterns.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-500">
                                        No interns found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedInterns.map((intern, index) => (
                                    <motion.tr 
                                        key={intern.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="border-b border-gray-100 hover:bg-gray-50 transition"
                                    >
                                        <td className="px-6 py-4 text-gray-700">{intern.full_name}</td>
                                        <td className="px-6 py-4 text-gray-700">{intern.ojt_role || '—'}</td>
                                        <td className="px-6 py-4 text-gray-700">{intern.email}</td>
                                        <td className="px-6 py-4 text-gray-700">{intern.ojt_id || '—'}</td>
                                        <td className="px-6 py-4 text-gray-700">{formatDate(intern.start_date)}</td>
                                        <td className="px-6 py-4 text-gray-700">{intern.required_hours ? `${intern.required_hours} hours` : '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`font-medium capitalize ${intern.status === 'active' ? 'text-green-600' : 'text-purple-600'}`}>
                                                {intern.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    className="text-gray-500 hover:text-[#ff7a00] transition p-2"
                                                    title="Edit"
                                                    onClick={() => openEditModal(intern)}
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    className="text-gray-500 hover:text-[#ff7a00] transition p-2"
                                                    title={intern.status === 'active' ? 'Archive' : 'Restore'}
                                                    onClick={() => handleArchiveToggle(intern)}
                                                >
                                                    <Archive size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-white rounded-lg border border-gray-100"
                >
                    <div className="text-sm text-gray-600 font-medium">
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredInterns.length)} of {filteredInterns.length} interns
                    </div>
                    <div className="flex gap-2 flex-wrap justify-center">
                        <button
                            className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
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
                                        className={`px-3 py-2 rounded-lg font-medium text-sm transition ${currentPage === page ? 'bg-[#ff7a00] text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                );
                            } else if (
                                page === currentPage - 2 ||
                                page === currentPage + 2
                            ) {
                                return <span key={page} className="px-2 py-2 text-gray-400">...</span>;
                            }
                            return null;
                        })}
                        <button
                            className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Edit Intern Modal */}
            <AnimatePresence>
                {editingIntern && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={closeEditModal}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Heading */}
                            <h2 className="text-2xl font-bold text-[#ff7a00] mb-6">Edit Intern Information</h2>

                            {editError && (
                                <div className="p-3 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                                    {editError}
                                </div>
                            )}

                            {/* Full Name */}
                            <div className="mb-6">
                                <label className="block font-semibold text-gray-700 mb-2">Full Name:</label>
                                <input
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00]"
                                    name="full_name"
                                    value={editForm.full_name}
                                    onChange={handleEditChange}
                                    placeholder="Enter full name"
                                />
                            </div>

                            {/* Email */}
                            <div className="mb-6">
                                <label className="block font-semibold text-gray-700 mb-2">Email Address:</label>
                                <input
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00]"
                                    name="email"
                                    type="email"
                                    value={editForm.email}
                                    onChange={handleEditChange}
                                    placeholder="Enter email address"
                                />
                            </div>

                            {/* OJT Role & OJT ID */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-2">OJT Role:</label>
                                    <div className="relative">
                                        <select
                                            className="w-full appearance-none px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00]"
                                            name="ojt_role"
                                            value={editForm.ojt_role}
                                            onChange={handleEditChange}
                                        >
                                            <option value="">Select Role</option>
                                            {OJT_ROLES.map(role => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-2">OJT ID:</label>
                                    <input
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00]"
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
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-2">Start Date:</label>
                                    <input
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00]"
                                        name="start_date"
                                        type="date"
                                        value={editForm.start_date}
                                        onChange={handleEditChange}
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-2">Required Hours:</label>
                                    <input
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00]"
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
                            <div className="mb-8">
                                <label className="block font-semibold text-gray-700 mb-2">OJT Type:</label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00]"
                                        name="ojt_type"
                                        value={editForm.ojt_type}
                                        onChange={handleEditChange}
                                    >
                                        <option value="">Select OJT Type</option>
                                        <option value="required">Required</option>
                                        <option value="voluntary">Voluntary</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3">
                                <button
                                    className="px-6 py-2 border border-[#ff7a00] text-[#ff7a00] rounded-lg hover:bg-orange-50 transition font-medium disabled:opacity-50"
                                    onClick={closeEditModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-6 py-2 bg-[#ff7a00] text-white rounded-lg hover:bg-[#e55a00] transition font-medium disabled:opacity-50"
                                    onClick={handleEditSave}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManageInterns;
