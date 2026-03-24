import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart, CheckCircle, ClipboardList, Star, Users, Eye, X } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userServices';
import { taskService } from '../../services/taskServices';
import type { Tasks } from '../../types/database.types';
import ModalPortal from '../../components/ModalPortal';

// ============================
// Types
// ============================

interface DashboardStats {
  totalInterns: number;
  totalTasks: number;
  pendingApproval: number;
  approved: number;
  needsRevision: number;
  rejected: number;
  topPerformer: { id: number; name: string; completed_tasks: number } | null;
}

// ============================
// Style Maps
// ============================
const statusStyles: Record<string, { pill: string; soft: string; text: string }> = {
  excellent: {
    pill: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
    soft: 'bg-green-50 dark:bg-green-500/10',
    text: 'text-green-700 dark:text-green-300',
  },
  'very good': {
    pill: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
    soft: 'bg-cyan-50 dark:bg-cyan-500/10',
    text: 'text-cyan-700 dark:text-cyan-300',
  },
  satisfactory: {
    pill: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    soft: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-300',
  },
  pending_approval: {
    pill: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    soft: 'bg-sky-50 dark:bg-sky-500/10',
    text: 'text-sky-700 dark:text-sky-300',
  },
  needs_revision: {
    pill: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    soft: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-300',
  },
  rejected: {
    pill: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    soft: 'bg-red-50 dark:bg-red-500/10',
    text: 'text-red-700 dark:text-red-300',
  },
  completed: {
    pill: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
    soft: 'bg-green-50 dark:bg-green-500/10',
    text: 'text-green-700 dark:text-green-300',
  },
  not_started: {
    pill: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-300',
    soft: 'bg-gray-50 dark:bg-gray-500/10',
    text: 'text-gray-700 dark:text-gray-300',
  },
  in_progress: {
    pill: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    soft: 'bg-blue-50 dark:bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-300',
  },
  overdue: {
    pill: 'bg-red-200 text-red-800 dark:bg-red-600/15 dark:text-red-400',
    soft: 'bg-red-50 dark:bg-red-500/10',
    text: 'text-red-800 dark:text-red-400',
  },
  pending: {
    pill: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-300',
    soft: 'bg-gray-50 dark:bg-gray-500/10',
    text: 'text-gray-700 dark:text-gray-300',
  },
};

const fallbackStyle = {
  pill: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-300',
  soft: 'bg-gray-50 dark:bg-gray-500/10',
  text: 'text-gray-700 dark:text-gray-300',
};

const chartColors: Record<string, string> = {
  'Pending Approval': 'hsl(var(--secondary))',
  'Approved': 'hsl(var(--success))',
  'Needs Revision': 'hsl(var(--warning))',
  'Rejected': 'hsl(var(--danger))',
};

