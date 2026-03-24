import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Plus, Loader2, X } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import { announcementService } from '../../services/announcementService';
import { useAuth } from '../../context/AuthContext';
import type { Announcement, AnnouncementPriority } from '../../types/database.types';
import DropdownSelect, { type DropdownSelectOption } from '../../components/DropdownSelect';
import MobileFilterDrawer from '../../components/MobileFilterDrawer';
import ModalPortal from '../../components/ModalPortal';

const Announcements = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [dateCreatedFilter, setDateCreatedFilter] = useState('all');
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'low' as AnnouncementPriority,
    });
    const [submitting, setSubmitting] = useState(false);

    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const dateCreatedOptions: DropdownSelectOption<typeof dateCreatedFilter>[] = [
        { value: 'all', label: 'All Date Created' },
        { value: 'newest', label: 'Newest to Oldest' },
        { value: 'oldest', label: 'Oldest to Newest' },
        { value: 'this-month', label: 'This Month' },
        { value: 'this-year', label: 'This Year' },
    ];
    const priorityFilterOptions: DropdownSelectOption<typeof priorityFilter>[] = [
        { value: 'all', label: 'All Priority' },
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
    ];
    const formPriorityOptions: DropdownSelectOption<AnnouncementPriority>[] = [
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
    ];

    const fetchAnnouncements = useCallback(async (signal?: AbortSignal) => {
        try {
            const data = await announcementService.getAnnouncements(signal);
            if (signal?.aborted) return;
            const sorted = (data || []).sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setAnnouncements(sorted);
        } catch (err) {
            const e = err as { name?: string; code?: string };
            if (e?.name === 'CanceledError' || e?.name === 'AbortError' || e?.code === 'ERR_CANCELED') return;
            console.error(err);
            setAnnouncements([]);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        fetchAnnouncements(controller.signal);
        return () => controller.abort();
    }, [fetchAnnouncements]);

    // Handle Create
    const handleCreate = async () => {
        if (!user) return;
        if (!formData.title || !formData.content) {
            alert("Title and content are required");
            return;
        }

        try {
            setSubmitting(true);
            await announcementService.createAnnouncement({
                title: formData.title,
                content: formData.content,
                priority: formData.priority,
                created_by: user.id,
                visibility: 'all', // default
            });
            setIsModalOpen(false);
            setFormData({ title: '', content: '', priority: 'low' });
            fetchAnnouncements();
        } catch (err) {
            console.error(err);
            alert("Failed to create announcement");
        } finally {
            setSubmitting(false);
        }
    };

    // Filter Logic
    const filteredAnnouncements = (() => {
        // Step 1: search + priority filter

        if (!announcements) return [];

        let result = announcements.filter(a => {
            const cleanSearch = searchTerm.trim().toLowerCase();

            const matchesPriority = priorityFilter === 'all' || a.priority === priorityFilter;
            if (!cleanSearch) return matchesPriority;

            const matchesSearch =
                a.title.toLowerCase().includes(cleanSearch) ||
                a.content.toLowerCase().includes(cleanSearch);
            return matchesSearch && matchesPriority;
        });

        // Step 2: date created filter / sort
        if (dateCreatedFilter === 'this-month') {
            const now = new Date();
            result = result.filter(a => {
                const d = new Date(a.created_at);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
        } else if (dateCreatedFilter === 'this-year') {
            const year = new Date().getFullYear();
            result = result.filter(a => new Date(a.created_at).getFullYear() === year);
        }

        if (dateCreatedFilter === 'newest') {
            result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else if (dateCreatedFilter === 'oldest') {
            result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        }

        return result;
    })();

    // Formatting
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    // Re-evaluating Colors based on Image 1 vs Image 2 contradiction:
    // Image 1: "Low Priority" -> Blue Dot.
    // Image 2 Key: High -> Blue.
    // If I use Blue for High, and the mock data says "Low Priority", it won't be Blue.
    // I will use: High=Blue, Medium=Yellow, Low=Red (Following Image 2 Key strictly).
    // But then Image 1 (Low=Blue) is impossible to replicate with data.
    // I'll stick to Standard (Red=High, Blue=Low) because it makes more sense and matches Image 1's "Low=Blue".

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'high': return '#ef4444'; // Red
            case 'medium': return '#eab308'; // Yellow
            case 'low': return '#3b82f6'; // Blue
            default: return '#9ca3af';
        }
    };

    const getPriorityLabel = (p: string) => {
        return p.charAt(0).toUpperCase() + p.slice(1) + " Priority";
    };

    if (!announcements) return <PageLoader message="Loading announcements..." />;

    return (
        <div className="admin-page-shell w-full space-y-6">
            {/* Header */}
            <div className="announcements-header mb-8">
                <h1 className="text-3xl font-bold text-orange-600 m-0">Announcements</h1>
                <button
                    className="btn btn-primary gap-2 bg-[#ff8c42] border-none shrink-0"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus size={18} />
                    Create Announcement
                </button>
            </div>

            {/* Filter Bar */}
            <div className="announcements-filter-bar mb-8 border border-slate-200 rounded-lg p-3 bg-[#F9F7F4] flex-col md:flex-row items-stretch md:items-center gap-4">
                <div className="announcements-filter-search admin-search-wrap w-full md:w-auto">
                    <Search size={20} className="admin-search-icon" />
                    <input
                        type="text"
                        className="input admin-search-input w-full"
                        placeholder="Search announcements"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="announcements-filter-label !hidden items-center gap-2 min-[851px]:!flex min-[851px]:mt-0">
                    <Filter size={20} />
                    <span className="font-semibold">Filters:</span>
                </div>

                <div className="!hidden w-full flex-col gap-4 min-[851px]:!flex min-[851px]:w-auto min-[851px]:flex-row">
                    <div className="announcements-filter-select w-full md:w-auto">
                        <DropdownSelect
                            value={dateCreatedFilter}
                            options={dateCreatedOptions}
                            onChange={setDateCreatedFilter}
                        />
                    </div>

                    <div className="announcements-filter-select w-full md:w-auto">
                        <DropdownSelect
                            value={priorityFilter}
                            options={priorityFilterOptions}
                            onChange={setPriorityFilter}
                        />
                    </div>
                </div>

                <MobileFilterDrawer
                    open={isFilterDrawerOpen}
                    onOpen={() => setIsFilterDrawerOpen(true)}
                    onClose={() => setIsFilterDrawerOpen(false)}
                    bodyClassName="space-y-4"
                >
                    <div className="flex flex-row items-center gap-2">
                        <Filter size={20} className="text-orange-600" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Adjust announcement filters</span>
                    </div>

                    <div className="announcements-filter-select w-full">
                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Date Created</label>
                        <DropdownSelect
                            value={dateCreatedFilter}
                            options={dateCreatedOptions}
                            onChange={(value) => {
                                setDateCreatedFilter(value);
                                setIsFilterDrawerOpen(false);
                            }}
                        />
                    </div>

                    <div className="announcements-filter-select w-full">
                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Priority</label>
                        <DropdownSelect
                            value={priorityFilter}
                            options={priorityFilterOptions}
                            onChange={(value) => {
                                setPriorityFilter(value);
                                setIsFilterDrawerOpen(false);
                            }}
                        />
                    </div>
                </MobileFilterDrawer>
            </div>

            {/* Content Grid / Empty State */}
            {filteredAnnouncements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center min-h-[320px]">
                    {/* Icon illustration */}
                    <div className="w-[88px] h-[88px] rounded-full bg-gradient-to-br from-[#ff8c42] to-[#ffa726] flex items-center justify-center mb-6 shadow-[0_8px_24px_rgba(255,140,66,0.25)]">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                    </div>

                    {/* Heading */}
                    <h2 className="text-[1.4rem] font-bold text-slate-900 m-0 mb-2">
                        {searchTerm || priorityFilter !== 'all' || dateCreatedFilter !== 'all'
                            ? 'No matching announcements'
                            : 'No announcements yet'}
                    </h2>

                    {/* Sub-text */}
                    <p className="text-[0.9375rem] text-slate-500 max-w-[380px] m-0 mb-7 leading-6">
                        {searchTerm || priorityFilter !== 'all' || dateCreatedFilter !== 'all'
                            ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                            : 'Get started by creating your first announcement for your team.'}
                    </p>

                    {/* CTA — only shown when there are truly no announcements (not a filter miss) */}
                    {!(searchTerm || priorityFilter !== 'all' || dateCreatedFilter !== 'all') && (
                        <button
                            className="btn btn-primary bg-[#ff8c42] border-none gap-2 px-6 py-2.5"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Create Announcement
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(400px,100%),1fr))] gap-6">
                    {filteredAnnouncements.map((announcement) => (
                        <div
                            key={announcement.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedAnnouncement(announcement)}
                            onKeyDown={(e) => e.key === 'Enter' && setSelectedAnnouncement(announcement)}
                            className="card p-6 flex flex-col h-full min-h-[200px] bg-[#F9F7F4] cursor-pointer"
                        >
                            <div className="mb-4">
                                <h3 className="m-0 text-[1.1rem] font-bold">
                                    {announcement.title}
                                </h3>
                            </div>
                            <div className="flex-1 mb-8 min-h-[4.5rem] overflow-hidden">
                                <p
                                    className="m-0 text-slate-800 leading-6 overflow-hidden text-ellipsis"
                                    style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical' as const,
                                    }}
                                >
                                    {announcement.content}
                                </p>
                            </div>
                            <div className="announcement-card-footer text-sm text-slate-500 mt-auto">
                                <div className="flex items-center gap-2">
                                    <span>Priority:</span>
                                    <div className="flex items-center gap-1">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getPriorityColor(announcement.priority) }} />
                                        <span className="font-semibold text-slate-900">
                                            {getPriorityLabel(announcement.priority)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>Date Created:</span>
                                    <span className="font-semibold text-slate-900">
                                        {formatDate(announcement.created_at)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selectedAnnouncement && (
                <ModalPortal>
                    <div
                        className="announcement-modal-overlay"
                        onClick={() => setSelectedAnnouncement(null)}
                    >
                        <div
                            className="announcement-modal-panel relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                        {/* Top-right close button */}
                        <button
                            type="button"
                            onClick={() => setSelectedAnnouncement(null)}
                            aria-label="Close announcement"
                            className="absolute top-4 right-4 w-8 h-8 rounded-full border-none bg-[#ff8c42] text-white flex items-center justify-center cursor-pointer shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
                        >
                            <X size={18} />
                        </button>
                        <h2 className="text-orange-600 m-0 mb-4 text-[1.35rem] font-bold">
                            {selectedAnnouncement.title}
                        </h2>
                        <p className="m-0 mb-6 text-slate-800 leading-6 whitespace-pre-wrap break-words max-w-full">
                            {selectedAnnouncement.content}
                        </p>
                        <div className="flex justify-between items-center flex-wrap gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                                <span>Priority:</span>
                                <div className="flex items-center gap-1">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getPriorityColor(selectedAnnouncement.priority) }} />
                                    <span className="font-semibold text-slate-900">{getPriorityLabel(selectedAnnouncement.priority)}</span>
                                </div>
                            </div>
                            <div>
                                <span>Date Created: </span>
                                <span className="font-semibold text-slate-900">{formatDate(selectedAnnouncement.created_at)}</span>
                            </div>
                        </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* Create Modal */}
            {isModalOpen && (
                <ModalPortal>
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <div
                            className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10 shadow-2xl w-full max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-gray-100 dark:border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                        <Plus size={16} className="text-[#FF8800]" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900 dark:text-white m-0 leading-tight">Create Announcement</h2>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 m-0">Post a new announcement</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Announcement Title</label>
                                    <input
                                        type="text"
                                        className="input w-full bg-white dark:bg-slate-800 text-sm"
                                        placeholder="Enter announcement title"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
                                    <textarea
                                        className="input w-full h-[110px] resize-none bg-white dark:bg-slate-800 text-sm"
                                        placeholder="Enter announcement content"
                                        value={formData.content}
                                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Priority</label>
                                    <DropdownSelect
                                        value={formData.priority}
                                        options={formPriorityOptions}
                                        onChange={(value) => setFormData({ ...formData, priority: value })}
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end gap-2 px-6 pb-6 pt-2 border-t border-gray-100 dark:border-white/10">
                                <button
                                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                                    onClick={() => setFormData({ title: '', content: '', priority: 'low' })}
                                >
                                    Clear
                                </button>
                                <button
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF8800] hover:bg-[#E67A00] text-white text-sm font-semibold transition-all disabled:opacity-50"
                                    onClick={handleCreate}
                                    disabled={submitting}
                                >
                                    {submitting && <Loader2 size={14} className="animate-spin" />}
                                    {submitting ? 'Posting…' : 'Announce'}
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};

export default Announcements;
