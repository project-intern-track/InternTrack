import { useEffect, useRef, useState } from 'react';
import { Bell, X, Megaphone, AlertCircle, Info, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { announcementService } from '../../services/announcementService';
import type { Announcement } from '../../types/database.types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function priorityMeta(priority: Announcement['priority']) {
    switch (priority) {
        case 'high':
            return {
                icon: <AlertCircle size={14} />,
                cls: 'notification-badge-high',
                label: 'High',
            };
        case 'medium':
            return {
                icon: <Info size={14} />,
                cls: 'notification-badge-medium',
                label: 'Medium',
            };
        default:
            return {
                icon: <CheckCircle size={14} />,
                cls: 'notification-badge-low',
                label: 'Low',
            };
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

// ─── component ────────────────────────────────────────────────────────────────

const NotificationDropdown = () => {
    const [open, setOpen] = useState(false);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [readIds, setReadIds] = useState<Set<string>>(() => {
        try {
            return new Set(JSON.parse(localStorage.getItem('read_notifications') ?? '[]'));
        } catch {
            return new Set();
        }
    });

    const dropdownRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    // fetch on open
    useEffect(() => {
        if (!open) return;

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
                setError('Failed to load notifications.');
                setLoading(false);
            });

        return () => abortRef.current?.abort();
    }, [open]);

    // close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const unreadCount = announcements.filter((a) => !readIds.has(a.id)).length;

    const markAllRead = () => {
        const all = new Set(announcements.map((a) => a.id));
        setReadIds(all);
        localStorage.setItem('read_notifications', JSON.stringify([...all]));
    };

    const markRead = (id: string) => {
        setReadIds((prev) => {
            const next = new Set(prev);
            next.add(id);
            localStorage.setItem('read_notifications', JSON.stringify([...next]));
            return next;
        });
    };

    return (
        <div className="notification-wrapper" ref={dropdownRef}>
            {/* ── Bell Button ── */}
            <motion.button
                id="notification-bell-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen((v) => !v)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative"
                aria-label="Notifications"
                aria-expanded={open}
                aria-haspopup="true"
            >
                <Bell size={20} className="text-gray-600 dark:text-gray-400" />

                {/* Unread badge */}
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            key="badge"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="notification-count-badge"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                    )}
                    {unreadCount === 0 && (
                        <motion.span
                            key="dot"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full"
                        />
                    )}
                </AnimatePresence>
            </motion.button>

            {/* ── Dropdown Panel ── */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        id="notification-panel"
                        role="dialog"
                        aria-label="Notifications panel"
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="notification-panel"
                    >
                        {/* Header */}
                        <div className="notification-header">
                            <div className="notification-header-left">
                                <Megaphone size={16} className="notification-header-icon" />
                                <span className="notification-header-title">Notifications</span>
                                {unreadCount > 0 && (
                                    <span className="notification-unread-chip">{unreadCount} new</span>
                                )}
                            </div>
                            <div className="notification-header-actions">
                                {unreadCount > 0 && (
                                    <button
                                        className="notification-mark-all"
                                        onClick={markAllRead}
                                        title="Mark all as read"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    className="notification-close-btn"
                                    onClick={() => setOpen(false)}
                                    aria-label="Close notifications"
                                >
                                    <X size={15} />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="notification-body">
                            {loading && (
                                <div className="notification-state">
                                    <Loader2 size={22} className="notification-spinner" />
                                    <p>Loading notifications…</p>
                                </div>
                            )}

                            {!loading && error && (
                                <div className="notification-state notification-state-error">
                                    <AlertCircle size={20} />
                                    <p>{error}</p>
                                </div>
                            )}

                            {!loading && !error && announcements.length === 0 && (
                                <div className="notification-state">
                                    <Bell size={28} className="notification-empty-icon" />
                                    <p className="notification-empty-title">All caught up!</p>
                                    <p className="notification-empty-sub">No announcements yet.</p>
                                </div>
                            )}

                            {!loading && !error && announcements.length > 0 && (
                                <ul className="notification-list">
                                    {announcements.map((ann) => {
                                        const meta = priorityMeta(ann.priority);
                                        const isUnread = !readIds.has(ann.id);
                                        return (
                                            <motion.li
                                                key={ann.id}
                                                layout
                                                initial={{ opacity: 0, x: 6 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.15 }}
                                                className={`notification-item${isUnread ? ' notification-item-unread' : ''}`}
                                                onClick={() => markRead(ann.id)}
                                            >
                                                <div className="notification-item-inner">
                                                    {isUnread && (
                                                        <span className="notification-unread-dot" aria-label="Unread" />
                                                    )}
                                                    <div className="notification-item-body">
                                                        <div className="notification-item-top">
                                                            <span className="notification-item-title">{ann.title}</span>
                                                            <span className={`notification-priority-badge ${meta.cls}`}>
                                                                {meta.icon}
                                                                {meta.label}
                                                            </span>
                                                        </div>
                                                        <p className="notification-item-content">{ann.content}</p>
                                                        <span className="notification-item-time">{timeAgo(ann.created_at)}</span>
                                                    </div>
                                                </div>
                                            </motion.li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationDropdown;
