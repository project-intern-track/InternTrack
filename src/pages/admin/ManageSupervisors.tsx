import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Pencil, AlertCircle, Search, Filter, Archive, Plus, Loader2 } from 'lucide-react';
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
        <div style={{ maxWidth: '100%', padding: '0', overflow: 'hidden' }}>
            {/* Header Section */}
            <div className="manage-interns-header">
                <h1 style={{ color: 'hsl(var(--orange))', fontSize: '2rem', margin: 0 }}>Manage Supervisors</h1>
                <button className="btn btn-primary" style={{ gap: '0.5rem' }} onClick={handleSignUpModal}>
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
                        {paginatedSupervisors.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '3rem 1rem', color: '#64748b' }}>No supervisors found.</td>
                            </tr>
                        ) : (
                            paginatedSupervisors.map((supervisor) => (
                                <tr key={supervisor.id} style={{ borderBottom: '1px solid #e5e5e5' }}>
                                    <td style={{ padding: '1rem' }}>{supervisor.full_name}</td>
                                    <td style={{ padding: '1rem' }}>{supervisor.email}</td>
                                    <td style={{ padding: '1rem' }}>{formatDate(supervisor.created_at)}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ color: supervisor.status === 'active' ? '#22c55e' : '#8b5cf6', fontWeight: 500 }}>
                                            {supervisor.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => openEditModal(supervisor)}><Pencil size={18} /></button>
                                            <button
                                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
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
                    <div className="manage-interns-modal" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#e6ded6', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ color: '#ea580c' }}>Register New Supervisor</h2>

                        {signUpSuccess && (
                            <div style={{
                                padding: '1rem',
                                marginBottom: '1.5rem',
                                backgroundColor: '#dcfce7',
                                color: '#166534',
                                borderRadius: '8px',
                                border: '1px solid #86efac',
                            }}>
                                ✅ Registration successful! Credentials sent to {signUpForm.email}
                            </div>
                        )}

                        {signUpError && (
                            <div style={{
                                padding: '0.75rem 1rem',
                                marginBottom: '1.5rem',
                                backgroundColor: 'hsl(var(--danger) / 0.1)',
                                color: 'hsl(var(--danger))',
                                borderRadius: '8px',
                                border: '1px solid hsl(var(--danger) / 0.2)',
                                fontSize: '0.875rem',
                            }}>
                                {signUpError}
                            </div>
                        )}

                        {!signUpSuccess && (
                            <div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Full Name:</label>
                                    <input
                                        className="input"
                                        name="full_name"
                                        value={signUpForm.full_name}
                                        onChange={handleSignUpChange}
                                        placeholder="Enter full name"
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Email:</label>
                                    <input
                                        className="input"
                                        name="email"
                                        type="email"
                                        value={signUpForm.email}
                                        onChange={handleSignUpChange}
                                        placeholder="Enter email"
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Password:</label>
                                    <input
                                        className="input"
                                        name="password"
                                        type="password"
                                        value={signUpForm.password}
                                        onChange={handleSignUpChange}
                                        placeholder="Min 8 characters"
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Confirm Password:</label>
                                    <input
                                        className="input"
                                        name="password_confirmation"
                                        type="password"
                                        value={signUpForm.password_confirmation}
                                        onChange={handleSignUpChange}
                                        placeholder="Confirm password"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                            <button className="btn" onClick={handleCloseSignupModal} disabled={signUpLoading}>
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
                    <div className="manage-interns-modal" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#e6ded6', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '440px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
                            <h2 style={{ color: '#ea580c', margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                                {archiveTarget.status === 'active' ? 'Archive Supervisor' : 'Restore Supervisor'}
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

            {/* ===== Edit Supervisor Modal ===== */}
            {editingSupervisor && (
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
                            <h2 style={{ color: '#ea580c', margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Edit Supervisor Information</h2>
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

export default ManageSupervisors;
