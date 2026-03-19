import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Pencil, AlertCircle, Search, Filter, Archive, Plus, Loader2, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import PageLoader from '../../components/PageLoader';
import { userService } from '../../services/userServices';
import { useRealtime } from '../../hooks/useRealtime';
import type { Users } from '../../types/database.types';
import { authService } from '../../services/authService';


// Shape of the edit form data (supervisor only needs name + email)
interface EditFormData {
    full_name: string;
    email: string;
}

type DropdownOption<T extends string> = {
    value: T;
    label: string;
};

type CustomDropdownProps<T extends string> = {
    value: T;
    options: DropdownOption<T>[];
    onChange: (value: T) => void;
    className?: string;
    buttonClassName?: string;
    panelClassName?: string;
};

function CustomDropdown<T extends string>({
    value,
    options,
    onChange,
    className = '',
    buttonClassName = '',
    panelClassName = '',
}: CustomDropdownProps<T>) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const selectedOption = options.find(option => option.value === value) ?? options[0];

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (!dropdownRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    return (
        <div ref={dropdownRef} className={`relative ${open ? 'z-[120]' : 'z-20'} ${className}`}>
            <motion.button
                type="button"
                whileTap={{ scale: 0.985 }}
                onClick={() => setOpen(prev => !prev)}
                className={`flex w-full items-center justify-between rounded-[1.15rem] border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 outline-none transition-all duration-200 focus:border-[hsl(var(--orange))] focus:ring-2 focus:ring-[hsl(var(--orange))]/20 ${buttonClassName} ${open ? 'border-[hsl(var(--orange))] shadow-[0_14px_34px_-22px_rgba(255,136,0,0.85)]' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span>{selectedOption?.label ?? value}</span>
                <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 shrink-0 text-slate-500"
                >
                    <ChevronDown size={18} />
                </motion.span>
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className={`absolute left-0 right-0 top-[calc(100%+0.55rem)] z-10 overflow-hidden rounded-[1.15rem] border border-gray-200 bg-white shadow-[0_24px_55px_-24px_rgba(15,23,42,0.35)] ${panelClassName}`}
                        role="listbox"
                    >
                        <div className="p-2">
                            {options.map(option => {
                                const isActive = option.value === value;

                                return (
                                    <motion.button
                                        key={option.value}
                                        type="button"
                                        whileTap={{ scale: 0.985 }}
                                        onClick={() => {
                                            onChange(option.value);
                                            setOpen(false);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                                            isActive
                                                ? 'bg-[hsl(var(--orange))] text-white'
                                                : 'text-slate-700 hover:bg-orange-50'
                                        }`}
                                        role="option"
                                        aria-selected={isActive}
                                    >
                                        <span>{option.label}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const ManageSupervisors = () => {
    const [supervisors, setSupervisors] = useState<Users[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
    const [statusFilter, setStatusFilter] = useState('all');

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
    const dateSortOptions: DropdownOption<typeof dateSort>[] = [
        { value: 'newest', label: 'Newest' },
        { value: 'oldest', label: 'Oldest' },
    ];
    const statusOptions: DropdownOption<typeof statusFilter>[] = [
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
        <div className="admin-page-shell max-w-full p-0 overflow-hidden">
            {/* Header Section */}
            <div className="manage-interns-header">
                <h1 className="text-3xl font-bold text-orange-600 m-0">Manage Supervisors</h1>
                <button className="btn btn-primary gap-2" onClick={handleSignUpModal}>
                    <Plus size={18} /> Add Supervisor
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
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
            <div className="manage-interns-filters">
                <div className="row items-center gap-2">
                    <Filter size={20} /> <span className="font-semibold">Filters:</span>
                </div>
                <div className="filter-dropdown">
                    <CustomDropdown
                        value={dateSort}
                        options={dateSortOptions}
                        onChange={setDateSort}
                    />
                </div>
                <div className="filter-dropdown">
                    <CustomDropdown
                        value={statusFilter}
                        options={statusOptions}
                        onChange={setStatusFilter}
                    />
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="p-4 mb-4 rounded-md border border-red-200 bg-red-50 text-red-700">
                    {error}
                </div>
            )}

            {/* Table Container */}
            <div className="table-container rounded-lg border border-slate-200 overflow-auto bg-white">
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
                <div className="modal-overlay" onClick={handleCloseSignupModal}>
                    <div className="manage-interns-modal bg-[#e6ded6] rounded-xl p-8 w-full max-w-[500px]" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-orange-600 mb-6">Register New Supervisor</h2>

                        {signUpSuccess && (
                            <div className="p-4 mb-6 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300">
                                ✅ Registration successful! Credentials sent to {signUpForm.email}
                            </div>
                        )}

                        {signUpError && (
                            <div className="p-3 mb-6 bg-red-100 text-red-700 rounded-lg border border-red-200 text-sm">
                                {signUpError}
                            </div>
                        )}

                        {!signUpSuccess && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block font-semibold mb-2">Full Name:</label>
                                    <input
                                        className="input w-full"
                                        name="full_name"
                                        value={signUpForm.full_name}
                                        onChange={handleSignUpChange}
                                        placeholder="Enter full name"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold mb-2">Email:</label>
                                    <input
                                        className="input w-full"
                                        name="email"
                                        type="email"
                                        value={signUpForm.email}
                                        onChange={handleSignUpChange}
                                        placeholder="Enter email"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold mb-2">Password:</label>
                                    <input
                                        className="input w-full"
                                        name="password"
                                        type="password"
                                        value={signUpForm.password}
                                        onChange={handleSignUpChange}
                                        placeholder="Min 8 characters"
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="block font-semibold mb-2">Confirm Password:</label>
                                    <input
                                        className="input w-full"
                                        name="password_confirmation"
                                        type="password"
                                        value={signUpForm.password_confirmation}
                                        onChange={handleSignUpChange}
                                        placeholder="Confirm password"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-4 mt-6">
                            <button className="btn bg-white text-orange-600 border-none" onClick={handleCloseSignupModal} disabled={signUpLoading}>
                                Cancel
                            </button>
                            {!signUpSuccess && (
                                <button className="btn btn-primary" onClick={handleSignUpSubmit} disabled={signUpLoading}>
                                    {signUpLoading ? <Loader2 size={18} className="spinner" style={{ display: 'inline' }} /> : 'Register'}
                                </button>
                            )}
                        </div>
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
                                {archiveTarget.status === 'active' ? 'Archive Supervisor' : 'Restore Supervisor'}
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

            {/* ===== Edit Supervisor Modal ===== */}
            {editingSupervisor && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm" onClick={closeEditModal}>
                    <div className="edit-modal-panel" onClick={(e) => e.stopPropagation()}>
                        {/* Heading */}
                        <div className="mb-8">
                            <h2 className="text-orange-600 m-0 text-2xl font-bold">Edit Supervisor Information</h2>
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
                        <div className="mb-12">
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

export default ManageSupervisors;
