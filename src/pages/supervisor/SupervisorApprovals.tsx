import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../../services/taskServices';
import type { Tasks } from '../../types/database.types';

const REVISION_CATEGORIES = [
    'Incomplete task details',
    'Incorrect intern assignment',
    'Deadline needs adjustment',
    'Not aligned with objectives',
    'Duplicate task',
    'Other',
] as const;

type TabKey = 'review' | 'approved' | 'needs_revision' | 'rejected';

const priorityColors: Record<string, string> = {
    low: '#01788d',
    medium: '#f3c743',
    high: '#ac2e25',
};

function getPriorityLabel(p: string) {
    return p.charAt(0).toUpperCase() + p.slice(1) + ' Priority';
}

function fmtDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

function fmtDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-US', {
        month: '2-digit', day: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
}

const SupervisorApprovals = () => {
    const [activeTab, setActiveTab] = useState<TabKey>('review');
    const [tasks, setTasks] = useState<Tasks[]>([]);
    const [loading, setLoading] = useState(true);
    const [revisionModalTask, setRevisionModalTask] = useState<Tasks | null>(null);
    const [revisionReason, setRevisionReason] = useState('');
    const [revisionCategory, setRevisionCategory] = useState<string>(REVISION_CATEGORIES[0]);
    const [revisionSubmitting, setRevisionSubmitting] = useState(false);
    const [rejectModalTask, setRejectModalTask] = useState<Tasks | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectSubmitting, setRejectSubmitting] = useState(false);
    const [detailTask, setDetailTask] = useState<Tasks | null>(null);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const data = await taskService.getSupervisorTasks();
            setTasks(data);
        } catch (err) {
            console.error(err);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const byTab = (): Tasks[] => {
        if (activeTab === 'review') return tasks.filter(t => t.status === 'pending_approval');
        if (activeTab === 'approved') return tasks.filter(t => ['not_started', 'in_progress', 'pending', 'completed', 'overdue'].includes(t.status));
        if (activeTab === 'needs_revision') return tasks.filter(t => t.status === 'needs_revision');
        return tasks.filter(t => t.status === 'rejected');
    };

    const counts = {
        review: tasks.filter(t => t.status === 'pending_approval').length,
        approved: tasks.filter(t => ['not_started', 'in_progress', 'pending', 'completed', 'overdue'].includes(t.status)).length,
        needs_revision: tasks.filter(t => t.status === 'needs_revision').length,
        rejected: tasks.filter(t => t.status === 'rejected').length,
    };

    const handleApprove = async (task: Tasks) => {
        setActionLoading(task.id);
        try {
            await taskService.approveTask(task.id);
            await fetchTasks();
        } catch (err) {
            console.error(err);
            alert('Failed to approve task.');
        } finally {
            setActionLoading(null);
        }
    };

    const openRejectModal = (task: Tasks) => {
        setRejectModalTask(task);
        setRejectReason('');
    };

    const handleReject = async () => {
        if (!rejectModalTask || !rejectReason.trim()) return;
        setRejectSubmitting(true);
        try {
            await taskService.supervisorRejectTask(rejectModalTask.id, rejectReason.trim());
            setRejectModalTask(null);
            setRejectReason('');
            await fetchTasks();
        } catch (err) {
            console.error(err);
            alert('Failed to reject task.');
        } finally {
            setRejectSubmitting(false);
        }
    };

    const openRevisionModal = (task: Tasks) => {
        setRevisionModalTask(task);
        setRevisionReason('');
        setRevisionCategory(REVISION_CATEGORIES[0]);
    };

    const handleRequestRevision = async () => {
        if (!revisionModalTask || !revisionReason.trim()) return;
        setRevisionSubmitting(true);
        try {
            await taskService.requestRevisionTask(revisionModalTask.id, revisionReason.trim(), revisionCategory);
            setRevisionModalTask(null);
            setRevisionReason('');
            await fetchTasks();
        } catch (err) {
            console.error(err);
            alert('Failed to request revision.');
        } finally {
            setRevisionSubmitting(false);
        }
    };

    const assignedNames = (t: Tasks) => t.assigned_interns?.map(i => i.full_name).join(', ') || `${t.assigned_interns_count} intern(s)`;

    const filteredTasks = byTab();

    return (
        <div style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
            <h1 style={{ color: '#ff8c42', fontSize: 'clamp(1.5rem, 2vw, 2rem)' }}>
                Supervisor Panel
            </h1>

            <div style={{ border: '1px solid #ccc', borderRadius: '1rem', padding: '1.5rem', backgroundColor: '#e8ddd0', marginTop: '1rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {([
                        { key: 'review' as const, label: 'To be Reviewed' },
                        { key: 'approved' as const, label: 'Approved' },
                        { key: 'needs_revision' as const, label: 'Needs Revision' },
                        { key: 'rejected' as const, label: 'Rejected' },
                    ]).map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                flex: '1 1 200px',
                                padding: '0.75rem',
                                borderRadius: '0.75rem',
                                border: activeTab === tab.key ? '2px solid black' : '1px solid #ccc',
                                backgroundColor: activeTab === tab.key ? '#ebab5d' : '#fff',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                            }}
                        >
                            {`${tab.label} (${counts[tab.key]})`}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <p>Loading tasks...</p>
                ) : filteredTasks.length === 0 ? (
                    <p>No tasks here</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {filteredTasks.map(task => (
                            <div
                                key={task.id}
                                style={{
                                    border: '1px solid #ccc',
                                    borderRadius: '1rem',
                                    padding: '1.5rem',
                                    backgroundColor: '#fff',
                                    position: 'relative',
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '1rem',
                                        right: '1rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-end',
                                        gap: '0.5rem',
                                        backgroundColor: 'rgba(255,255,255,0.85)',
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: '0.75rem',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: priorityColors[task.priority] ?? '#888' }} />
                                        {getPriorityLabel(task.priority)}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setDetailTask(task)}
                                        style={{
                                            padding: '0.35rem 0.9rem',
                                            borderRadius: '999px',
                                            border: '1px solid #ccc',
                                            backgroundColor: '#f5f5f5',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        View Details
                                    </button>
                                </div>

                                <h3 style={{ margin: 0 }}>{task.title}</h3>
                                <p style={{ margin: '0.5rem 0', color: '#555' }}>
                                    {task.description?.slice(0, 120)}{task.description && task.description.length > 120 ? '...' : ''}
                                </p>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Assigned to:</strong> {assignedNames(task)}</p>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', opacity: 0.7 }}>Due: {fmtDate(task.due_date)}</p>

                                <div
                                    style={{
                                        marginTop: '1rem',
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '0.5rem',
                                    }}
                                >
                                    {activeTab === 'review' && (
                                        <>
                                            <button
                                                onClick={() => openRevisionModal(task)}
                                                disabled={actionLoading !== null}
                                                style={{
                                                    flex: '1 1 140px',
                                                    backgroundColor: '#eba72a',
                                                    color: '#fff',
                                                    border: 'none',
                                                    padding: '0.6rem',
                                                    borderRadius: '1rem',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Request Revision
                                            </button>
                                            <button
                                                onClick={() => handleApprove(task)}
                                                disabled={actionLoading !== null}
                                                style={{
                                                    flex: '1 1 120px',
                                                    backgroundColor: '#098d40',
                                                    color: '#fff',
                                                    border: 'none',
                                                    padding: '0.6rem',
                                                    borderRadius: '1rem',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {actionLoading === task.id ? '...' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={() => openRejectModal(task)}
                                                disabled={actionLoading !== null}
                                                style={{
                                                    flex: '1 1 120px',
                                                    backgroundColor: '#d32f2f',
                                                    color: '#fff',
                                                    border: 'none',
                                                    padding: '0.6rem',
                                                    borderRadius: '1rem',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}

                                    {(activeTab === 'needs_revision' || activeTab === 'rejected') && task.rejection_reason && (
                                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#fff3e0', width: '100%' }}>
                                            <p style={{ margin: 0 }}><strong>Reason:</strong> {task.rejection_reason}</p>
                                            {task.revision_category && <p style={{ margin: '0.25rem 0 0' }}><strong>Category:</strong> {task.revision_category}</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* View Details Modal */}
            {detailTask && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', zIndex: 1000 }} onClick={() => setDetailTask(null)}>
                    <div style={{ background: '#fff', padding: '2rem', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowX: 'hidden', overflowY: 'auto', borderRadius: '0.75rem' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ color: '#ff8c42', margin: '0 0 1rem' }}>{detailTask.title}</h2>
                        <p style={{ margin: '0 0 1rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{detailTask.description || '—'}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <div><strong>Assigned to:</strong> {assignedNames(detailTask)}</div>
                            <div><strong>Due:</strong> {fmtDateTime(detailTask.due_date)}</div>
                            <div><strong>Priority:</strong> {getPriorityLabel(detailTask.priority)}</div>
                            <div><strong>Created by:</strong> {detailTask.creator?.full_name ?? '—'}</div>
                        </div>
                        {detailTask.tools && detailTask.tools.length > 0 && (
                            <div style={{ marginTop: '1rem' }}>
                                <strong>Tools &amp; technologies:</strong>
                                <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.2rem' }}>
                                    {detailTask.tools.map((t) => (
                                        <li key={t}>{t}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {detailTask.rejection_reason && (
                            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fff3e0', borderRadius: '0.5rem' }}>
                                <strong>Revision/Rejection reason:</strong> {detailTask.rejection_reason}
                            </div>
                        )}
                        <button type="button" onClick={() => setDetailTask(null)} style={{ marginTop: '1.5rem', padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: '#ff8c42', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Close</button>
                    </div>
                </div>
            )}

            {/* Request Revision Modal */}
            {revisionModalTask && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', zIndex: 1001 }}>
                    <div style={{ background: '#fff', padding: '2rem', width: '100%', maxWidth: '500px', borderRadius: '0.75rem' }}>
                        <h2 style={{ margin: '0 0 1rem' }}>Request Revision</h2>
                        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#555' }}>{revisionModalTask.title}</p>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Reason for revision *</label>
                        <textarea
                            placeholder="Enter the reason for revision"
                            value={revisionReason}
                            onChange={e => setRevisionReason(e.target.value)}
                            style={{ width: '100%', minHeight: '100px', padding: '0.5rem', marginBottom: '1rem', boxSizing: 'border-box' }}
                        />
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Category</label>
                        <select
                            value={revisionCategory}
                            onChange={e => setRevisionCategory(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', marginBottom: '1.5rem' }}
                        >
                            {REVISION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button type="button" onClick={() => { setRevisionModalTask(null); setRevisionReason(''); }}>Cancel</button>
                            <button type="button" onClick={handleRequestRevision} disabled={!revisionReason.trim() || revisionSubmitting} style={{ background: '#FB8C00', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
                                {revisionSubmitting ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModalTask && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', zIndex: 1001 }}>
                    <div style={{ background: '#fff', padding: '2rem', width: '100%', maxWidth: '500px', borderRadius: '0.75rem' }}>
                        <h2 style={{ margin: '0 0 1rem', color: '#d32f2f' }}>Reject Task</h2>
                        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem' }}>{rejectModalTask.title}</p>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Reason for rejection *</label>
                        <textarea
                            placeholder="Enter the reason for rejection"
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            style={{ width: '100%', minHeight: '100px', padding: '0.5rem', marginBottom: '1.5rem', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button type="button" onClick={() => { setRejectModalTask(null); setRejectReason(''); }}>Cancel</button>
                            <button type="button" onClick={handleReject} disabled={!rejectReason.trim() || rejectSubmitting} style={{ background: '#d32f2f', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
                                {rejectSubmitting ? 'Submitting...' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupervisorApprovals;
