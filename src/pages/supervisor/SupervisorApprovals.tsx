import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { taskService } from '../../services/taskServices';
import type { Tasks } from '../../types/database.types';

type ActiveTab = 'review' | 'approved' | 'Needs Revision' | 'Rejected';

const REVISION_CATEGORIES = [
  'Incomplete task details',
  'Incorrect intern assignment',
  'Deadline needs adjustment',
  'Not aligned with objectives',
  'Duplicate task',
  'Other',
] as const;

const statusBadgeStyles: Record<string, string> = {
  pending_approval: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  needs_revision: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  overdue: 'bg-red-200 text-red-800 dark:bg-red-600/15 dark:text-red-400',
  not_started: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  pending: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-300',
};

const priorityDotStyles: Record<string, string> = {
  low: 'bg-cyan-500',
  medium: 'bg-amber-500',
  high: 'bg-red-500',
};

const SupervisorApprovals = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('review');
  const [tasks, setTasks] = useState<Tasks[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Tasks | null>(null);
  
  const [revisionReason, setRevisionReason] = useState('');
  const [revisionCategory, setRevisionCategory] = useState<string>(REVISION_CATEGORIES[0]);
  const [revisionSubmitting, setRevisionSubmitting] = useState(false);
  
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

  const reviewCount = tasks.filter(t => t.status === 'pending_approval').length;
  const approvedCount = tasks.filter(t => ['not_started', 'in_progress', 'pending', 'completed', 'overdue'].includes(t.status)).length;
  const needsRevisionCount = tasks.filter(t => t.status === 'needs_revision').length;
  const rejectedCount = tasks.filter(t => t.status === 'rejected').length;

  const tabs: Array<{ key: ActiveTab; label: string; count: number }> = [
    { key: 'review', label: 'To be Reviewed', count: reviewCount },
    { key: 'approved', label: 'Approved', count: approvedCount },
    { key: 'Needs Revision', label: 'Needs Revision', count: needsRevisionCount },
    { key: 'Rejected', label: 'Rejected', count: rejectedCount },
  ];

  const filteredTasks =
    activeTab === 'review'
      ? tasks.filter(t => t.status === 'pending_approval')
      : activeTab === 'approved'
      ? tasks.filter(t => ['not_started', 'in_progress', 'pending', 'completed', 'overdue'].includes(t.status))
      : activeTab === 'Needs Revision'
      ? tasks.filter(t => t.status === 'needs_revision')
      : tasks.filter(t => t.status === 'rejected');

  const openRevisionModal = (task: Tasks) => {
    setSelectedTask(task);
    setRevisionReason('');
    setRevisionCategory(REVISION_CATEGORIES[0]);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedTask(null);
    setShowModal(false);
  };

  const approveTask = async (taskId: number) => {
    setActionLoading(taskId);
    try {
      await taskService.approveTask(taskId);
      await fetchTasks();
    } catch (err) {
      console.error(err);
      alert('Failed to approve task.');
    } finally {
      setActionLoading(null);
    }
  };

  const rejectTask = async (taskId: number) => {
    setActionLoading(taskId);
    // In real app we might want to ask for reason, simple prompt for now
    const reason = window.prompt("Enter reason for rejection:");
    if (!reason || !reason.trim()) {
      setActionLoading(null);
      return;
    }
    
    try {
      await taskService.supervisorRejectTask(taskId, reason.trim());
      await fetchTasks();
    } catch (err) {
      console.error(err);
      alert('Failed to reject task.');
    } finally {
      setActionLoading(null);
    }
  };

  const submitRevision = async () => {
    if (!selectedTask || !revisionReason.trim()) return;
    setRevisionSubmitting(true);
    try {
      await taskService.requestRevisionTask(selectedTask.id, revisionReason.trim(), revisionCategory);
      setRevisionReason('');
      await fetchTasks();
      closeModal();
    } catch (err) {
      console.error(err);
      alert('Failed to request revision.');
    } finally {
      setRevisionSubmitting(false);
    }
  };

  const formatDate = (value: string | undefined) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  const assignedNames = (t: Tasks) => t.assigned_interns?.map(i => i.full_name).join(', ') || `${t.assigned_interns_count} intern(s)`;
  
  const getPriorityLabel = (p: string) => p.charAt(0).toUpperCase() + p.slice(1) + ' Priority';

  return (
    <div className="space-y-6 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Supervisor Approvals</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Review task submissions, approve completions, or request revisions.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50"
      >
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.key;

            return (
              <motion.button
                key={tab.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.05 * index }}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-xl border px-4 py-3 text-left transition-all ${
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:bg-slate-900/40 dark:text-gray-300 dark:hover:bg-slate-900/70'
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-widest">{tab.label}</p>
                <p className="mt-1 text-2xl font-black">{tab.count}</p>
              </motion.button>
            );
          })}
        </div>

        <div className="space-y-4">
          {loading ? (
             <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                Loading tasks...
             </div>
          ) : filteredTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
              No tasks in this section.
            </div>
          ) : (
            filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.04 * index }}
                className="rounded-[1.5rem] border border-gray-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-slate-900/50"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">{task.title}</h3>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{task.description}</p>
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Assigned to:</span> {assignedNames(task)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Due:</span> {formatDate(task.due_date)}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold dark:border-white/10 dark:bg-white/5">
                    <span className={`h-2.5 w-2.5 rounded-full ${priorityDotStyles[task.priority] || 'bg-gray-500'}`} />
                    <span className="text-gray-700 dark:text-gray-300">{getPriorityLabel(task.priority)}</span>
                  </div>
                </div>

                {activeTab === 'review' ? (
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button
                      onClick={() => openRevisionModal(task)}
                      disabled={actionLoading !== null}
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-amber-600 disabled:opacity-50"
                    >
                      Request Revision
                    </button>
                    <button
                      onClick={() => approveTask(task.id)}
                      disabled={actionLoading !== null}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === task.id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => rejectTask(task.id)}
                      disabled={actionLoading !== null}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusBadgeStyles[task.status] || 'bg-gray-100 text-gray-800'}`}>
                      {task.status.replace('_', ' ').toUpperCase()}
                    </span>

                    {task.rejection_reason && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-400/20 dark:bg-amber-500/10">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          <span className="font-bold">Reason:</span> {task.rejection_reason}
                        </p>
                        {task.revision_category && (
                          <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                            <span className="font-bold">Category:</span> {task.revision_category}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* ================= MODAL POP-UP ================= */}
      {showModal && selectedTask && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-900"
          >
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="mb-5 flex items-center gap-2">
              <AlertCircle className="text-amber-500" size={18} />
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Request Revision</h2>
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

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Revision Category
                </label>
                <select
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  onChange={e => setRevisionCategory(e.target.value)}
                  value={revisionCategory}
                >
                  {REVISION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-white/15 dark:bg-transparent dark:text-gray-200 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={submitRevision}
                disabled={!revisionReason.trim() || revisionSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all hover:brightness-95 disabled:opacity-50"
              >
                <CheckCircle size={16} />
                {revisionSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SupervisorApprovals;
