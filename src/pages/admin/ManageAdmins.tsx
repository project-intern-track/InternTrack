import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search,
    Filter,
    Pencil,
    Archive,
    Plus,
    Loader2,
    ChevronDown,
    ShieldCheck
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { userService } from '../../services/userServices';
import { useRealtime } from '../../hooks/useRealtime';
import type { Users } from '../../types/database.types';

interface EditFormData {
    full_name: string;
    email: string;
}

const ManageAdmins = () => {
    const [admins, setAdmins] = useState<Users[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
    const [statusFilter, setStatusFilter] = useState('all');

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [stats, setStats] = useState<{ totalAdmins: number, activeAdmins: number, archivedAdmins: number } | null>(null);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [eligibleInterns, setEligibleInterns] = useState<Users[]>([]);
    const [loadingInterns, setLoadingInterns] = useState(false);
    const [selectedInternId, setSelectedInternId] = useState('');
    const [confirmationStep, setConfirmationStep] = useState(false);
    const [upgrading, setUpgrading] = useState(false);

    const [editingAdmin, setEditingAdmin] = useState<Users | null>(null);
    const [editForm, setEditForm] = useState<EditFormData>({ full_name: '', email: '' });
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, statusFilter, dateSort]);

    const loadAdmins = useCallback(async () => {
        try {
            setError(null);
            const data = await userService.fetchAdmins({
                search: debouncedSearch,
                status: statusFilter,
                dateSort,
            });
            setAdmins(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch admins');
        }
    }, [debouncedSearch, statusFilter, dateSort]);

    const loadStats = async () => {
        try {
            const statsData = await userService.getAdminStats();
            setStats(statsData);
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    };

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

    useEffect(() => {
        loadAdmins();
    }, [loadAdmins]);

    useEffect(() => {
        loadStats();
    }, []);

    useRealtime('users', () => { loadAdmins(); loadStats(); });

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

        if (name === 'full_name' && /\d/.test(value)) {
            return;
        }

        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditSave = async () => {
        if (!editingAdmin) return;

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
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        });
    };

    const selectedInternName = eligibleInterns.find((u) => u.id === selectedInternId)?.full_name || 'Selected User';

    if (!admins || !stats) return null;

    const totalPages = Math.ceil(admins.length / ITEMS_PER_PAGE);
    const paginatedAdmins = admins.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-orange-50/40 to-gray-50 p-6 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            >
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Manage Admins</h1>
                    <p className="mt-1 text-sm text-gray-600">Maintain administrator accounts and access status.</p>
                </div>
                <button
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff7a00] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#eb6f00]"
                    onClick={handleOpenAddModal}
                >
                    <Plus size={18} />
                    Add Admin
                </button>
            </motion.div>

            <div className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                    { label: 'Total Admins', value: stats.totalAdmins },
                    { label: 'Active Admins', value: stats.activeAdmins },
                    { label: 'Archived Admins', value: stats.archivedAdmins },
                ].map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
                    >
                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">{item.label}</p>
                        <h3 className="text-4xl font-black tracking-tight text-gray-900">{item.value}</h3>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="mb-6 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm"
            >
                <div className="mb-3 relative">
                    <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
                        placeholder="Search by name or email"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600">
                        <Filter size={16} />
                        Filters
                    </div>

                    <div className="relative min-w-[180px]">
                        <select
                            className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-8 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
                            value={dateSort}
                            onChange={(e) => setDateSort(e.target.value as 'newest' | 'oldest')}
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>

                    <div className="relative min-w-[180px]">
                        <select
                            className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-8 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>
            </motion.div>

            {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                </div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.08 }}
                className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm"
            >
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse">
                        <thead>
                            <tr className="bg-[#ff7a00] text-left text-xs font-semibold uppercase tracking-wide text-white">
                                <th className="px-5 py-3.5">Name</th>
                                <th className="px-5 py-3.5">Email Address</th>
                                <th className="px-5 py-3.5">Date Created</th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedAdmins.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-14 text-center text-sm text-gray-500">
                                        No admins found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedAdmins.map((admin, index) => (
                                    <motion.tr
                                        key={admin.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.18) }}
                                        className="border-b border-gray-100 text-sm text-gray-700 hover:bg-orange-50/40"
                                    >
                                        <td className="px-5 py-4 font-medium text-gray-900">{admin.full_name}</td>
                                        <td className="px-5 py-4">{admin.email}</td>
                                        <td className="px-5 py-4">{formatDate(admin.created_at)}</td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${admin.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'}`}>
                                                {admin.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    className="rounded-lg p-2 text-gray-500 transition hover:bg-orange-100 hover:text-[#ff7a00]"
                                                    onClick={() => openEditModal(admin)}
                                                    title="Edit"
                                                >
                                                    <Pencil size={17} />
                                                </button>
                                                <button
                                                    className="rounded-lg p-2 text-gray-500 transition hover:bg-orange-100 hover:text-[#ff7a00]"
                                                    onClick={() => handleArchiveToggle(admin)}
                                                    title={admin.status === 'active' ? 'Archive' : 'Restore'}
                                                >
                                                    <Archive size={17} />
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

            {totalPages > 1 && (
                <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm md:flex-row">
                    <p className="text-sm text-gray-600">
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, admins.length)} of {admins.length} admins
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                                        className={`rounded-lg px-3 py-2 text-sm font-semibold ${currentPage === page ? 'bg-[#ff7a00] text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                );
                            }
                            if (page === currentPage - 2 || page === currentPage + 2) {
                                return <span key={page} className="px-1 text-gray-400">...</span>;
                            }
                            return null;
                        })}
                        <button
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {isAddModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
                        onClick={handleCloseAddModal}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 16, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.96 }}
                            transition={{ duration: 0.24 }}
                            className="w-full max-w-xl rounded-2xl border border-orange-100 bg-white p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="mb-5 text-xl font-bold text-gray-900">
                                {confirmationStep ? 'Confirm Admin Addition' : 'Add New Admin'}
                            </h2>

                            {!confirmationStep ? (
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Select Intern</label>
                                    <div className="relative">
                                        <select
                                            className="w-full appearance-none rounded-xl border border-gray-200 px-3 py-2.5 pr-8 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
                                            value={selectedInternId}
                                            onChange={(e) => setSelectedInternId(e.target.value)}
                                            disabled={loadingInterns}
                                        >
                                            <option value="">-- Choose an intern --</option>
                                            {eligibleInterns.map((intern) => (
                                                <option key={intern.id} value={intern.id}>
                                                    {intern.full_name} ({intern.email})
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                    {loadingInterns && (
                                        <p className="mt-2 text-xs text-gray-500">Loading eligible users...</p>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4">
                                    <p className="text-sm text-gray-700">
                                        Are you sure you want to upgrade <span className="font-semibold text-gray-900">{selectedInternName}</span> to admin?
                                    </p>
                                </div>
                            )}

                            <div className="mt-6 flex flex-col justify-end gap-2 sm:flex-row">
                                <button
                                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                    onClick={!confirmationStep ? handleCloseAddModal : () => setConfirmationStep(false)}
                                >
                                    {confirmationStep ? 'Back' : 'Cancel'}
                                </button>
                                {!confirmationStep ? (
                                    <button
                                        className="rounded-xl bg-[#ff7a00] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#eb6f00] disabled:cursor-not-allowed disabled:opacity-60"
                                        onClick={handleContinue}
                                        disabled={!selectedInternId || loadingInterns}
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff7a00] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#eb6f00] disabled:cursor-not-allowed disabled:opacity-60"
                                        onClick={handleConfirmUpgrade}
                                        disabled={upgrading}
                                    >
                                        {upgrading ? <Loader2 size={16} className="animate-spin" /> : null}
                                        {upgrading ? 'Upgrading...' : 'Confirm Upgrade'}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {editingAdmin && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
                        onClick={closeEditModal}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 16, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.96 }}
                            transition={{ duration: 0.24 }}
                            className="w-full max-w-md rounded-2xl border border-orange-100 bg-white p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="mb-5 text-xl font-bold text-gray-900">Edit Admin Information</h2>

                            {editError && (
                                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {editError}
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Full Name</label>
                                <input
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
                                    name="full_name"
                                    value={editForm.full_name}
                                    onChange={handleEditChange}
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email Address</label>
                                <input
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
                                    name="email"
                                    type="email"
                                    value={editForm.email}
                                    onChange={handleEditChange}
                                    placeholder="Enter email address"
                                />
                            </div>

                            <div className="flex flex-col justify-end gap-2 sm:flex-row">
                                <button
                                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                    onClick={closeEditModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff7a00] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#eb6f00] disabled:cursor-not-allowed disabled:opacity-60"
                                    onClick={handleEditSave}
                                    disabled={saving}
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="pointer-events-none fixed bottom-6 right-6 hidden rounded-full border border-orange-200 bg-white/85 p-2 text-orange-500 shadow-sm lg:block">
                <ShieldCheck size={16} />
            </div>
        </div>
    );
};

export default ManageAdmins;
