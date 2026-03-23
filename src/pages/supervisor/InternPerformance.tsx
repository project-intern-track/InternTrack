import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { userService } from '../../services/userServices';
import { taskService } from '../../services/taskServices';
import type { Tasks } from '../../types/database.types';

interface InternRow {
  id: number;
  name: string;
  email: string;
  ojt_role: string;
  required_hours: number | null;
  completed_tasks: number;
  in_progress_tasks: number;
}

// ── Helper ─────────────────────────────────────────────────────────────────

const performanceStatus = (completedTasks: number): {
  label: string;
  color: string;
} => {
  if (completedTasks >= 10) return { label: 'Excellent', color: 'text-green-600 dark:text-green-400' };
  if (completedTasks >= 6)  return { label: 'Good',      color: 'text-blue-600 dark:text-blue-400' };
  if (completedTasks >= 3)  return { label: 'Average',   color: 'text-orange-600 dark:text-orange-400' };
  return { label: 'Needs Improvement', color: 'text-red-600 dark:text-red-400' };
};

// ── Component ──────────────────────────────────────────────────────────────

const InternPerformance = () => {
  const [interns, setInterns] = useState<InternRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [internUsers, allTasks] = await Promise.all([
        userService.fetchInterns(),
        taskService.getSupervisorTasks(),
      ]);

      // Count task statuses per intern
      const completedByIntern: Record<number, number> = {};
      const inProgressByIntern: Record<number, number> = {};

      (allTasks as Tasks[]).forEach((task) => {
        task.assigned_interns?.forEach((intern) => {
          if (task.status === 'completed') {
            completedByIntern[intern.id] = (completedByIntern[intern.id] ?? 0) + 1;
          }
          if (task.status === 'in_progress') {
            inProgressByIntern[intern.id] = (inProgressByIntern[intern.id] ?? 0) + 1;
          }
        });
      });

      const rows: InternRow[] = (internUsers as any[]).map((u) => ({
        id: u.id,
        name: u.full_name ?? '—',
        email: u.email ?? '—',
        ojt_role: u.ojt_role ?? '—',
        required_hours: u.required_hours ?? null,
        completed_tasks: completedByIntern[u.id] ?? 0,
        in_progress_tasks: inProgressByIntern[u.id] ?? 0,
      }));

      rows.sort((a, b) => b.completed_tasks - a.completed_tasks);
      setInterns(rows);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load intern performance data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading intern performance…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center dark:border-red-400/20 dark:bg-red-500/10">
          <p className="font-bold text-red-700 dark:text-red-300">Failed to load data</p>
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

  const perfBadgeStyles: Record<string, string> = {
    Excellent:         'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    Good:             'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    Average:          'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    'Needs Improvement': 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  };

  const totalPages = Math.ceil(interns.length / ITEMS_PER_PAGE);
  const paginatedInterns = interns.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
          Intern Performance
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of intern tasks and performance metrics.
        </p>
      </motion.div>

      {/* Performance Table — desktop */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.07, ease: 'easeOut' }}
        className="hidden rounded-[2.5rem] border border-gray-200 bg-white shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50 overflow-hidden min-[851px]:block"
      >
        <div className="flex items-center gap-3 border-b border-gray-200 px-8 py-6 dark:border-white/5">
          <Users className="text-primary" size={20} />
          <h2 className="text-xl font-black text-gray-800 dark:text-white">Performance Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/5">
                <th className="px-8 pb-3 pt-5 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Intern</th>
                <th className="px-4 pb-3 pt-5 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">OJT Role</th>
                <th className="px-4 pb-3 pt-5 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Completed</th>
                <th className="px-4 pb-3 pt-5 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">In Progress</th>
                <th className="px-4 pb-3 pt-5 pr-8 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInterns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No intern data available.
                  </td>
                </tr>
              ) : (
                paginatedInterns.map((intern, index) => {
                  const perf = performanceStatus(intern.completed_tasks);
                  return (
                    <motion.tr
                      key={intern.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.03 * index, ease: 'easeOut' }}
                      className="border-b border-gray-100 last:border-none hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="px-8 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white">{intern.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{intern.email}</div>
                      </td>
                      <td className="px-4 py-4 text-gray-700 dark:text-gray-300">{intern.ojt_role}</td>
                      <td className="px-4 py-4 font-black text-gray-900 dark:text-white">{intern.completed_tasks}</td>
                      <td className="px-4 py-4 text-gray-700 dark:text-gray-300">{intern.in_progress_tasks}</td>
                      <td className="px-4 py-4 pr-8">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${perfBadgeStyles[perf.label] ?? 'bg-gray-100 text-gray-700'}`}>
                          {perf.label}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Mobile card view */}
      <div className="space-y-3 min-[851px]:hidden">
        {paginatedInterns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
            No intern data available.
          </div>
        ) : (
          paginatedInterns.map((intern, index) => {
            const perf = performanceStatus(intern.completed_tasks);
            return (
              <motion.div
                key={intern.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.03 * index }}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-slate-900/50"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{intern.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{intern.email}</p>
                  </div>
                  <span className={`shrink-0 inline-flex rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${perfBadgeStyles[perf.label] ?? 'bg-gray-100 text-gray-700'}`}>
                    {perf.label}
                  </span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">OJT Role</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{intern.ojt_role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Completed</span>
                    <span className="font-black text-gray-900 dark:text-white">{intern.completed_tasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">In Progress</span>
                    <span className="text-gray-700 dark:text-gray-300">{intern.in_progress_tasks}</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <div className="pagination-summary">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, interns.length)} of {interns.length} interns
          </div>
          <div className="pagination-buttons">
            <button
              className="pagination-btn pagination-arrow"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >Prev</button>
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                return (
                  <button
                    key={page}
                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >{page}</button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="pagination-ellipsis">...</span>;
              }
              return null;
            })}
            <button
              className="pagination-btn pagination-arrow"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternPerformance;
