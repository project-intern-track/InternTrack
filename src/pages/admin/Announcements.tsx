import { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Plus,
    ChevronDown,
    Loader2,
    Megaphone
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { announcementService } from '../../services/announcementService';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../hooks/useRealtime';
import type { Announcement, AnnouncementPriority } from '../../types/database.types';

const Announcements = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [dateCreatedFilter, setDateCreatedFilter] = useState('all');

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'low' as AnnouncementPriority,
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchAnnouncements = async () => {
        try {
            const data = await announcementService.getAnnouncements();
            const sorted = (data || []).sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setAnnouncements(sorted);
        } catch (err) {
            console.error(err);
            setAnnouncements([]);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    useRealtime('announcements', fetchAnnouncements);

    const handleCreate = async () => {
        if (!user) return;
        if (!formData.title || !formData.content) {
            alert('Title and content are required');
            return;
        }

        try {
            setSubmitting(true);
            await announcementService.createAnnouncement({
                title: formData.title,
                content: formData.content,
                priority: formData.priority,
                created_by: user.id,
                visibility: 'all',
            });
            setIsModalOpen(false);
            setFormData({ title: '', content: '', priority: 'low' });
            fetchAnnouncements();
        } catch (err) {
            console.error(err);
            alert('Failed to create announcement');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredAnnouncements = (() => {
        if (!announcements) return [];

        let result = announcements.filter((a) => {
            const cleanSearch = searchTerm.trim().toLowerCase();
            const matchesPriority = priorityFilter === 'all' || a.priority === priorityFilter;

            if (!cleanSearch) return matchesPriority;

            const matchesSearch =
                a.title.toLowerCase().includes(cleanSearch) ||
                a.content.toLowerCase().includes(cleanSearch);
            return matchesSearch && matchesPriority;
        });

        if (dateCreatedFilter === 'this-month') {
            const now = new Date();
            result = result.filter((a) => {
                const d = new Date(a.created_at);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
        } else if (dateCreatedFilter === 'this-year') {
            const year = new Date().getFullYear();
            result = result.filter((a) => new Date(a.created_at).getFullYear() === year);
        }

        if (dateCreatedFilter === 'newest') {
            result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else if (dateCreatedFilter === 'oldest') {
            result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        }

        return result;
    })();

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'high':
                return 'bg-red-500';
            case 'medium':
                return 'bg-amber-500';
            case 'low':
                return 'bg-blue-500';
            default:
                return 'bg-gray-400';
        }
    };

    const getPriorityPill = (p: string) => {
        switch (p) {
            case 'high':
                return 'bg-red-50 text-red-700 ring-red-200';
            case 'medium':
                return 'bg-amber-50 text-amber-700 ring-amber-200';
            case 'low':
                return 'bg-blue-50 text-blue-700 ring-blue-200';
            default:
                return 'bg-gray-50 text-gray-700 ring-gray-200';
        }
    };

    const getPriorityLabel = (p: string) => `${p.charAt(0).toUpperCase()}${p.slice(1)} Priority`;

    if (!announcements) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-orange-50/40 to-gray-50 p-6 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            >
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Announcements</h1>
                    <p className="mt-1 text-sm text-gray-600">Create and publish updates for the entire platform.</p>
                </div>
                <button
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff7a00] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#eb6f00]"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus size={18} />
                    Create Announcement
                </button>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="mb-6 rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-sm backdrop-blur"
            >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <Search
                            size={18}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
                            placeholder="Search by title or content"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600">
                        <Filter size={16} />
                        Filters
                    </div>

                    <div className="relative min-w-[190px]">
                        <select
                            className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-8 text-sm text-gray-700 outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
                            value={dateCreatedFilter}
                            onChange={(e) => setDateCreatedFilter(e.target.value)}
                        >
                            <option value="all">All Date Created</option>
                            <option value="newest">Newest to Oldest</option>
                            <option value="oldest">Oldest to Newest</option>
                            <option value="this-month">This Month</option>
                            <option value="this-year">This Year</option>
                        </select>
                        <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                    </div>

                    <div className="relative min-w-[160px]">
                        <select
                            className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-8 text-sm text-gray-700 outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                        >
                            <option value="all">All Priority</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                        <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                    </div>
                </div>
            </motion.div>

            {filteredAnnouncements.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                    <Megaphone className="mx-auto mb-3 text-gray-300" size={36} />
                    <p className="text-sm font-medium text-gray-500">No announcements found for the selected filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    {filteredAnnouncements.map((announcement, index) => (
                        <motion.article
                            key={announcement.id}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.2) }}
                            className="group flex h-full flex-col rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="mb-4 flex items-start justify-between gap-3">
                                <h3 className="line-clamp-2 text-lg font-semibold text-gray-900">{announcement.title}</h3>
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getPriorityPill(announcement.priority)}`}
                                >
                                    <span className={`h-2 w-2 rounded-full ${getPriorityColor(announcement.priority)}`} />
                                    {announcement.priority}
                                </span>
                            </div>

                            <p className="mb-6 line-clamp-4 flex-1 text-sm leading-6 text-gray-600">{announcement.content}</p>

                            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 text-xs text-gray-500">
                                <span className="font-medium text-gray-700">
                                    {getPriorityLabel(announcement.priority)}
                                </span>
                                <span>{formatDate(announcement.created_at)}</span>
                            </div>
                        </motion.article>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 20 }}
                            transition={{ duration: 0.24, ease: 'easeOut' }}
                            className="w-full max-w-xl rounded-2xl border border-orange-100 bg-white p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="mb-6 text-xl font-bold text-gray-900">Announcement Information</h2>

                            <div className="mb-4">
                                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Announcement Title</label>
                                <input
                                    type="text"
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
                                    placeholder="Enter title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Announcement Description</label>
                                <textarea
                                    className="h-32 w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
                                    placeholder="Write your announcement"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                />
                            </div>

                            <div className="mb-7">
                                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Priority</label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none rounded-xl border border-gray-200 px-3 py-2.5 pr-8 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as AnnouncementPriority })}
                                    >
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                    <ChevronDown
                                        size={16}
                                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col justify-end gap-2 sm:flex-row">
                                <button
                                    className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                    onClick={() => {
                                        setFormData({ title: '', content: '', priority: 'low' });
                                        setIsModalOpen(false);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff7a00] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#eb6f00] disabled:cursor-not-allowed disabled:opacity-60"
                                    onClick={handleCreate}
                                    disabled={submitting}
                                >
                                    {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                                    {submitting ? 'Publishing...' : 'Announce'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Announcements;
