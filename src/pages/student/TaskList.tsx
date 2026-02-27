import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { taskService } from '../../services/taskServices';
import type { Tasks, TaskStatus } from '../../types/database.types';

type TabKey = 'all' | 'not_started' | 'pending' | 'in_progress' | 'completed' | 'overdue';

// Intern can only update status if NOT completed/overdue — unless rejected (then they can re-update)
const canUpdateStatus = (status: TaskStatus) =>
    status !== 'completed' && status !== 'overdue';

const UPDATABLE_STATUSES: TaskStatus[] = ['not_started', 'pending', 'in_progress', 'completed'];

// Order for "All Tasks" tab: completed first, then in_progress, pending, not_started, rejected, overdue last
const ALL_TASKS_STATUS_ORDER: Record<TaskStatus, number> = {
    completed: 0, in_progress: 1, pending: 2, not_started: 3, rejected: 4, overdue: 5,
};

const STATUS_LABEL: Record<TaskStatus, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    pending:     'Pending',
    completed:   'Completed',
    rejected:    'Rejected',
    overdue:     'Overdue',
};

function getPriorityDot(priority: string): React.CSSProperties {
    const colors: Record<string, string> = { high: '#ff4d4d', medium: '#f5a623', low: '#4da6ff' };
    return { color: colors[priority] ?? '#888' };
}

function getPillStyle(status: TaskStatus): React.CSSProperties {
    if (status === 'in_progress') return { background: '#f5f0a6', color: '#333' };
    if (status === 'completed')   return { background: '#bcd8ff', color: '#333' };
    if (status === 'overdue')     return { background: '#ffc2c2', color: '#333' };
    if (status === 'pending')     return { background: '#ffe5b4', color: '#333' };
    if (status === 'rejected')    return { background: '#f8d7da', color: '#842029' };
    return { background: '#e5e7eb', color: '#333' };
}

