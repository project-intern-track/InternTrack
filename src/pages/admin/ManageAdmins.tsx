import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search,
    Filter,
    Pencil,
    Archive,
    Plus,
    Loader2
} from 'lucide-react';
import { userService } from '../../services/userServices';
import type { Users } from '../../types/database.types';

const ManageAdmins = () => {
    const [admins, setAdmins] = useState<Users[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
    const [statusFilter, setStatusFilter] = useState('all');

    // Stats state
    const [stats, setStats] = useState<{ totalAdmins: number, activeAdmins: number, archivedAdmins: number } | null>(null);

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

    // Handle archive toggle
    const handleArchiveToggle = async (admin: Users) => {
        try {
            await userService.toggleArchiveAdmin(admin.id, admin.status);
            await loadAdmins();
            await loadStats();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update admin status');
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
    if (!admins || !stats) return null;

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
                        {admins.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '3rem 1rem', color: '#64748b' }}>No admins found.</td>
                            </tr>
                        ) : (
                            admins.map((admin) => (
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
                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Pencil size={18} /></button>
                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => handleArchiveToggle(admin)}><Archive size={18} /></button>
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
        </div>
    );
};

export default ManageAdmins;