import { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Plus,
    ChevronDown,
    Loader2
} from 'lucide-react';
import { announcementService } from '../../services/announcementService';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../hooks/useRealtime';
import type { Announcement, AnnouncementPriority } from '../../types/database.types';

const Announcements = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[] | null>(null); // initializes null
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [dateCreatedFilter, setDateCreatedFilter] = useState('all');

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'low' as AnnouncementPriority,
    });
    const [submitting, setSubmitting] = useState(false);

    // Fetch Announcements
    const fetchAnnouncements = async () => {
        try {
            const data = await announcementService.getAnnouncements();
            // Sort by created_at desc
            const sorted = (data || []).sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setAnnouncements(sorted);
        } catch (err) {
            console.error(err);
            setAnnouncements([])
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    // Re-fetch whenever announcements table changes in real-time
    useRealtime('announcements', fetchAnnouncements);

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

    if (!announcements) return null;

    return (
        <div className="container" style={{ maxWidth: '100%', padding: '0' }}>
            {/* Header */}
            <div className="row row-between" style={{ marginBottom: '2rem' }}>
                <h1 style={{ color: 'hsl(var(--orange))', fontSize: '2rem', margin: 0 }}>Announcements</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setIsModalOpen(true)}
                    style={{ gap: '0.5rem', backgroundColor: '#ff8c42', border: 'none' }}
                >
                    <Plus size={18} />
                    Create Announcement
                </button>
            </div>

            {/* Filter Bar */}
            <div className="row" style={{
                marginBottom: '2rem',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '0.75rem',
                backgroundColor: '#F9F7F4',
                gap: '1rem',
                alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                <div className="input-group" style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                        type="text"
                        className="input"
                        placeholder="Search by name or email"
                        style={{ paddingLeft: '3rem', width: '100%' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="row" style={{ alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={20} />
                    <span style={{ fontWeight: 600 }}>Filters:</span>
                </div>

                <div style={{ position: 'relative', minWidth: '180px' }}>
                    <select
                        className="select"
                        style={{ width: '100%' }}
                        value={dateCreatedFilter}
                        onChange={(e) => setDateCreatedFilter(e.target.value)}
                    >
                        <option value="all">All Date Created</option>
                        <option value="newest">Newest to Oldest</option>
                        <option value="oldest">Oldest to Newest</option>
                        <option value="this-month">This Month</option>
                        <option value="this-year">This Year</option>
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>

                <div style={{ position: 'relative', minWidth: '150px' }}>
                    <select
                        className="select"
                        style={{ width: '100%' }}
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                        <option value="all">All Priority</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
            </div>

            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {filteredAnnouncements.map((announcement) => (
                    <div key={announcement.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#F9F7F4' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                                {announcement.title}
                            </h3>
                        </div>
                        <div style={{ flex: 1, marginBottom: '2rem' }}>
                            <p style={{ margin: 0, color: '#1f2937', lineHeight: '1.5' }}>
                                {announcement.content}
                            </p>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            marginTop: 'auto'
                        }}>
                            <div className="row" style={{ gap: '0.5rem', alignItems: 'center' }}>
                                <span>Priority:</span>
                                <div className="row" style={{ alignItems: 'center', gap: '0.25rem' }}>
                                    <div style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        backgroundColor: getPriorityColor(announcement.priority)
                                    }} />
                                    <span style={{ fontWeight: 600, color: '#111827' }}>
                                        {getPriorityLabel(announcement.priority)}
                                    </span>
                                </div>
                            </div>
                            <div className="row" style={{ gap: '0.5rem' }}>
                                <span>Date Created:</span>
                                <span style={{ fontWeight: 600, color: '#111827' }}>
                                    {formatDate(announcement.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
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
                }}>
                    <div style={{
                        backgroundColor: '#e6ded6', // Beige background from image
                        borderRadius: '12px',
                        padding: '2rem',
                        width: '100%',
                        maxWidth: '500px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ color: '#ea580c', margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Announcement Information</h2>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Announcement Title:</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Enter task title" // Placeholder per image
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                style={{ width: '100%', backgroundColor: 'white' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Announcement Description:</label>
                            <textarea
                                className="input"
                                placeholder="Brief description of the task" // Placeholder per image
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                style={{ width: '100%', height: '120px', resize: 'none', backgroundColor: 'white', fontFamily: 'inherit' }}
                            />
                        </div>

                        <div style={{ marginBottom: '3rem' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Priority:</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    className="select"
                                    style={{ width: '100%', backgroundColor: 'white' }}
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as AnnouncementPriority })}
                                >
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                                <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            </div>
                        </div>

                        <div className="row" style={{ justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                className="btn"
                                onClick={() => {
                                    setFormData({ title: '', content: '', priority: 'low' });
                                    setIsModalOpen(false); // Or separate 'Cancel' behavior
                                }}
                                style={{ backgroundColor: 'white', color: '#ea580c', border: 'none', padding: '0.75rem 1.5rem' }}
                            >
                                Clear
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleCreate}
                                disabled={submitting}
                                style={{ backgroundColor: '#ff8c42', border: 'none', padding: '0.75rem 1.5rem' }}
                            >
                                {submitting ? <Loader2 className="spinner" size={18} /> : 'Announce'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Announcements;