function fmt(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

function fmtDateTime(date: string): string {
    return new Date(date).toLocaleString('en-US', {
        month: '2-digit', day: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
}

export default function TaskList() {
    const [tab, setTab] = useState<TabKey>('all');
    const [tasks, setTasks] = useState<Tasks[]>([]);
    const [loading, setLoading] = useState(true);

    // Status update modal
    const [statusModalTask, setStatusModalTask] = useState<Tasks | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<TaskStatus>('not_started');
    const [updating, setUpdating] = useState(false);

    // View details modal
    const [detailTask, setDetailTask] = useState<Tasks | null>(null);

    const fetchTasks = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        try {
            const data = await taskService.getMyTasks(signal);
            if (signal?.aborted) return;
            setTasks(data);
        } catch (err) {
            const e = err as { name?: string; code?: string };
            if (e?.name === 'CanceledError' || e?.name === 'AbortError' || e?.code === 'ERR_CANCELED') return;
            console.error('Failed to fetch tasks:', err);
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        fetchTasks(controller.signal);
        return () => controller.abort();
    }, [fetchTasks]);

    const openStatusModal = (task: Tasks) => {
        setStatusModalTask(task);
        setSelectedStatus(task.status === 'rejected' ? 'not_started' : task.status);
    };

    const closeStatusModal = () => {
        setStatusModalTask(null);
        setUpdating(false);
    };

    const handleStatusSave = async () => {
        if (!statusModalTask || selectedStatus === statusModalTask.status) { closeStatusModal(); return; }
        setUpdating(true);
        try {
            const updated = await taskService.updateStatus(statusModalTask.id, selectedStatus);
            setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
            closeStatusModal();
        } catch (err) {
            console.error('Failed to update status:', err);
        } finally {
            setUpdating(false);
        }
    };

    const grouped = useMemo(() => {
        const now = new Date();
        const allSorted = [...tasks].sort((a, b) => {
            const orderA = ALL_TASKS_STATUS_ORDER[a.status] ?? 6;
            const orderB = ALL_TASKS_STATUS_ORDER[b.status] ?? 6;
            return orderA - orderB;
        });
        return {
            all:         allSorted,
            not_started: tasks.filter(t => t.status === 'not_started'),
            pending:     tasks.filter(t => t.status === 'pending'),
            in_progress: tasks.filter(t => t.status === 'in_progress'),
            completed:   tasks.filter(t => t.status === 'completed'),
            overdue:     tasks.filter(t => t.status === 'overdue' || (t.status !== 'completed' && new Date(t.due_date) < now)),
        };
    }, [tasks]);

    const list = grouped[tab];

    return (
        <div style={styles.page}>
            <h1 style={styles.title}>Task List</h1>

            <div style={styles.panel}>
                <div style={styles.tabs}>
                    {(['all', 'not_started', 'pending', 'in_progress', 'completed', 'overdue'] as TabKey[]).map((key) => {
                        const labels: Record<TabKey, string> = {
                            all: 'All Tasks', not_started: 'Not Started', pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', overdue: 'Overdue',
                        };
                        return (
                            <button key={key}
                                style={{ ...styles.tab, ...(tab === key ? styles.activeTab : {}) }}
                                onClick={() => setTab(key)}
                            >
                                {labels[key]} ({grouped[key].length})
                            </button>
                        );
                    })}
                </div>

                <div style={styles.list}>
                    {loading && <div style={styles.empty}>Loading tasks…</div>}
                    {!loading && list.length === 0 && <div style={styles.empty}>No tasks available.</div>}

                    {!loading && list.map((task) => (
                        <div key={task.id} style={styles.card}>
                                <div style={styles.cardTop}>
                                    <h2 style={styles.cardTitle}>{task.title}</h2>
                                    <div style={{ ...styles.priority, ...getPriorityDot(task.priority) }}>
                                        ● {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                                    </div>
                                </div>

                                {/* Clamp description to 2 lines on card */}
                                <p style={styles.description}>{task.description}</p>

                                {task.status === 'rejected' && task.rejection_reason && (
                                    <div style={styles.rejectionBanner}>
                                        <span style={styles.rejectionLabel}>Rejection Reason: </span>
                                        {task.rejection_reason}
                                    </div>
                                )}

                                <div style={styles.cardBottom}>
                                    <div style={{ fontSize: '13px' }}>
                                        <span style={styles.muted}>Date Created:</span> {fmt(task.created_at)}
                                        {'  '}
                                        <span style={styles.muted}>Due:</span> {fmt(task.due_date)}
                                    </div>

                                    <div style={styles.actions}>
                                        <span style={{ ...styles.pill, ...getPillStyle(task.status) }}>
                                            {STATUS_LABEL[task.status]}
                                        </span>

                                        <button
                                            style={styles.detailButton}
                                            onClick={() => setDetailTask(task)}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* View Details Modal */}
            {detailTask && (
                <div style={styles.overlay} onClick={() => setDetailTask(null)}>
                    <div style={styles.detailModal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.detailHeader}>
                            <div>
                                <h2 style={styles.detailTitle}>{detailTask.title}</h2>
                                <span style={{ ...styles.pill, ...getPillStyle(detailTask.status), marginTop: '6px', display: 'inline-block' }}>
                                    {STATUS_LABEL[detailTask.status]}
                                </span>
                            </div>
                            <button onClick={() => setDetailTask(null)} style={styles.closeBtn}>✕</button>
                        </div>

                        <div style={styles.detailSection}>
                            <span style={styles.detailLabel}>Description</span>
                            <p style={{ ...styles.detailBody, whiteSpace: 'pre-wrap' }}>
                                {detailTask.description || 'No description provided.'}
                            </p>
                        </div>

                        {detailTask.status === 'rejected' && detailTask.rejection_reason && (
                            <div style={{ ...styles.rejectionBanner, marginBottom: '1rem' }}>
                                <span style={styles.rejectionLabel}>Rejection Reason: </span>
                                {detailTask.rejection_reason}
                            </div>
                        )}

                        <div style={styles.detailGrid}>
                            <div>
                                <span style={styles.detailLabel}>Priority</span>
                                <p style={{ ...styles.detailBody, ...getPriorityDot(detailTask.priority), fontWeight: 700 }}>
                                    ● {detailTask.priority.charAt(0).toUpperCase() + detailTask.priority.slice(1)}
                                </p>
                            </div>
                            <div>
                                <span style={styles.detailLabel}>Date Created</span>
                                <p style={styles.detailBody}>{fmt(detailTask.created_at)}</p>
                            </div>
                            <div>
                                <span style={styles.detailLabel}>Due Date</span>
                                <p style={styles.detailBody}>{fmtDateTime(detailTask.due_date)}</p>
                            </div>
                        </div>

                        <div style={styles.detailFooter}>
                            {canUpdateStatus(detailTask.status) && (
                                <button
                                    style={styles.updateButton}
                                    onClick={() => { setDetailTask(null); openStatusModal(detailTask); }}
                                >
                                    Update Status
                                </button>
                            )}
                            <button onClick={() => setDetailTask(null)} style={styles.cancelBtn}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {statusModalTask && (
                <div style={styles.overlay} onClick={closeStatusModal}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 style={styles.modalTitle}>Update Task Status</h2>
                        <p style={styles.modalTaskName}>{statusModalTask.title}</p>

                        <div style={styles.statusOptions}>
                            {UPDATABLE_STATUSES.map((status) => (
                                <label key={status} style={{ ...styles.statusOption, ...(selectedStatus === status ? styles.statusOptionActive : {}) }}>
                                    <input type="radio" name="status" value={status}
                                        checked={selectedStatus === status}
                                        onChange={() => setSelectedStatus(status)}
                                        style={{ display: 'none' }}
                                    />
                                    <span style={{ ...styles.statusDot, ...getPillStyle(status) }}>
                                        {STATUS_LABEL[status]}
                                    </span>
                                </label>
                            ))}
                        </div>

                        <div style={styles.modalActions}>
                            <button onClick={closeStatusModal} style={styles.cancelBtn}>Cancel</button>
                            <button onClick={handleStatusSave}
                                style={{ ...styles.saveBtn, opacity: updating ? 0.7 : 1 }}
                                disabled={updating}
                            >
                                {updating ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    page:      { padding: '20px' },
    title:     { color: '#ff7a00', fontSize: '26px', fontWeight: 800, marginBottom: '14px' },
    panel:     { background: '#efeae4', borderRadius: '16px', padding: '16px' },
    tabs:      { display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' },
    tab:       { border: 'none', background: 'transparent', padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 },
    activeTab: { background: '#ffcf96' },
    list:      { display: 'flex', flexDirection: 'column', gap: '12px' },
    card:      { background: '#fff', borderRadius: '14px', border: '2px solid #ff8a00', padding: '14px' },
    cardTop:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
    cardTitle: { margin: 0, fontSize: '16px', fontWeight: 900, flex: 1, wordBreak: 'break-word' },
    priority:  { fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' },
    description: {
        marginTop: '8px', marginBottom: '12px', color: '#555', lineHeight: 1.5, fontSize: '13px',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
    },
    cardBottom:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' },
    muted:       { opacity: 0.7, fontWeight: 700 },
    actions:     { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
    pill:        { padding: '5px 10px', borderRadius: '999px', fontWeight: 700, fontSize: '12px' },
    detailButton:  { padding: '6px 14px', borderRadius: '999px', border: '1px solid #ff8a00', background: '#fff', color: '#ff8a00', fontWeight: 700, cursor: 'pointer', fontSize: '12px' },
    updateButton:  { padding: '6px 14px', borderRadius: '999px', border: 'none', background: '#ff8a00', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '12px' },
    rejectionBanner: { background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: '8px', padding: '8px 12px', marginBottom: '10px', fontSize: '13px', color: '#7f1d1d' },
    rejectionLabel:  { fontWeight: 700, color: '#991b1b' },
    empty:       { padding: '20px', textAlign: 'center', opacity: 0.7 },

    // Modals shared
    overlay:   { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' },
    cancelBtn: { padding: '8px 20px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', fontWeight: 600, cursor: 'pointer' },
    saveBtn:   { padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#ff8a00', color: '#fff', fontWeight: 700, cursor: 'pointer' },

    // View Details modal
    detailModal:   { background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '660px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' },
    detailHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem' },
    detailTitle:   { margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#111', wordBreak: 'break-word' },
    detailSection: { marginBottom: '1.25rem' },
    detailLabel:   { fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' as const, color: '#9ca3af', display: 'block', marginBottom: '4px' },
    detailBody:    { margin: 0, color: '#374151', lineHeight: 1.6, fontSize: '0.9rem', wordBreak: 'break-word' },
    detailGrid:    { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '12px', marginBottom: '1.5rem' },
    detailFooter:  { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
    closeBtn:      { background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280', flexShrink: 0 },

    // Status update modal
    modal:         { background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' },
    modalTitle:    { margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800, color: '#ff7a00' },
    modalTaskName: { margin: '0 0 1.5rem', color: '#555', fontSize: '0.9rem' },
    statusOptions: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' },
    statusOption:  { display: 'flex', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', border: '2px solid transparent', cursor: 'pointer' },
    statusOptionActive: { border: '2px solid #ff8a00', background: '#fff8f0' },
    statusDot:     { padding: '4px 12px', borderRadius: '999px', fontWeight: 700, fontSize: '13px' },
    modalActions:  { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
};