// ============================
// Helpers
// ============================
const formatDueDate = (isoDate: string | undefined) => {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatStatus = (status: string) =>
  status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// ============================
// Main Component
// ============================
const SupervisorDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Tasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailTask, setDetailTask] = useState<Tasks | null>(null);
  const [finalizingId, setFinalizingId] = useState<number | null>(null);
  const [currentTaskPage, setCurrentTaskPage] = useState(1);
  const [isMobileTasksView, setIsMobileTasksView] = useState(() => window.innerWidth <= 768);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, tasksData] = await Promise.all([
        userService.getSupervisorDashboardStats(),
        taskService.getSupervisorTasks(),
      ]);
      setStats(statsData);
      setRecentTasks(tasksData);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleResize = () => setIsMobileTasksView(window.innerWidth <= 768);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // A task can be finalized when it's in_progress and every intern has finished
  const canFinalize = (task: Tasks) =>
    task.status === 'in_progress' &&
    task.assigned_interns.length > 0 &&
    task.assigned_interns.every((i) => i.intern_status === 'completed');

  const handleFinalize = async (taskId: number) => {
    if (finalizingId !== null) return;
    setFinalizingId(taskId);
    try {
      await taskService.finalizeTask(taskId);
      await fetchData();
    } catch (err) {
      console.error('Failed to finalize task:', err);
    } finally {
      setFinalizingId(null);
    }
  };

  // ── Computed values ──────────────────────────────────────────────────────
  const pieData = stats
    ? [
        { name: 'Pending Approval', value: stats.pendingApproval },
        { name: 'Approved', value: stats.approved },
        { name: 'Needs Revision', value: stats.needsRevision },
        { name: 'Rejected', value: stats.rejected },
      ]
    : [];

  const totalPie = pieData.reduce((acc, d) => acc + d.value, 0);
  const taskItemsPerPage = 5;
  const totalTaskPages = Math.max(1, Math.ceil(recentTasks.length / taskItemsPerPage));
  const safeTaskPage = Math.min(Math.max(1, currentTaskPage), totalTaskPages);
  const paginatedRecentTasks = recentTasks.slice(
    (safeTaskPage - 1) * taskItemsPerPage,
    safeTaskPage * taskItemsPerPage
  );

  const summaryRows = stats
    ? [
        { label: 'Pending Approval', value: stats.pendingApproval, colorClass: 'text-sky-600 dark:text-sky-300', soft: 'bg-sky-50 dark:bg-sky-500/10' },
        { label: 'Approved', value: stats.approved, colorClass: 'text-green-600 dark:text-green-300', soft: 'bg-green-50 dark:bg-green-500/10' },
        { label: 'Needs Revision', value: stats.needsRevision, colorClass: 'text-amber-600 dark:text-amber-300', soft: 'bg-amber-50 dark:bg-amber-500/10' },
        { label: 'Rejected', value: stats.rejected, colorClass: 'text-red-600 dark:text-red-300', soft: 'bg-red-50 dark:bg-red-500/10' },
      ]
    : [];

  useEffect(() => {
    setCurrentTaskPage(1);
  }, [isMobileTasksView]);

  useEffect(() => {
    if (currentTaskPage > totalTaskPages) {
      setCurrentTaskPage(1);
    }
  }, [currentTaskPage, totalTaskPages]);

  // ── Loading / Error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center dark:border-red-400/20 dark:bg-red-500/10">
          <p className="font-bold text-red-700 dark:text-red-300">Failed to load dashboard</p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            Welcome back, {user?.name ?? 'Supervisor'}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Supervisor Dashboard Overview</p>
        </div>
        {stats?.topPerformer && (
          <div className="hidden rounded-xl border border-gray-200 bg-white px-4 py-2 text-right shadow-sm dark:border-white/5 dark:bg-slate-900/50 md:block">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Top Intern</p>
            <p className="text-sm font-bold text-primary">
              {stats.topPerformer.name} ({stats.topPerformer.completed_tasks} completed)
            </p>
          </div>
        )}
      </motion.div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Pending Tasks',
            value: stats?.pendingApproval ?? 0,
            icon: ClipboardList,
            iconColor: 'text-orange-500',
            iconBg: 'bg-orange-500/10',
          },
          {
            label: 'Total Interns',
            value: stats?.totalInterns ?? 0,
            icon: Users,
            iconColor: 'text-blue-500',
            iconBg: 'bg-blue-500/10',
          },
          {
            label: 'Top Score',
            value: stats?.topPerformer ? `${stats.topPerformer.completed_tasks} tasks` : '—',
            icon: Star,
            iconColor: 'text-green-500',
            iconBg: 'bg-green-500/10',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * index, duration: 0.35 }}
            className="rounded-[2rem] border border-gray-200 bg-white p-3 md:p-6 shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50"
          >
            <div className={`mb-2 md:mb-4 flex h-9 w-9 md:h-12 md:w-12 items-center justify-center rounded-2xl ${stat.iconBg}`}>
              <stat.icon className={stat.iconColor} size={20} />
            </div>
            <p className="text-[0.55rem] md:text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className="mt-1 md:mt-2 text-2xl md:text-4xl font-black text-gray-900 dark:text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Recent Tasks Table + Top Performer ─────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Tasks Table */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-[2.5rem] border border-gray-200 bg-white shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50 lg:col-span-2"
        >
          <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-5 dark:border-white/5">
            <ClipboardList className="text-primary" size={20} />
            <h2 className="text-xl font-black text-gray-800 dark:text-white">Recent Tasks</h2>
          </div>
          <div className="overflow-x-auto">
            <div className="px-6 py-5">
              {recentTasks.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No tasks found.</p>
              ) : (
                <>
                  <div className="hidden md:block">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-white/5">
                          <th className="hidden pb-3 pr-4 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 lg:table-cell">Intern(s)</th>
                          <th className="pb-3 pr-4 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Task</th>
                          <th className="hidden pb-3 pr-4 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 lg:table-cell">Due Date</th>
                          <th className="hidden pb-3 pr-4 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 lg:table-cell">Status</th>
                          <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRecentTasks.map((task, index) => {
                          const style = statusStyles[task.status] ?? fallbackStyle;
                          const doneCount = task.assigned_interns.filter((i) => i.intern_status === 'completed').length;
                          const totalCount = task.assigned_interns.length;
                          const readyToFinalize = canFinalize(task);
                          return (
                            <motion.tr
                              key={task.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.03 * index, duration: 0.25 }}
                              className="border-b border-gray-100 last:border-none dark:border-white/5"
                            >
                              <td className="hidden py-3 pr-4 lg:table-cell">
                                <div className="font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                  {task.assigned_interns?.map((i) => i.full_name).join(', ') ||
                                    (task.assigned_interns_count ? `${task.assigned_interns_count} intern(s)` : '-')}
                                </div>
                                {task.status === 'in_progress' && totalCount > 0 && (
                                  <div className={`mt-1 text-xs font-semibold ${
                                    readyToFinalize ? 'text-green-600 dark:text-green-400' : 'text-amber-500 dark:text-amber-400'
                                  }`}>
                                    {doneCount}/{totalCount} done
                                  </div>
                                )}
                              </td>
                              <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{task.title}</td>
                              <td className="hidden py-3 pr-4 text-gray-600 dark:text-gray-400 whitespace-nowrap lg:table-cell">{formatDueDate(task.due_date)}</td>
                              <td className="hidden py-3 pr-4 lg:table-cell">
                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize whitespace-nowrap ${style.pill}`}>
                                  {formatStatus(task.status)}
                                </span>
                              </td>
                              <td className="py-3">
                                {readyToFinalize ? (
                                  <button
                                    onClick={() => handleFinalize(task.id)}
                                    disabled={finalizingId !== null}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-green-700 hover:scale-105 active:scale-95 disabled:opacity-60"
                                  >
                                    <CheckCircle size={13} />
                                    {finalizingId === task.id ? 'Finalizing...' : 'Finalize'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setDetailTask(task)}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white transition-transform hover:scale-105 active:scale-95"
                                  >
                                    <Eye size={14} />
                                    View
                                  </button>
                                )}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-3 md:hidden">
                    {paginatedRecentTasks.map((task, index) => {
                      const style = statusStyles[task.status] ?? fallbackStyle;
                      const doneCount = task.assigned_interns.filter((i) => i.intern_status === 'completed').length;
                      const totalCount = task.assigned_interns.length;
                      const readyToFinalize = canFinalize(task);
                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.03 * index, duration: 0.25 }}
                          className="rounded-[1.75rem] border border-gray-200 bg-gray-50/80 p-4 shadow-sm dark:border-white/5 dark:bg-white/5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-base font-bold text-gray-900 dark:text-white">{task.title}</p>
                              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                {formatDueDate(task.due_date)}
                              </p>
                            </div>
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize whitespace-nowrap ${style.pill}`}>
                              {formatStatus(task.status)}
                            </span>
                          </div>

                          <div className="mt-4 space-y-3">
                            <div>
                              <p className="text-[0.7rem] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Intern(s)</p>
                              <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {task.assigned_interns?.map((i) => i.full_name).join(', ') ||
                                  (task.assigned_interns_count ? `${task.assigned_interns_count} intern(s)` : '-')}
                              </p>
                            </div>

                            {task.status === 'in_progress' && totalCount > 0 && (
                              <div className={`text-xs font-semibold ${
                                readyToFinalize ? 'text-green-600 dark:text-green-400' : 'text-amber-500 dark:text-amber-400'
                              }`}>
                                Progress: {doneCount}/{totalCount} done
                              </div>
                            )}

                            <div className="pt-1">
                              {readyToFinalize ? (
                                <button
                                  onClick={() => handleFinalize(task.id)}
                                  disabled={finalizingId !== null}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-green-700 active:scale-95 disabled:opacity-60"
                                >
                                  <CheckCircle size={14} />
                                  {finalizingId === task.id ? 'Finalizing...' : 'Finalize'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => setDetailTask(task)}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white transition-transform active:scale-95"
                                >
                                  <Eye size={14} />
                                  View
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="pagination-controls mt-5">
                    <div className="pagination-summary">
                      Showing {(safeTaskPage - 1) * taskItemsPerPage + 1} to {Math.min(safeTaskPage * taskItemsPerPage, recentTasks.length)} of {recentTasks.length} tasks
                    </div>
                    <div className="pagination-buttons">
                      <button
                        className="pagination-btn pagination-arrow"
                        onClick={() => setCurrentTaskPage((page) => Math.max(1, page - 1))}
                        disabled={safeTaskPage === 1}
                      >
                        Prev
                      </button>
                      {Array.from({ length: totalTaskPages }, (_, index) => index + 1).map((page) => {
                        if (page === 1 || page === totalTaskPages || (page >= safeTaskPage - 1 && page <= safeTaskPage + 1)) {
                          return (
                            <button
                              key={page}
                              className={`pagination-btn ${safeTaskPage === page ? 'active' : ''}`}
                              onClick={() => setCurrentTaskPage(page)}
                            >
                              {page}
                            </button>
                          );
                        }

                        if (page === safeTaskPage - 2 || page === safeTaskPage + 2) {
                          return <span key={page} className="pagination-ellipsis">...</span>;
                        }

                        return null;
                      })}
                      <button
                        className="pagination-btn pagination-arrow"
                        onClick={() => setCurrentTaskPage((page) => Math.min(totalTaskPages, page + 1))}
                        disabled={safeTaskPage === totalTaskPages}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Top Performer Card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
          className="rounded-[2.5rem] border border-gray-200 bg-white p-8 shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50"
        >
          <div className="mb-5 flex items-center gap-3">
            <Star className="text-primary" size={20} />
            <h2 className="text-xl font-black text-gray-800 dark:text-white">Top Performing Intern</h2>
          </div>
          {stats?.topPerformer ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/5 dark:bg-white/5">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Intern Name</p>
              <p className="mt-1 text-xl font-black text-gray-900 dark:text-white">{stats.topPerformer.name}</p>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-primary px-4 py-3 text-primary-foreground">
                <p className="text-sm font-bold">Completed Tasks</p>
                <p className="text-lg font-black">{stats.topPerformer.completed_tasks}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 dark:border-white/5 dark:bg-white/5 dark:text-gray-400">
              No completed tasks recorded yet.
            </div>
          )}
          <div className="mt-5 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Quick Insight</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {stats?.topPerformer
                ? `${stats.topPerformer.name} leads with the most completed tasks.`
                : 'Track task completion to identify your top performers.'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Performance Distribution ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2 }}
        className="rounded-[2.5rem] border border-gray-200 bg-white p-8 shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50"
      >
        <div className="mb-6 flex items-center gap-3">
          <BarChart className="text-primary" size={20} />
          <h2 className="text-xl font-black text-gray-800 dark:text-white">Task Status Distribution</h2>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={({ value }) => {
                    if (!value || totalPie === 0) return '0%';
                    return `${((value / totalPie) * 100).toFixed(0)}%`;
                  }}
                  labelLine={false}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={chartColors[entry.name] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | undefined) => {
                    const v = value ?? 0;
                    if (totalPie === 0) return ['0%', 'Share'];
                    return [`${((v / totalPie) * 100).toFixed(0)}% (${v})`, 'Tasks'];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2">
              <Users className="text-primary" size={16} />
              <h3 className="text-base font-black text-gray-800 dark:text-white">Status Summary</h3>
            </div>
            {summaryRows.map((row, index) => {
              const percent = stats && stats.totalTasks > 0
                ? Math.round((row.value / stats.totalTasks) * 100)
                : 0;
              return (
                <motion.div
                  key={row.label}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index, duration: 0.25 }}
                  className={`rounded-xl border border-gray-200 px-4 py-3 dark:border-white/5 ${row.soft}`}
                >
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-bold ${row.colorClass}`}>{row.label}</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white">
                      {row.value} ({percent}%)
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Task Detail Modal (mobile) ───────────────────────────────────────── */}
      {detailTask && (() => {
        const style = statusStyles[detailTask.status] ?? fallbackStyle;
        const internNames = detailTask.assigned_interns?.map((i) => i.full_name).join(', ')
          || (detailTask.assigned_interns_count ? `${detailTask.assigned_interns_count} intern(s)` : '—');
        return (
          <ModalPortal>
            <div
              className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
              onClick={() => setDetailTask(null)}
            >
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-900"
                onClick={(e) => e.stopPropagation()}
              >
              <button
                onClick={() => setDetailTask(null)}
                className="absolute right-4 top-4 rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>

              <h2 className="mb-5 text-xl font-black text-gray-900 dark:text-white">{detailTask.title}</h2>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Intern(s)</label>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{internNames}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Due Date</label>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatDueDate(detailTask.due_date)}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Priority</label>
                    <p className="text-sm font-semibold capitalize text-gray-900 dark:text-gray-100">{detailTask.priority}</p>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Status</label>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${style.pill}`}>
                    {formatStatus(detailTask.status)}
                  </span>
                </div>

                {detailTask.description && (
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Description</label>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{detailTask.description}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setDetailTask(null)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-white/15 dark:bg-transparent dark:text-gray-200 dark:hover:bg-white/10"
                >
                  Close
                </button>
              </div>
              </motion.div>
            </div>
          </ModalPortal>
        );
      })()}
    </div>
  );
};

export default SupervisorDashboard;
