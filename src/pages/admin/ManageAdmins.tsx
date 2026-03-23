import { useState, useEffect, useCallback, useRef } from 'react';
import { Archive, Filter, Loader2, Pencil, Plus, Search, AlertCircle, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import PageLoader from '../../components/PageLoader';
import SearchableSelect from '../../components/SearchableSelect';
import { userService } from '../../services/userServices';
import { useRealtime } from '../../hooks/useRealtime';
import { useAuth } from '../../context/AuthContext';
import type { Users } from '../../types/database.types';

// Shape of the edit form data (admin only needs name + email)
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
                className={`flex w-full items-center justify-between rounded-[1.15rem] border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 outline-none transition-all duration-200 focus:border-[hsl(var(--orange))] focus:ring-2 focus:ring-[hsl(var(--orange))]/20 dark:border-white/10 dark:bg-slate-900 dark:text-white ${buttonClassName} ${open ? 'border-[hsl(var(--orange))] shadow-[0_14px_34px_-22px_rgba(255,136,0,0.85)]' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span>{selectedOption?.label ?? value}</span>
                <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 shrink-0 text-slate-500 dark:text-slate-300"
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
                        className={`absolute left-0 right-0 top-[calc(100%+0.55rem)] z-10 overflow-hidden rounded-[1.15rem] border border-gray-200 bg-white shadow-[0_24px_55px_-24px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-slate-900 ${panelClassName}`}
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
                                                : 'text-slate-700 hover:bg-orange-50 dark:text-slate-200 dark:hover:bg-white/10'
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

const ManageAdmins = () => {
    const { user: currentUser } = useAuth();
    const [admins, setAdmins] = useState<Users[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Stats state
    const [stats, setStats] = useState<{ totalAdmins: number, activeAdmins: number, archivedAdmins: number } | null>(null);

    // Add Admin Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [eligibleInterns, setEligibleInterns] = useState<Users[]>([]);
    const [loadingInterns, setLoadingInterns] = useState(false);
    const [selectedInternId, setSelectedInternId] = useState('');
    const [confirmationStep, setConfirmationStep] = useState(false);
    const [upgrading, setUpgrading] = useState(false);

    // Edit Admin Modal States
    const [editingAdmin, setEditingAdmin] = useState<Users | null>(null);
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

    // Load admins
    const loadAdmins = useCallback(async () => {
        try {
            setError(null);
            const data = await userService.fetchAdmins({
                search: debouncedSearch,
                status: statusFilter,
                dateSort: dateSort
            });
            setAdmins(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch admins');
        }
    }, [debouncedSearch, statusFilter, dateSort]);

    // Load stats
    const loadStats = async () => {
        try {
            const statsData = await userService.getAdminStats();
            setStats(statsData);
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    };

    // Load eligible interns for the modal
    const loadEligibleInterns = async () => {
        try {
            setLoadingInterns(true);
            const data = await userService.fetchInternsForAdminUpgrade();
            setEligibleInterns(data);
        } catch (err) {
            console.error('Error loading eligible interns:', err);
        } finally {
            setLoadingInterns(false);
        }
    };

    // Initial load
    useEffect(() => {
        loadAdmins();
    }, [loadAdmins]);

    useEffect(() => {
        loadStats();
    }, []);

    // Re-fetch whenever users table changes in real-time
    useRealtime('users', () => { loadAdmins(); loadStats(); });

    // Handle archive toggle — opens confirmation modal
    const handleArchiveToggle = (admin: Users) => {
        setArchiveTarget(admin);
    };

    // Confirm archive action
    const confirmArchive = async () => {
        if (!archiveTarget) return;
        try {
            await userService.toggleArchiveAdmin(archiveTarget.id, archiveTarget.status);
            setArchiveTarget(null);
            await loadAdmins();
            await loadStats();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update admin status');
            setArchiveTarget(null);
        }
    };

    const handleOpenAddModal = () => {
        setIsAddModalOpen(true);
        setConfirmationStep(false);
        setSelectedInternId('');
        loadEligibleInterns();
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setConfirmationStep(false);
        setSelectedInternId('');
    };

    const handleContinue = () => {
        if (!selectedInternId) return;
        setConfirmationStep(true);
    };

    const handleConfirmUpgrade = async () => {
        if (!selectedInternId) return;
        try {
            setUpgrading(true);
            await userService.upgradeInternToAdmin(selectedInternId);
            handleCloseAddModal();
            await loadAdmins();
            await loadStats();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to upgrade user');
        } finally {
            setUpgrading(false);
        }
    };

    // ---------- Edit modal helpers ----------
    const openEditModal = (admin: Users) => {
        setEditingAdmin(admin);
        setEditForm({
            full_name: admin.full_name ?? '',
            email: admin.email ?? '',
        });
        setEditError(null);
        document.body.style.overflow = 'hidden';
    };

    const closeEditModal = () => {
        setEditingAdmin(null);
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
        if (!editingAdmin) return;

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

            await userService.updateUser(editingAdmin.id, updates);
            closeEditModal();
            await loadAdmins();
            await loadStats();
        } catch (err) {
            setEditError(err instanceof Error ? err.message : 'Failed to update admin.');
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

    const selectedInternName = eligibleInterns.find(u => u.id === selectedInternId)?.full_name || 'Selected User';

    // Guard Check
    if (!admins || !stats) return <PageLoader message="Loading admins..." />;

    // Pagination Derived State
    const totalPages = Math.ceil(admins.length / ITEMS_PER_PAGE);
    const paginatedAdmins = admins.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="admin-page-shell max-w-full p-0 overflow-hidden">
            {/* Header Section */}
            <div className="manage-interns-header">
                <h1 className="text-primary text-3xl m-0">Manage Admins</h1>
                <button className="btn btn-primary gap-2" onClick={handleOpenAddModal}>
                    <Plus size={18} /> Add Admin
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid manage-users-stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Total Admin</div>
                    <div className="stat-value">{stats.totalAdmins}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Active Admins</div>
                    <div className="stat-value">{stats.activeAdmins}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Archived Admins</div>
                    <div className="stat-value">{stats.archivedAdmins}</div>
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
            <div className="manage-interns-filters flex-col md:flex-row items-stretch md:items-center">
                <div 
                    className="flex justify-between items-center cursor-pointer md:cursor-default w-full md:w-auto"
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                >
                    <div className="flex flex-row items-center gap-2">
                        <Filter size={20} /> <span className="font-semibold">Filters:</span>
                    </div>
                    <ChevronDown size={20} className={`md:hidden transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
                </div>
                
                <div className={`w-full md:w-auto flex-col md:flex-row flex-wrap gap-4 md:flex ${isFiltersOpen ? 'flex mt-4 md:mt-0' : 'hidden md:mt-0'}`}>
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
            </div>

            {/* Error Banner */}
            {error && (
                <div className="p-4 mb-4 bg-red-500/10 text-red-600 rounded-md border border-red-500/20">
                    {error}
                </div>
            )}

            {/* Table Container */}
            <div className="table-container rounded-lg border border-gray-200 dark:border-white/10 overflow-auto bg-white dark:bg-slate-900/60 hidden min-[851px]:block">
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
                        {paginatedAdmins.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 px-4 text-slate-500">No admins found.</td>
                            </tr>
                        ) : (
                            paginatedAdmins.map((admin) => (
                                <tr key={admin.id} className="border-b border-gray-200 dark:border-white/10">
                                    <td className="p-4">{admin.full_name}</td>
                                    <td className="p-4">{admin.email}</td>
                                    <td className="p-4">{formatDate(admin.created_at)}</td>
                                    <td className="p-4">
                                        <span className={`font-medium ${admin.status === 'active' ? 'text-green-500' : 'text-violet-500'}`}>
                                            {admin.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-2">
                                            <button className="bg-transparent border-none cursor-pointer text-slate-500 hover:text-primary" onClick={() => openEditModal(admin)}><Pencil size={18} /></button>
                                            {String(currentUser?.id) !== String(admin.id) && (
                                                <button
                                                    className="bg-transparent border-none cursor-pointer text-slate-500 hover:text-primary"
                                                    title={admin.status === 'active' ? 'Archive' : 'Restore'}
                                                    onClick={() => handleArchiveToggle(admin)}
                                                >
                                                    <Archive size={18} />
                                                </button>
                                            )}
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
                {paginatedAdmins.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">No admins found.</div>
                ) : (
                    paginatedAdmins.map((admin) => (
                        <div key={admin.id} className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold">{admin.full_name}</span>
                                <span className={`text-xs font-medium ${admin.status === 'active' ? 'text-green-500' : 'text-violet-500'}`}>
                                    {admin.status}
                                </span>
                            </div>
                            <div className="text-sm text-slate-500 mb-1">{admin.email}</div>
                            <div className="text-xs text-slate-400 mb-3">{formatDate(admin.created_at)}</div>
                            <div className="flex gap-2">
                                <button
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-orange-50 text-orange-600"
                                    onClick={() => openEditModal(admin)}
                                >
                                    <Pencil size={14} /> Edit
                                </button>
                                {String(currentUser?.id) !== String(admin.id) && (
                                    <button
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-slate-50 text-slate-600"
                                        onClick={() => handleArchiveToggle(admin)}
                                    >
                                        <Archive size={14} /> {admin.status === 'active' ? 'Archive' : 'Restore'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="pagination-controls">
                    <div className="pagination-summary">
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, admins.length)} of {admins.length} admins
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

            {/* Add Admin Modal */}
            {isAddModalOpen && (
                <div className="modal-overlay" onClick={handleCloseAddModal}>
                    <div className="manage-interns-modal bg-[#e6ded6] dark:bg-slate-900 rounded-xl p-8 w-full max-w-[500px] mx-4" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-orange-600 dark:text-orange-400">{confirmationStep ? 'Confirm Admin Addition' : 'Add New Admin'}</h2>
                        {!confirmationStep ? (
                            <div>
                                <label className="block font-semibold mb-2">Select Intern:</label>
                                {loadingInterns ? (
                                    <div className="flex items-center gap-2 text-gray-500 text-sm py-2.5">
                                        <Loader2 size={16} className="spinner" /> Loading eligible users...
                                    </div>
                                ) : (
                                    <SearchableSelect
                                        options={eligibleInterns.map(i => ({ value: i.id, label: `${i.full_name} (${i.email})` }))}
                                        value={selectedInternId}
                                        onChange={setSelectedInternId}
                                        placeholder="-- Choose an intern --"
                                        maxVisible={10}
                                    />
                                )}
                            </div>
                        ) : (
                            <p>Are you sure you want to upgrade <strong>{selectedInternName}</strong>?</p>
                        )}
                        <div className="flex justify-end gap-4 mt-4">
                            <button className="btn" onClick={!confirmationStep ? handleCloseAddModal : () => setConfirmationStep(false)}>
                                {confirmationStep ? 'Back' : 'Cancel'}
                            </button>
                            {!confirmationStep ? (
                                <button className="btn btn-primary" onClick={handleContinue} disabled={!selectedInternId || loadingInterns}>Next</button>
                            ) : (
                                <button className="btn btn-primary" onClick={handleConfirmUpgrade} disabled={upgrading}>
                                    {upgrading ? <Loader2 size={18} /> : 'Confirm Upgrade'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Archive Confirmation Modal ===== */}
            {archiveTarget && (
                <div className="modal-overlay" onClick={() => setArchiveTarget(null)}>
                    <div className="manage-interns-modal bg-[#e6ded6] dark:bg-slate-900 rounded-xl p-8 w-full max-w-[440px] mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
                            <h2 className="text-orange-600 dark:text-orange-400 m-0 text-xl font-bold">
                                {archiveTarget.status === 'active' ? 'Archive Admin' : 'Restore Admin'}
                            </h2>
                        </div>
                        <p className="m-0 mb-6 text-slate-700 dark:text-slate-200 leading-6">
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

            {/* ===== Edit Admin Modal ===== */}
            {editingAdmin && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm" onClick={closeEditModal}>
                    <div className="edit-modal-panel" onClick={(e) => e.stopPropagation()}>
                        {/* Heading */}
                        <div className="mb-8">
                            <h2 className="text-orange-600 dark:text-orange-400 m-0 text-2xl font-bold">Edit Admin Information</h2>
                        </div>

                        {editError && (
                            <div className="py-3 px-4 mb-6 bg-red-500/10 text-red-600 rounded-lg border border-red-500/20 text-sm">
                                {editError}
                            </div>
                        )}

                        {/* Full Name */}
                        <div className="mb-6">
                            <label className="block font-semibold mb-2">Full Name:</label>
                            <input
                                className="input w-full bg-white dark:bg-slate-800"
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
                                className="input w-full bg-white dark:bg-slate-800"
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

export default ManageAdmins;
