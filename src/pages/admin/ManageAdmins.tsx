import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search,
    Filter,
    Pencil,
    Archive,
    ChevronDown,
    Plus,
    Loader2
} from 'lucide-react';
import { userService } from '../../services/userServices';
import type { Users } from '../../types/database.types';

const ManageAdmins = () => {
    const [admins, setAdmins] = useState<Users[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
    const [statusFilter, setStatusFilter] = useState('all');

    // Stats state
    const [stats, setStats] = useState({ totalAdmins: 0, activeAdmins: 0, archivedAdmins: 0 });

    // Add Admin Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [eligibleInterns, setEligibleInterns] = useState<Users[]>([]);
    const [loadingInterns, setLoadingInterns] = useState(false);
    const [selectedInternId, setSelectedInternId] = useState('');
    const [confirmationStep, setConfirmationStep] = useState(false);
    const [upgrading, setUpgrading] = useState(false);

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

    // Load admins
    const loadAdmins = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await userService.fetchAdmins({
                search: debouncedSearch,
                status: statusFilter,
                dateSort: dateSort
            });
            setAdmins(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch admins');
        } finally {
            setLoading(false);
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

    // Initial load and reload on filter change
    useEffect(() => {
        loadAdmins();
    }, [loadAdmins]);

    // Initial stats load
    useEffect(() => {
        loadStats();
    }, []);

    // Handle archive toggle
    const handleArchiveToggle = async (admin: Users) => {
        try {
            await userService.toggleArchiveAdmin(admin.id, admin.status);
            // Refresh list and stats
            await loadAdmins();
            await loadStats();
        } catch (err) {
            console.error('Error toggling archive:', err);
            alert(err instanceof Error ? err.message : 'Failed to update admin status');
        }
    };

    // Handle Open Modal
    const handleOpenAddModal = () => {
        setIsAddModalOpen(true);
        setConfirmationStep(false);
        setSelectedInternId('');
        loadEligibleInterns();
    };

    // Handle Close Modal
    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setConfirmationStep(false);
        setSelectedInternId('');
    };

    // Handle Continue to Confirmation
    const handleContinue = () => {
        if (!selectedInternId) return;
        setConfirmationStep(true);
    };

    // Handle Confirm Upgrade
    const handleConfirmUpgrade = async () => {
        if (!selectedInternId) return;
        try {
            setUpgrading(true);
            await userService.upgradeInternToAdmin(selectedInternId);
            handleCloseAddModal();
            // Refresh main list and stats
            await loadAdmins();
            await loadStats();
        } catch (err) {
            console.error('Error upgrading user:', err);
            alert(err instanceof Error ? err.message : 'Failed to upgrade user');
        } finally {
            setUpgrading(false);
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

    // Get selected intern name for confirmation message
    const selectedInternName = eligibleInterns.find(u => u.id === selectedInternId)?.full_name || 'Selected User';

    return (
        <div style={{ maxWidth: '100%', padding: '0', overflow: 'hidden' }}>
            {/* Header Section */}
            <div className="manage-interns-header">
                <h1 style={{ color: 'hsl(var(--orange))', fontSize: '2rem', margin: 0 }}>Manage Admins</h1>
                <button
                    className="btn btn-primary"
                    style={{ gap: '0.5rem' }}
                    onClick={handleOpenAddModal}
                >
                    <Plus size={18} />
                    Add Admin
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Total Admin</span>
                    </div>
                    <div className="stat-value">{stats.totalAdmins}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Active Admins</span>
                    </div>
                    <div className="stat-value">{stats.activeAdmins}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Archived Admins</span>
                    </div>
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
                <div className="row" style={{ alignItems: 'center', gap: '0.5rem', minWidth: 'fit-content' }}>
                    <Filter size={20} />
                    <span style={{ fontWeight: 600 }}>Filters:</span>
                </div>

                <div className="filter-dropdown">
                    <select
                        className="select"
                        style={{ width: '100%' }}
                        value={dateSort}
                        onChange={(e) => setDateSort(e.target.value as 'newest' | 'oldest')}
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>

                <div className="filter-dropdown">
                    <select
                        className="select"
                        style={{ width: '100%' }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
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

            {/* Table Container - Scrollable */}
            <div className="table-container" style={{
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
                overflow: 'auto',
                backgroundColor: 'white',
                width: '100%',
                maxWidth: '100vw',
                position: 'relative'
            }}>
                <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'center' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#ff9800', color: 'white' }}>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: 'none', whiteSpace: 'nowrap' }}>Name</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: 'none', whiteSpace: 'nowrap' }}>Email Address</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: 'none', whiteSpace: 'nowrap' }}>Date Created</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: 'none', whiteSpace: 'nowrap' }}>Status</th>
                            <th style={{ padding: '1rem', fontWeight: 600, borderBottom: 'none', whiteSpace: 'nowrap' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: '#64748b' }}>
                                        <Loader2 size={24} className="spinner" />
                                        <span>Loading admins...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : admins.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                                    No admins found.
                                </td>
                            </tr>
                        ) : (
                            admins.map((admin) => (
                                <tr key={admin.id} style={{ borderBottom: '1px solid #e5e5e5' }}>
                                    <td style={{ padding: '1rem', color: '#334155' }}>{admin.full_name}</td>
                                    <td style={{ padding: '1rem', color: '#334155' }}>{admin.email}</td>
                                    <td style={{ padding: '1rem', color: '#334155' }}>{formatDate(admin.created_at)}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span
                                            style={{
                                                color: admin.status === 'active' ? '#22c55e' : '#8b5cf6',
                                                fontWeight: 500,
                                                textTransform: 'capitalize'
                                            }}
                                        >
                                            {admin.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                            <button
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#64748b',
                                                    padding: '4px'
                                                }}
                                                title="Edit"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#64748b',
                                                    padding: '4px'
                                                }}
                                                title={admin.status === 'active' ? 'Archive' : 'Restore'}
                                                onClick={() => handleArchiveToggle(admin)}
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

            {/* Add Admin Modal */}
            {isAddModalOpen && (
                <div className="modal-overlay" onClick={handleCloseAddModal}>
                    <div className="manage-interns-modal" onClick={(e) => e.stopPropagation()} style={{
                        backgroundColor: '#e6ded6',
                        borderRadius: '12px',
                        padding: '2rem',
                        width: '100%',
                        maxWidth: '500px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem'
                    }}>
                        {/* Header */}
                        <div>
                            <h2 style={{ color: '#ea580c', margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                                {confirmationStep ? 'Confirm Admin Addition' : 'Add New Admin'}
                            </h2>
                            {!confirmationStep && (
                                <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                                    Select an existing intern to upgrade to administrator status.
                                </p>
                            )}
                        </div>

                        {/* Content */}
                        {!confirmationStep ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontWeight: 600 }}>Select Intern:</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        className="select"
                                        style={{ width: '100%', backgroundColor: 'white' }}
                                        value={selectedInternId}
                                        onChange={(e) => setSelectedInternId(e.target.value)}
                                        disabled={loadingInterns}
                                    >
                                        <option value="">-- Choose an intern --</option>
                                        {eligibleInterns.map(intern => (
                                            <option key={intern.id} value={intern.id}>
                                                {intern.full_name} ({intern.email})
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                </div>
                                {loadingInterns && <span style={{ fontSize: '0.8rem', color: '#666' }}>Loading eligible users...</span>}
                            </div>
                        ) : (
                            <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
                                <p style={{ margin: 0, color: '#334155', lineHeight: '1.6' }}>
                                    Are you sure you want to upgrade <strong>{selectedInternName}</strong> to an Admin?
                                    <br /><br />
                                    This user will gain full access to the admin dashboard and management features.
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="row" style={{ justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                            <button
                                className="btn"
                                onClick={!confirmationStep ? handleCloseAddModal : () => setConfirmationStep(false)}
                                disabled={upgrading}
                                style={{ backgroundColor: 'white', color: '#ea580c', border: 'none', padding: '0.75rem 1.5rem' }}
                            >
                                {confirmationStep ? 'Back' : 'Cancel'}
                            </button>

                            {!confirmationStep ? (
                                <button
                                    className="btn btn-primary"
                                    onClick={handleContinue}
                                    disabled={!selectedInternId || loadingInterns}
                                    style={{ backgroundColor: '#ff8c42', border: 'none', padding: '0.75rem 1.5rem' }}
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    className="btn btn-primary"
                                    onClick={handleConfirmUpgrade}
                                    disabled={upgrading}
                                    style={{ backgroundColor: '#ff8c42', border: 'none', padding: '0.75rem 1.5rem' }}
                                >
                                    {upgrading ? <Loader2 className="spinner" size={18} /> : 'Confirm Upgrade'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageAdmins;
