import { useState, useEffect, useCallback, useRef } from 'react';
import { Pencil, AlertCircle, Search, Filter, Archive, Plus, Loader2 } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import SearchableSelect from '../../components/SearchableSelect';
import { userService } from '../../services/userServices';
import { useRealtime } from '../../hooks/useRealtime';
import type { Users } from '../../types/database.types';

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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Stats state
    const [stats, setStats] = useState<{ totalSupervisors: number, activeSupervisors: number, archivedSupervisors: number } | null>(null);

    // Add Supervisor Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [eligibleInterns, setEligibleInterns] = useState<Users[]>([]);
    const [loadingInterns, setLoadingInterns] = useState(false);
    const [selectedInternId, setSelectedInternId] = useState('');
    const [confirmationStep, setConfirmationStep] = useState(false);
    const [upgrading, setUpgrading] = useState(false);

    // Edit Supervisor Modal States
    const [editingSupervisor, setEditingSupervisor] = useState<Users | null>(null);
    const [editForm, setEditForm] = useState<EditFormData>({ full_name: '', email: '' });
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    // Archive Confirmation Modal State
    const [archiveTarget, setArchiveTarget] = useState<Users | null>(null);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // Load eligible interns for the modal
    const loadEligibleInterns = async () => {
        try {
            setLoadingInterns(true);
            const data = await userService.fetchInternsForSupervisorUpgrade();
            setEligibleInterns(data);
        } catch (err) {
            console.error('Error loading eligible interns:', err);
        } finally {
            setLoadingInterns(false);
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
            await userService.upgradeInternToSupervisor(selectedInternId);
            handleCloseAddModal();
            await loadSupervisors();
            await loadStats();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to upgrade user');
        } finally {
            setUpgrading(false);
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

    const selectedInternName = eligibleInterns.find(u => u.id === selectedInternId)?.full_name || 'Selected User';

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
                <button className="btn btn-primary gap-2" onClick={handleOpenAddModal}>
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
                    <select className="select" value={dateSort} onChange={(e) => setDateSort(e.target.value as 'newest' | 'oldest')}>
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                    </select>
                </div>
                <div className="filter-dropdown">
                    <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                    </select>
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
            {isAddModalOpen && (
                <div className="modal-overlay" onClick={handleCloseAddModal}>
                    <div className="manage-interns-modal bg-[#e6ded6] rounded-xl p-8 w-full max-w-[500px]" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-orange-600">{confirmationStep ? 'Confirm Supervisor Addition' : 'Add New Supervisor'}</h2>
                        {!confirmationStep ? (
                            <div>
                                <label className="block font-semibold mb-2">Select Intern:</label>
                                {loadingInterns ? (
                                    <div className="flex items-center gap-2 text-slate-500 text-sm py-2.5">
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
                            <p>Are you sure you want to upgrade <strong>{selectedInternName}</strong> to Supervisor?</p>
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
