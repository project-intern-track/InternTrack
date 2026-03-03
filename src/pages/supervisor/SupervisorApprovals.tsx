import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

type Status = 'review' | 'done' | 'Needs Revision' | 'Rejected';
type ActiveTab = 'review' | 'approved' | 'Needs Revision' | 'Rejected';

type Task = {
  id: string;
  title: string;
  description: string;
  assignedIntern: string;
  due_date: string;
  priority: 'Low Priority' | 'Medium Priority' | 'High Priority';
  status: Status;
  revisionReason?: string;
  revisionCategory?: string;
};

const statusBadgeStyles: Record<Status, string> = {
  review: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  'Needs Revision': 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
};

const priorityDotStyles: Record<Task['priority'], string> = {
  'Low Priority': 'bg-cyan-500',
  'Medium Priority': 'bg-amber-500',
  'High Priority': 'bg-red-500',
};

const SupervisorApprovals = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('review');

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Design Login Page', description: 'Create UI for login', assignedIntern: 'Juan Dela Cruz', due_date: '2026-02-20', priority: 'High Priority', status: 'review' },
    { id: '2', title: 'Setup Database', description: 'Initialize Supabase DB', assignedIntern: 'Maria Santos', due_date: '2026-02-19', priority: 'Medium Priority', status: 'done' },
    { id: '3', title: 'Write Test Cases', description: 'Add unit tests', assignedIntern: 'Carlo Reyes', due_date: '2026-02-22', priority: 'Low Priority', status: 'Needs Revision', revisionReason: 'Incomplete test cases', revisionCategory: 'Incomplete task details' },
    { id: '4', title: 'Dashboard Layout', description: 'Create dashboard grid layout', assignedIntern: 'Angela Lim', due_date: '2026-02-21', priority: 'High Priority', status: 'review' },
    { id: '5', title: 'Email Notifications', description: 'Integrate email alerts', assignedIntern: 'Juan Dela Cruz', due_date: '2026-02-18', priority: 'Medium Priority', status: 'Rejected' },
  ]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const reviewCount = tasks.filter(t => t.status === 'review').length;
  const approvedCount = tasks.filter(t => t.status === 'done').length;
  const needsRevisionCount = tasks.filter(t => t.status === 'Needs Revision').length;
  const rejectedCount = tasks.filter(t => t.status === 'Rejected').length;

  const tabs: Array<{ key: ActiveTab; label: string; count: number }> = [
    { key: 'review', label: 'To be Reviewed', count: reviewCount },
    { key: 'approved', label: 'Approved', count: approvedCount },
    { key: 'Needs Revision', label: 'Needs Revision', count: needsRevisionCount },
    { key: 'Rejected', label: 'Rejected', count: rejectedCount },
  ];

  const openRevisionModal = (task: Task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedTask(null);
    setShowModal(false);
  };

  const approveTask = (taskId: string) => {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: 'done' } : t)));
  };

  const rejectTask = (taskId: string) => {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: 'Rejected' } : t)));
  };

  const submitRevision = () => {
    if (selectedTask) {
      setTasks(prev =>
        prev.map(t =>
          t.id === selectedTask.id
            ? {
              ...t,
              status: 'Needs Revision',
              revisionReason: selectedTask.revisionReason,
              revisionCategory: selectedTask.revisionCategory,
            }
            : t
        )
      );
    }
    closeModal();
  };

  const filteredTasks =
    activeTab === 'review'
      ? tasks.filter(t => t.status === 'review')
      : activeTab === 'approved'
      ? tasks.filter(t => t.status === 'done')
      : activeTab === 'Needs Revision'
      ? tasks.filter(t => t.status === 'Needs Revision')
      : tasks.filter(t => t.status === 'Rejected');

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

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
          {filteredTasks.length === 0 ? (
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
                      <span className="font-semibold">Assigned to:</span> {task.assignedIntern}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Due:</span> {formatDate(task.due_date)}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold dark:border-white/10 dark:bg-white/5">
                    <span className={`h-2.5 w-2.5 rounded-full ${priorityDotStyles[task.priority]}`} />
                    <span className="text-gray-700 dark:text-gray-300">{task.priority}</span>
                  </div>
                </div>

                {activeTab === 'review' ? (
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button
                      onClick={() => openRevisionModal(task)}
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-amber-600"
                    >
                      Request Revision
                    </button>
                    <button
                      onClick={() => approveTask(task.id)}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectTask(task.id)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusBadgeStyles[task.status]}`}>
                      {task.status === 'done' ? 'Approved' : task.status}
                    </span>

                    {task.revisionReason && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-400/20 dark:bg-amber-500/10">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          <span className="font-bold">Revision Reason:</span> {task.revisionReason}
                        </p>
                        <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                          <span className="font-bold">Revision Category:</span> {task.revisionCategory || 'Other'}
                        </p>
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

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Revision Reason
                </label>
                <textarea
                  placeholder="Enter the reason for revision here"
                  className="min-h-[110px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:placeholder:text-gray-500"
                  onChange={e =>
                    setSelectedTask(prev => (prev ? { ...prev, revisionReason: e.target.value } : prev))
                  }
                  value={selectedTask?.revisionReason || ''}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Revision Category
                </label>
                <select
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  onChange={e =>
                    setSelectedTask(prev => (prev ? { ...prev, revisionCategory: e.target.value } : prev))
                  }
                  value={selectedTask?.revisionCategory || 'Other'}
                >
                  <option>Other</option>
                  <option>Incomplete task details</option>
                  <option>Incorrect intern assignment</option>
                  <option>Deadline needs adjustment</option>
                  <option>Not aligned with objectives</option>
                  <option>Duplicate task</option>
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
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all hover:brightness-95"
              >
                <CheckCircle size={16} />
                Submit
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SupervisorApprovals;