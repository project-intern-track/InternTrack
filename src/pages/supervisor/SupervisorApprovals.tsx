import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { taskService } from '../../services/taskServices';
import type { Tasks } from '../../types/database.types';
import DropdownSelect from '../../components/DropdownSelect';
import ModalPortal from '../../components/ModalPortal';

type InternProgress = {
  id: number;
  full_name: string;
  avatar_url: string | null;
  intern_status: string;
};

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

const ITEMS_PER_PAGE = 10;

const SupervisorApprovals = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('review');
  const [currentPage, setCurrentPage] = useState(1);
  const [tasks, setTasks] = useState<Tasks[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Tasks | null>(null);
  
  const [revisionReason, setRevisionReason] = useState('');
  const [revisionCategory, setRevisionCategory] = useState<string>(REVISION_CATEGORIES[0]);
  const [revisionSubmitting, setRevisionSubmitting] = useState(false);
  
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTask, setRejectTaskState] = useState<Tasks | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({ message: '', type: 'error', visible: false });
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Progress modal state
  const [progressTask, setProgressTask] = useState<Tasks | null>(null);
  const [progressData, setProgressData] = useState<InternProgress[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

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

  const STATUS_SORT_ORDER: Record<string, number> = {
    in_progress: 0,
    not_started: 1,
    pending: 2,
    overdue: 3,
    completed: 4,
  };

  const filteredTasks = (() => {
    const list =
      activeTab === 'review'
        ? tasks.filter(t => t.status === 'pending_approval')
        : activeTab === 'approved'
        ? tasks.filter(t => ['not_started', 'in_progress', 'pending', 'completed', 'overdue'].includes(t.status))
        : activeTab === 'Needs Revision'
        ? tasks.filter(t => t.status === 'needs_revision')
        : tasks.filter(t => t.status === 'rejected');

    if (activeTab === 'approved') {
      return [...list].sort(
        (a, b) => (STATUS_SORT_ORDER[a.status] ?? 99) - (STATUS_SORT_ORDER[b.status] ?? 99)
      );
    }
    return list;
  })();

  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginationItems = Array.from({ length: totalPages }, (_, index) => index + 1);

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

  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type, visible: true });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 4000);
  };

  const approveTask = async (taskId: number) => {
    setActionLoading(taskId);
    try {
      await taskService.approveTask(taskId);
      await fetchTasks();
      showToast('Task approved successfully.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to approve task.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (task: Tasks) => {
    setRejectTaskState(task);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setRejectTaskState(null);
    setShowRejectModal(false);
  };

  const submitRejection = async () => {
    if (!rejectTask || !rejectReason.trim()) return;
    setRejectSubmitting(true);
    try {
      await taskService.supervisorRejectTask(rejectTask.id, rejectReason.trim());
      await fetchTasks();
      closeRejectModal();
      showToast('Task rejected successfully.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to reject task.', 'error');
    } finally {
      setRejectSubmitting(false);
    }
  };

  const openProgressModal = async (task: Tasks) => {
    setProgressTask(task);
    setProgressData([]);
    setProgressLoading(true);
    try {
      const data = await taskService.getTaskProgress(task.id);
      setProgressData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setProgressLoading(false);
    }
  };

  const closeProgressModal = () => {
    setProgressTask(null);
    setProgressData([]);
  };

  const handleFinalize = async () => {
    if (!progressTask || finalizing) return;
    setFinalizing(true);
    try {
      await taskService.finalizeTask(progressTask.id);
      await fetchTasks();
      closeProgressModal();
    } catch (err) {
      console.error(err);
      showToast('Failed to finalize task.', 'error');
    } finally {
      setFinalizing(false);
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
      showToast('Failed to request revision.', 'error');
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
    <div className="space-y-0">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6"
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
        {/* Desktop tabs */}
        <div className="mb-6 max-[800px]:hidden">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.key;
              return (
                <motion.button
                  key={tab.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 * index }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#FF8800] text-white shadow-[0_0_12px_rgba(255,136,0,0.3)]'
                      : 'bg-gray-100 text-gray-600 hover:bg-orange-50 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-300'
                  }`}>
                    {tab.count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Mobile: Static 2×2 metrics + tab bar */}
        <div className="mb-4 hidden max-[800px]:grid grid-cols-2 gap-2.5">
          {tabs.map((tab) => (
            <div key={tab.key} className="rounded-xl border border-gray-200 bg-gray-50/80 px-3.5 py-2.5 dark:border-white/10 dark:bg-white/5">
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{tab.label}</p>
              <p className="mt-0.5 text-lg font-black text-gray-900 dark:text-white">{tab.count}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 hidden max-[800px]:flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-center text-[0.7rem] font-bold transition-all ${
                  isActive
                    ? 'bg-[#FF8800] text-white shadow-[0_0_12px_rgba(255,136,0,0.3)]'
                    : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-gray-700 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[0.65rem] ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-300'
                }`}>
                  {tab.count}
                </span>
              </button>
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
            <>
            {paginatedTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.04 * index }}
                className="rounded-[1.5rem] border border-gray-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-slate-900/50"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                    <h3 className="break-words text-lg font-black leading-snug text-gray-900 dark:text-white">{task.title}</h3>
                    <div className="mt-1 pb-4">
                      <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">{task.description}</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Assigned to:</span> {assignedNames(task)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Due:</span> {formatDate(task.due_date)}
                    </p>
                    </div>

                    <div className="inline-flex w-fit shrink-0 items-center gap-2 self-start rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold dark:border-white/10 dark:bg-white/5">
                      <span className={`h-2.5 w-2.5 rounded-full ${priorityDotStyles[task.priority] || 'bg-gray-500'}`} />
                      <span className="text-gray-700 dark:text-gray-300">{getPriorityLabel(task.priority)}</span>
                    </div>
                  </div>
                </div>

                {activeTab === 'review' ? (
                  <div className="mt-4 flex flex-wrap justify-end gap-2 max-[800px]:flex-nowrap">
                    <button
                      onClick={() => openRevisionModal(task)}
                      disabled={actionLoading !== null}
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-amber-600 disabled:opacity-50 max-[800px]:flex-1 max-[800px]:px-0 max-[800px]:text-xs"
                    >
                      Request Revision
                    </button>
                    <button
                      onClick={() => approveTask(task.id)}
                      disabled={actionLoading !== null}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-green-700 disabled:opacity-50 max-[800px]:flex-1 max-[800px]:px-0 max-[800px]:text-xs"
                    >
                      {actionLoading === task.id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => openRejectModal(task)}
                      disabled={actionLoading !== null}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50 max-[800px]:flex-1 max-[800px]:px-0 max-[800px]:text-xs"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusBadgeStyles[task.status] || 'bg-gray-100 text-gray-800'}`}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {['in_progress', 'not_started'].includes(task.status) && (
                        <button
                          onClick={() => openProgressModal(task)}
                          className="rounded-lg bg-primary px-3 py-1 text-xs font-bold text-primary-foreground transition-all hover:brightness-95"
                        >
                          View Details
                        </button>
                      )}
                    </div>

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
            ))}
            {totalPages > 1 && (
              <div className="pagination-controls">
                <div className="pagination-summary">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredTasks.length)} of {filteredTasks.length} tasks
                </div>
                <div className="pagination-buttons">
                  <button
                    className="pagination-btn pagination-arrow"
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </button>
                  {paginationItems.map((page) => {
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <button
                          key={page}
                          className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      );
                    }

                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="pagination-ellipsis">...</span>;
                    }

                    return null;
                  })}
                  <button
                    className="pagination-btn pagination-arrow"
                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            </>
          )}
        </div>
      </motion.div>

      {/* ================= PROGRESS MODAL ================= */}
      {progressTask && (
        <ModalPortal>
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-900"
          >
            <button
              onClick={closeProgressModal}
              className="absolute right-4 top-4 rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X size={18} />
            </button>

            <h2 className="mb-1 text-xl font-black text-gray-900 dark:text-white">{progressTask.title}</h2>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Assigned Interns Progress</p>

            {progressLoading ? (
              <p className="py-4 text-center text-sm text-gray-500">Loading...</p>
            ) : (
              <>
                <div className="space-y-2">
                  {progressData.map(intern => (
                    <div key={intern.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 dark:border-white/10">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{intern.full_name}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadgeStyles[intern.intern_status] || 'bg-gray-100 text-gray-700'}`}>
                        {intern.intern_status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>

                {progressData.length > 0 && (
                  <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {progressData.filter(i => i.intern_status === 'completed').length} completed
                    </span>
                    {' · '}
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {progressData.filter(i => i.intern_status !== 'completed').length} will be auto-graded 1/5
                    </span>
                  </div>
                )}

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={closeProgressModal}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-white/15 dark:bg-transparent dark:text-gray-200 dark:hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFinalize}
                    disabled={finalizing}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all hover:brightness-95 disabled:opacity-50"
                  >
                    {finalizing ? 'Finalizing...' : 'Finalize Task'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
        </ModalPortal>
      )}

      {/* ================= REVISION MODAL ================= */}
      {showModal && selectedTask && (
        <ModalPortal>
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="relative max-h-[92vh] w-full max-w-2xl overflow-visible rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-white/10 dark:bg-slate-900"
          >
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="mb-6 flex items-center gap-2">
              <AlertCircle className="text-amber-500" size={18} />
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Request Revision</h2>
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Revision Reason
              </label>
              <textarea
                className="min-h-[170px] max-h-56 w-full resize-none overflow-y-auto rounded-xl border border-gray-300 bg-white p-4 text-sm text-gray-800 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                placeholder="Explain what needs to be revised..."
                value={revisionReason}
                onChange={e => setRevisionReason(e.target.value)}
              />
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Revision Category
              </label>
              <DropdownSelect
                value={revisionCategory}
                onChange={setRevisionCategory}
                options={REVISION_CATEGORIES.map((category) => ({ value: category, label: category }))}
                className="z-[140]"
                optionsContainerClassName="max-h-64"
                buttonClassName="rounded-xl"
              />
            </div>

            <div className="mt-8 flex justify-end gap-2">
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
        </ModalPortal>
      )}
      {/* ================= REJECT MODAL ================= */}
      {showRejectModal && rejectTask && (
        <ModalPortal>
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-900"
          >
            <button
              onClick={closeRejectModal}
              className="absolute right-4 top-4 rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="mb-5 flex items-center gap-2">
              <AlertCircle className="text-red-500" size={18} />
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Reject Task</h2>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Reason for Rejection
              </label>
              <textarea
                className="min-h-[100px] max-h-40 w-full resize-none overflow-y-auto rounded-xl border border-gray-300 bg-white p-4 text-sm text-gray-800 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                placeholder="Explain why this task is being rejected..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeRejectModal}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-white/15 dark:bg-transparent dark:text-gray-200 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={submitRejection}
                disabled={!rejectReason.trim() || rejectSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50"
              >
                <AlertCircle size={16} />
                {rejectSubmitting ? 'Rejecting...' : 'Reject Task'}
              </button>
            </div>
          </motion.div>
        </div>
        </ModalPortal>
      )}

      {/* ================= TOAST ================= */}
      {toast.visible && (
        <div style={{ ...toastStyles.container, ...(toast.type === 'error' ? toastStyles.error : toastStyles.success) }}>
          <span>{toast.type === 'error' ? '\u26A0' : '\u2713'}</span>
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            style={toastStyles.closeBtn}
            onClick={() => setToast(prev => ({ ...prev, visible: false }))}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
};

/* Toast notification styles (matches ManageTasks pattern) */
const toastStyles = {
  container: {
    position: 'fixed' as const,
    top: '24px',
    right: '24px',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 20px',
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    fontSize: '0.95rem',
    fontWeight: 500,
    maxWidth: '420px',
    animation: 'slideIn 0.3s ease-out',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fca5a5',
  },
  success: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    border: '1px solid #86efac',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.1rem',
    lineHeight: 1,
    padding: '0 0 0 8px',
    color: 'inherit',
    opacity: 0.7,
  },
};

export default SupervisorApprovals;
