import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search,
    Filter,
    Pencil,
    Archive,
    Plus,
    Loader2,
    AlertTriangle
} from 'lucide-react';
import PageLoader from '../../components/PageLoader';
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
        <div style={{ maxWidth: '100%', padding: '0', overflow: 'hidden' }}>
            {/* Header Section */}
            <div className="manage-interns-header">
                <h1 style={{ color: 'hsl(var(--orange))', fontSize: '2rem', margin: 0 }}>Manage Admins</h1>
                <button className="btn btn-primary" style={{ gap: '0.5rem' }} onClick={handleOpenAddModal}>
                    <Plus size={18} /> Add Admin
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
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
            <div style={{ marginBottom: '1.5rem' }}>
                <div className="input-group" style={{ position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                    <input
                        type="text"
                        className="input"
                        placeholder="Search by name or email"
                        style={{ paddingLeft: '3rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Filter Section */}
            <div className="manage-interns-filters">
                <div className="row" style={{ alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={20} /> <span style={{ fontWeight: 600 }}>Filters:</span>
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

            {/* Table Container */}
            <div className="table-container" style={{ borderRadius: '8px', border: '1px solid #e5e5e5', overflow: 'auto', backgroundColor: 'white' }}>
                <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'center' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#ff9800', color: 'white' }}>
                            <th style={{ padding: '1rem' }}>Name</th>
                            <th style={{ padding: '1rem' }}>Email Address</th>
                            <th style={{ padding: '1rem' }}>Date Created</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedAdmins.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '3rem 1rem', color: '#64748b' }}>No admins found.</td>
                            </tr>
                        ) : (
                            paginatedAdmins.map((admin) => (
                                <tr key={admin.id} style={{ borderBottom: '1px solid #e5e5e5' }}>
                                    <td style={{ padding: '1rem' }}>{admin.full_name}</td>
                                    <td style={{ padding: '1rem' }}>{admin.email}</td>
                                    <td style={{ padding: '1rem' }}>{formatDate(admin.created_at)}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ color: admin.status === 'active' ? '#22c55e' : '#8b5cf6', fontWeight: 500 }}>
                                            {admin.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => openEditModal(admin)}><Pencil size={18} /></button>
                                            {String(currentUser?.id) !== String(admin.id) && (
                                                <button
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
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
                    <div className="manage-interns-modal" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#e6ded6', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ color: '#ea580c' }}>{confirmationStep ? 'Confirm Admin Addition' : 'Add New Admin'}</h2>
                        {!confirmationStep ? (
                            <div>
                                <label>Select Intern:</label>
                                <select className="select" style={{ width: '100%' }} value={selectedInternId} onChange={(e) => setSelectedInternId(e.target.value)} disabled={loadingInterns}>
                                    <option value="">-- Choose an intern --</option>
                                    {eligibleInterns.map(intern => (
                                        <option key={intern.id} value={intern.id}>{intern.full_name} ({intern.email})</option>
                                    ))}
                                </select>
                                {loadingInterns && <span style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>Loading eligible users...</span>}
                            </div>
                        ) : (
                            <p>Are you sure you want to upgrade <strong>{selectedInternName}</strong>?</p>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
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
                    <div className="manage-interns-modal" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#e6ded6', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '440px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <AlertTriangle size={24} style={{ color: '#ea580c' }} />
                            <h2 style={{ color: '#ea580c', margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                                {archiveTarget.status === 'active' ? 'Archive Admin' : 'Restore Admin'}
                            </h2>
                        </div>
                        <p style={{ margin: '0 0 1.5rem', color: '#334155', lineHeight: 1.5 }}>
                            Are you sure you want to {archiveTarget.status === 'active' ? 'archive' : 'restore'}{' '}
                            <strong>{archiveTarget.full_name}</strong>?
                            {archiveTarget.status === 'active' && ' This will revoke their access to the system.'}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                className="btn"
                                onClick={() => setArchiveTarget(null)}
                                style={{ backgroundColor: 'white', color: '#ea580c', border: 'none', padding: '0.75rem 1.5rem' }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={confirmArchive}
                                style={{ backgroundColor: '#ff8c42', border: 'none', padding: '0.75rem 1.5rem' }}
                            >
                                {archiveTarget.status === 'active' ? 'Confirm Archive' : 'Confirm Restore'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Edit Admin Modal ===== */}
            {editingAdmin && (
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
                            <h2 style={{ color: '#ea580c', margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Edit Admin Information</h2>
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
                        <div style={{ marginBottom: '3rem' }}>
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