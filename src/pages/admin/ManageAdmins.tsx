import { useState, useEffect, useCallback, useRef } from 'react';
import { Archive, Filter, Loader2, Pencil, Plus, Search, UserCheck, Users as UsersIcon } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import SearchableSelect from '../../components/SearchableSelect';
import DropdownSelect, { type DropdownSelectOption } from '../../components/DropdownSelect';
import MobileFilterDrawer from '../../components/MobileFilterDrawer';
import ModalPortal from '../../components/ModalPortal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { userService } from '../../services/userServices';
import { useRealtime } from '../../hooks/useRealtime';
import { useAuth } from '../../context/AuthContext';
import type { Users } from '../../types/database.types';

// Shape of the edit form data (admin only needs name + email)
interface EditFormData {
    full_name: string;
    email: string;
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
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

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
        <div className="admin-page-shell w-full space-y-6 overflow-hidden">
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
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-500/20">
                        <UsersIcon size={20} className="text-blue-600 dark:text-blue-300" />
                    </div>
                    <div className="stat-label">Total Admin</div>
                    <div className="stat-value">{stats.totalAdmins}</div>
                </div>
                <div className="stat-card">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-500/20">
                        <UserCheck size={20} className="text-green-600 dark:text-green-300" />
                    </div>
                    <div className="stat-label">Active Admins</div>
                    <div className="stat-value">{stats.activeAdmins}</div>
                </div>
                <div className="stat-card">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-500/20">
                        <Archive size={20} className="text-violet-600 dark:text-violet-300" />
                    </div>
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
            <div className="manage-interns-filters !hidden items-center gap-4 min-[851px]:!flex">
                <div className="flex flex-row items-center gap-2">
                    <Filter size={20} /> <span className="font-semibold">Filters:</span>
                </div>

                <div className="flex w-full flex-col flex-wrap gap-4 min-[851px]:flex-1 min-[851px]:flex-row">
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
                <ModalPortal>
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
                </ModalPortal>
            )}

            {/* ===== Archive Confirmation Modal ===== */}
            <ConfirmationModal
                open={Boolean(archiveTarget)}
                title={archiveTarget?.status === 'active' ? 'Archive Admin' : 'Restore Admin'}
                message={archiveTarget
                    ? `Are you sure you want to ${archiveTarget.status === 'active' ? 'archive' : 'restore'} ${archiveTarget.full_name}?`
                    : ''}
                note={archiveTarget
                    ? archiveTarget.status === 'active'
                        ? 'This will revoke their access to the system.'
                        : 'This will allow them to access the system again.'
                    : undefined}
                confirmLabel={archiveTarget?.status === 'active' ? 'Confirm Archive' : 'Confirm Restore'}
                onCancel={() => setArchiveTarget(null)}
                onConfirm={confirmArchive}
            />

            {/* ===== Edit Admin Modal ===== */}
            {editingAdmin && (
                <ModalPortal>
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
                </ModalPortal>
            )}
        </div>
    );
};

export default ManageAdmins;
