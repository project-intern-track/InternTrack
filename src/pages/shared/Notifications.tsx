import { useEffect, useRef, useState } from 'react';
import {
    Bell,
    Megaphone,
    AlertCircle,
    Info,
    CheckCircle,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { announcementService } from '../../services/announcementService';
import type { Announcement } from '../../types/database.types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function priorityMeta(priority: Announcement['priority']) {
    switch (priority) {
        case 'high':
            return { icon: <AlertCircle size={14} />, cls: 'notif-page-badge-high', label: 'High' };
        case 'medium':
            return { icon: <Info size={14} />, cls: 'notif-page-badge-medium', label: 'Medium' };
        default:
            return { icon: <CheckCircle size={14} />, cls: 'notif-page-badge-low', label: 'Low' };
    }
}

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return 'Just now';
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// ─── component ────────────────────────────────────────────────────────────────

const PRIORITY_FILTERS = ['all', 'high', 'medium', 'low'] as const;
type PriorityFilter = (typeof PRIORITY_FILTERS)[number];

const Notifications = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<PriorityFilter>('all');
    const [readIds, setReadIds] = useState<Set<string>>(() => {
        try {
            return new Set(JSON.parse(localStorage.getItem('read_notifications') ?? '[]'));
        } catch {
            return new Set();
        }
    });
    const [expanded, setExpanded] = useState<string | null>(null);

    const abortRef = useRef<AbortController | null>(null);

    const fetchAnnouncements = () => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        setLoading(true);
        setError(null);

        announcementService
            .getAnnouncements(abortRef.current.signal)
            .then((data) => {
                setAnnouncements(data);
                setLoading(false);
            })
            .catch((err) => {
                if (err?.code === 'ERR_CANCELED') return;
                setError('Failed to load notifications. Please try again.');
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchAnnouncements();
        return () => abortRef.current?.abort();
    }, []);

    const markRead = (id: string) => {
        setReadIds((prev) => {
            const next = new Set(prev);
            next.add(id);
            localStorage.setItem('read_notifications', JSON.stringify([...next]));
            return next;
        });
    };

    const markAllRead = () => {
        const all = new Set(announcements.map((a) => a.id));
        setReadIds(all);
        localStorage.setItem('read_notifications', JSON.stringify([...all]));
    };

    const filtered = announcements.filter(
        (a) => filter === 'all' || a.priority === filter
    );
    const unreadCount = announcements.filter((a) => !readIds.has(a.id)).length;

    return (
        <div className="notif-page">
            {/* ── Header ── */}
            <div className="notif-page-header">
                <div className="notif-page-title-row">
                    <div className="notif-page-title-left">
                        <div className="notif-page-icon">
                            <Megaphone size={22} />
                        </div>
                        <div>
                            <h1 className="notif-page-title">Notifications</h1>
                            <p className="notif-page-subtitle">
                                {loading
                                    ? 'Loading…'
                                    : `${announcements.length} announcement${announcements.length !== 1 ? 's' : ''}${unreadCount > 0 ? ` · ${unreadCount} unread` : ''}`}
                            </p>
                        </div>
                    </div>
                    <div className="notif-page-header-actions">
                        {unreadCount > 0 && (
                            <button className="notif-page-mark-all-btn" onClick={markAllRead}>
                                <CheckCircle size={15} />
                                Mark all read
                            </button>
                        )}
                        <button className="notif-page-refresh-btn" onClick={fetchAnnouncements} disabled={loading}>
                            <RefreshCw size={15} className={loading ? 'notif-page-spinning' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Priority filter tabs */}
                <div className="notif-page-filters">
                    {PRIORITY_FILTERS.map((p) => (
                        <button
                            key={p}
                            onClick={() => setFilter(p)}
                            className={`notif-page-filter-tab${filter === p ? ' active' : ''}`}
                        >
                            {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
                            {p !== 'all' && (
                                <span className="notif-page-filter-count">
                                    {announcements.filter((a) => a.priority === p).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Body ── */}
            <div className="notif-page-body">
                {/* Loading */}
                {loading && (
                    <div className="notif-page-state">
                        <Loader2 size={28} className="notif-page-spinning notif-page-spinner-icon" />
                        <p>Loading notifications…</p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="notif-page-state notif-page-state-error">
                        <AlertCircle size={28} />
                        <p>{error}</p>
                        <button className="notif-page-retry-btn" onClick={fetchAnnouncements}>
                            Try again
                        </button>
                    </div>
                )}

                {/* Empty */}
                {!loading && !error && filtered.length === 0 && (
                    <div className="notif-page-state">
                        <Bell size={36} className="notif-page-empty-icon" />
                        <p className="notif-page-empty-title">
                            {filter === 'all' ? 'No notifications yet' : `No ${filter} priority notifications`}
                        </p>
                        <p className="notif-page-empty-sub">
                            {filter === 'all'
                                ? 'Check back later for announcements.'
                                : 'Try switching to a different filter.'}
                        </p>
                    </div>
                )}

                {/* List */}
                {!loading && !error && filtered.length > 0 && (
                    <ul className="notif-page-list">
                        <AnimatePresence initial={false}>
                            {filtered.map((ann, i) => {
                                const meta = priorityMeta(ann.priority);
                                const isUnread = !readIds.has(ann.id);
                                const isExpanded = expanded === ann.id;

                                return (
                                    <motion.li
                                        key={ann.id}
                                        layout
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: i * 0.04 }}
                                        className={`notif-page-item${isUnread ? ' notif-page-item-unread' : ''}`}
                                        onClick={() => {
                                            markRead(ann.id);
                                            setExpanded(isExpanded ? null : ann.id);
                                        }}
                                    >
                                        {/* Unread accent bar */}
                                        {isUnread && <span className="notif-page-unread-bar" />}

                                        <div className="notif-page-item-inner">
                                            {/* Left dot */}
                                            <span
                                                className={`notif-page-priority-dot notif-page-dot-${ann.priority}`}
                                                aria-label={`${ann.priority} priority`}
                                            />

                                            <div className="notif-page-item-body">
                                                <div className="notif-page-item-top">
                                                    <span className="notif-page-item-title">{ann.title}</span>
                                                    <span className={`notif-page-priority-badge ${meta.cls}`}>
                                                        {meta.icon}
                                                        {meta.label}
                                                    </span>
                                                </div>

                                                <AnimatePresence initial={false}>
                                                    {isExpanded ? (
                                                        <motion.p
                                                            key="full"
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="notif-page-item-content notif-page-item-content-full"
                                                        >
                                                            {ann.content}
                                                        </motion.p>
                                                    ) : (
                                                        <motion.p
                                                            key="preview"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            transition={{ duration: 0.15 }}
                                                            className="notif-page-item-content"
                                                        >
                                                            {ann.content}
                                                        </motion.p>
                                                    )}
                                                </AnimatePresence>

                                                <div className="notif-page-item-footer">
                                                    <span className="notif-page-item-time">{timeAgo(ann.created_at)}</span>
                                                    <span className="notif-page-item-date">{formatDate(ann.created_at)}</span>
                                                    <span className="notif-page-expand-hint">
                                                        {isExpanded ? 'Collapse ↑' : 'Read more ↓'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.li>
                                );
                            })}
                        </AnimatePresence>
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Notifications;
