import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Pencil, AlertCircle, Search, Filter, Archive, Plus, Loader2, X, CheckCircle } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import DropdownSelect, { type DropdownSelectOption } from '../../components/DropdownSelect';
import ModalPortal from '../../components/ModalPortal';
import MobileFilterDrawer from '../../components/MobileFilterDrawer';
import { userService } from '../../services/userServices';
import { useRealtime } from '../../hooks/useRealtime';
import type { Users } from '../../types/database.types';
import { authService } from '../../services/authService';


// Shape of the edit form data (supervisor only needs name + email)
interface EditFormData {
    full_name: string;
    email: string;
}

const ManageSupervisors = () => {
    const [supervisors, setSupervisors] = useState<Users[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Stats state
    const [stats, setStats] = useState<{ totalSupervisors: number, activeSupervisors: number, archivedSupervisors: number } | null>(null);

    // Sign up Form Data
    interface signUpFormData {
        full_name: string;
        // role: string;
        email: string;
        password: string
        password_confirmation: string

    };

    // Sign Up For Supervisor Modal States
    const [signUpModalOpen, setSignUpModalOpen] = useState(false);
    const [signUpForm, setSignUpForm] = useState<signUpFormData>({
        full_name: '',
        email: '',
        password: '',
        password_confirmation: ''
    });
    const [signUpError, setSignUpError] = useState<string | null>(null);
    const [signUpLoading, setSignUpLoading] = useState(false)
    const [signUpSuccess, setSignUpSuccess] = useState(false)


    // Edit Supervisor Modal States
    const [editingSupervisor, setEditingSupervisor] = useState<Users | null>(null);
    const [editForm, setEditForm] = useState<EditFormData>({ full_name: '', email: '' });
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    // Archive Confirmation Modal State
    const [archiveTarget, setArchiveTarget] = useState<Users | null>(null);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dateSortOptions: DropdownSelectOption<typeof dateSort>[] = [
        { value: 'newest', label: 'Newest' },
        { value: 'oldest', label: 'Oldest' },
    ];
    const statusOptions: DropdownSelectOption<typeof statusFilter>[] = [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'archived', label: 'Archived' },
    ];

    // Debounce search input
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchTerm]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, statusFilter, dateSort]);

    // Load supervisors
    const loadSupervisors = useCallback(async () => {
        try {
            setError(null);
            const data = await userService.fetchSupervisors({
                search: debouncedSearch,
                status: statusFilter,
                dateSort: dateSort
            });
            setSupervisors(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch supervisors');
        }
    }, [debouncedSearch, statusFilter, dateSort]);

    // Load stats
    const loadStats = async () => {
        try {
            const statsData = await userService.getSupervisorStats();
            setStats(statsData);
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    };

    // Initial load
    useEffect(() => {
        loadSupervisors();
    }, [loadSupervisors]);

    useEffect(() => {
        loadStats();
    }, []);

    // Re-fetch whenever users table changes in real-time
    useRealtime('users', () => { loadSupervisors(); loadStats(); });

    // Handle archive toggle — opens confirmation modal
    const handleArchiveToggle = (supervisor: Users) => {
        setArchiveTarget(supervisor);
    };

    // Confirm archive action
    const confirmArchive = async () => {
        if (!archiveTarget) return;
        try {
            await userService.toggleArchiveSupervisor(archiveTarget.id, archiveTarget.status);
            setArchiveTarget(null);
            await loadSupervisors();
            await loadStats();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update supervisor status');
            setArchiveTarget(null);
        }
    };


    const handleSignUpModal = () => {
        setSignUpModalOpen(true)
        setSignUpForm({ full_name: '', email: '', password: '', password_confirmation: '' });
        setSignUpError(null);
        setSignUpSuccess(false);
    };

    const handleCloseSignupModal =() => {
        setSignUpModalOpen(false)
        setSignUpForm({ full_name: '', email: '', password: '', password_confirmation: '' });
        setSignUpError(null);
        setSignUpSuccess(false);
    }

    const handleSignUpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;

        if (name === 'full_name' && /\d/.test(value)) {
            return;
        }

        setSignUpForm((prev) => ({ ...prev, [name]: value}));

    };

    const handleSignUpSubmit = async () => {
        if (!signUpForm.full_name.trim()) {
            setSignUpError('Full Name is Required.');
            return;
        }
            if (/\d/.test(signUpForm.full_name)) {
        setSignUpError('Full name must not contain numeric characters.');
        return;
        }
        if (!signUpForm.email.trim()) {
            setSignUpError('Email is required.');
            return;
        }
        if (!signUpForm.password) {
            setSignUpError('Password is required.');
            return;
        }
        if (signUpForm.password.length < 8) {
            setSignUpError('Password must be at least 8 characters long.');
            return;
        }
        if (signUpForm.password !== signUpForm.password_confirmation) {
            setSignUpError('Passwords do not match.');
            return;
        }

        try {
            setSignUpLoading(true);
            setSignUpError(null);

            await authService.registerSupervisor({
                full_name: signUpForm.full_name.trim(),
                email: signUpForm.email.trim(),
                password: signUpForm.password,
                password_confirmation: signUpForm.password_confirmation,
            });

            setSignUpSuccess(true);
            setTimeout(() => {
                handleCloseSignupModal();
                loadSupervisors();
                loadStats();
            }, 2000);
        } catch (err) {
            setSignUpError(err instanceof Error ? err.message : 'Failed to register supervisor.');
        } finally {
            setSignUpLoading(false);
        }
    };

    // ---------- Edit modal helpers ----------
    const openEditModal = (supervisor: Users) => {
        setEditingSupervisor(supervisor);
        setEditForm({
            full_name: supervisor.full_name ?? '',
            email: supervisor.email ?? '',
        });
        setEditError(null);
        document.body.style.overflow = 'hidden';
    };

    const closeEditModal = () => {
        setEditingSupervisor(null);
        setEditError(null);
        document.body.style.overflow = '';
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Full Name: reject any numeric characters
        if (name === 'full_name' && /\d/.test(value)) {
            return;
        }

        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditSave = async () => {
        if (!editingSupervisor) return;

        // ---- Validation ----
        if (!editForm.full_name.trim()) {
            setEditError('Full name is required.');
            return;
        }
        if (/\d/.test(editForm.full_name)) {
            setEditError('Full name must not contain numeric characters.');
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
            };

            await userService.updateUser(editingSupervisor.id, updates);
            closeEditModal();
            await loadSupervisors();
            await loadStats();
        } catch (err) {
            setEditError(err instanceof Error ? err.message : 'Failed to update supervisor.');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
    };

    // Guard Check
    if (!supervisors || !stats) return <PageLoader message="Loading supervisors..." />;

    // Pagination Derived State
    const totalPages = Math.ceil(supervisors.length / ITEMS_PER_PAGE);
    const paginatedSupervisors = supervisors.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="admin-page-shell w-full space-y-6 overflow-hidden">
            {/* Header Section */}
            <div className="manage-interns-header">
                <h1 className="text-3xl font-bold text-orange-600 m-0">Manage Supervisors</h1>
                <button className="btn btn-primary gap-2" onClick={handleSignUpModal}>
                    <Plus size={18} /> Add Supervisor
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid manage-users-stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Total Supervisors</div>
                    <div className="stat-value">{stats.totalSupervisors}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Active Supervisors</div>
                    <div className="stat-value">{stats.activeSupervisors}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Archived Supervisors</div>
                    <div className="stat-value">{stats.archivedSupervisors}</div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="input-group admin-search-wrap">
                    <Search size={20} className="admin-search-icon" />
                    <input
                        type="text"
                        className="input admin-search-input"
                        placeholder="Search by name or email"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Filter Section */}
            <div className="manage-interns-filters !hidden items-center gap-4 min-[851px]:!flex">
                <div className="flex flex-row items-center gap-2">
                    <Filter size={20} /> <span className="font-semibold">Filters:</span>
                </div>

                <div className="flex w-full flex-col flex-wrap gap-4 md:w-auto md:flex-row">
                    <div className="filter-dropdown">
                        <DropdownSelect
                            value={dateSort}
                            options={dateSortOptions}
                            onChange={setDateSort}
                        />
                    </div>
                    <div className="filter-dropdown">
                        <DropdownSelect
                            value={statusFilter}
                            options={statusOptions}
                            onChange={setStatusFilter}
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
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Date Created</label>
                    <DropdownSelect
                        value={dateSort}
                        options={dateSortOptions}
                        onChange={(value) => {
                            setDateSort(value);
                            setIsFilterDrawerOpen(false);
                        }}
                    />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Status</label>
                    <DropdownSelect
                        value={statusFilter}
                        options={statusOptions}
                        onChange={(value) => {
                            setStatusFilter(value);
                            setIsFilterDrawerOpen(false);
                        }}
                    />
                </div>
            </MobileFilterDrawer>

            {/* Error Banner */}
            {error && (
                <div className="p-4 mb-4 rounded-md border border-red-200 bg-red-50 text-red-700">
                    {error}
                </div>
            )}

            {/* Table Container */}
            <div className="table-container rounded-lg border border-slate-200 overflow-auto bg-white hidden min-[851px]:block">
                <table className="w-full min-w-[800px] border-collapse text-center">
                    <thead>
                        <tr className="bg-orange-500 text-white">
                            <th className="p-4">Name</th>
                            <th className="p-4">Email Address</th>
                            <th className="p-4">Date Created</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedSupervisors.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 px-4 text-slate-500">No supervisors found.</td>
                            </tr>
                        ) : (
                            paginatedSupervisors.map((supervisor) => (
                                <tr key={supervisor.id} className="border-b border-slate-200">
                                    <td className="p-4">{supervisor.full_name}</td>
                                    <td className="p-4">{supervisor.email}</td>
                                    <td className="p-4">{formatDate(supervisor.created_at)}</td>
                                    <td className="p-4">
                                        <span className={`font-medium ${supervisor.status === 'active' ? 'text-green-500' : 'text-violet-500'}`}>
                                            {supervisor.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-2">
                                            <button className="bg-transparent border-none cursor-pointer" onClick={() => openEditModal(supervisor)}><Pencil size={18} /></button>
                                            <button
                                                className="bg-transparent border-none cursor-pointer"
                                                title={supervisor.status === 'active' ? 'Archive' : 'Restore'}
                                                onClick={() => handleArchiveToggle(supervisor)}
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
                {paginatedSupervisors.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">No supervisors found.</div>
                ) : (
                    paginatedSupervisors.map((supervisor) => (
                        <div key={supervisor.id} className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold">{supervisor.full_name}</span>
                                <span className={`text-xs font-medium ${supervisor.status === 'active' ? 'text-green-500' : 'text-violet-500'}`}>
                                    {supervisor.status}
                                </span>
                            </div>
                            <div className="text-sm text-slate-500 mb-1">{supervisor.email}</div>
                            <div className="text-xs text-slate-400 mb-3">{formatDate(supervisor.created_at)}</div>
                            <div className="flex gap-2">
                                <button
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-orange-50 text-orange-600"
                                    onClick={() => openEditModal(supervisor)}
                                >
                                    <Pencil size={14} /> Edit
                                </button>
                                <button
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-slate-50 text-slate-600"
                                    onClick={() => handleArchiveToggle(supervisor)}
                                >
                                    <Archive size={14} /> {supervisor.status === 'active' ? 'Archive' : 'Restore'}
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
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, supervisors.length)} of {supervisors.length} supervisors
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

            {/* Add Supervisor Modal */}
            {signUpModalOpen && (
                <ModalPortal>
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4" onClick={handleCloseSignupModal}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-gray-100 dark:border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                    <Plus size={16} className="text-[#FF8800]" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white m-0 leading-tight">Register Supervisor</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 m-0">Create a new supervisor account</p>
                                </div>
                            </div>
                            <button onClick={handleCloseSignupModal} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="px-6 py-5">
                            {signUpSuccess ? (
                                <div className="flex flex-col items-center gap-3 py-6 text-center">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                        <CheckCircle size={24} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Registration successful!</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Credentials sent to <span className="font-medium">{signUpForm.email}</span></p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {signUpError && (
                                        <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-sm text-red-700 dark:text-red-400">
                                            <AlertCircle size={15} className="shrink-0 mt-0.5" />
                                            {signUpError}
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                                        <input
                                            className="input w-full bg-white dark:bg-slate-800 text-sm"
                                            name="full_name"
                                            value={signUpForm.full_name}
                                            onChange={handleSignUpChange}
                                            placeholder="Enter full name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                                        <input
                                            className="input w-full bg-white dark:bg-slate-800 text-sm"
                                            name="email"
                                            type="email"
                                            value={signUpForm.email}
                                            onChange={handleSignUpChange}
                                            placeholder="Enter email address"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                                        <input
                                            className="input w-full bg-white dark:bg-slate-800 text-sm"
                                            name="password"
                                            type="password"
                                            value={signUpForm.password}
                                            onChange={handleSignUpChange}
                                            placeholder="Min 8 characters"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
                                        <input
                                            className="input w-full bg-white dark:bg-slate-800 text-sm"
                                            name="password_confirmation"
                                            type="password"
                                            value={signUpForm.password_confirmation}
                                            onChange={handleSignUpChange}
                                            placeholder="Re-enter password"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 px-6 pb-6 pt-2 border-t border-gray-100 dark:border-white/10">
                            <button
                                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-50"
                                onClick={handleCloseSignupModal}
                                disabled={signUpLoading}
                            >
                                {signUpSuccess ? 'Close' : 'Cancel'}
                            </button>
                            {!signUpSuccess && (
                                <button
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF8800] hover:bg-[#E67A00] text-white text-sm font-semibold transition-all disabled:opacity-50"
                                    onClick={handleSignUpSubmit}
                                    disabled={signUpLoading}
                                >
                                    {signUpLoading && <Loader2 size={14} className="animate-spin" />}
                                    {signUpLoading ? 'Registering…' : 'Register'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                </ModalPortal>
            )}

            {/* ===== Archive Confirmation Modal ===== */}
            {archiveTarget && (
                <ModalPortal>
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4" onClick={() => setArchiveTarget(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start gap-4 mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${archiveTarget.status === 'active' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                                <AlertCircle size={20} className={archiveTarget.status === 'active' ? 'text-amber-600' : 'text-emerald-600'} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-0.5">
                                    {archiveTarget.status === 'active' ? 'Archive Supervisor' : 'Restore Supervisor'}
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

            {/* ===== Edit Supervisor Modal ===== */}
            {editingSupervisor && (
                <ModalPortal>
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4" onClick={closeEditModal}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-gray-100 dark:border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                    <Pencil size={16} className="text-[#FF8800]" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white m-0 leading-tight">Edit Supervisor</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 m-0">{editingSupervisor.full_name}</p>
                                </div>
                            </div>
                            <button onClick={closeEditModal} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            {editError && (
                                <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-sm text-red-700 dark:text-red-400">
                                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                                    {editError}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                                <input
                                    className="input w-full bg-white dark:bg-slate-800 text-sm"
                                    name="full_name"
                                    value={editForm.full_name}
                                    onChange={handleEditChange}
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div>
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
                        </div>

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

export default ManageSupervisors;
