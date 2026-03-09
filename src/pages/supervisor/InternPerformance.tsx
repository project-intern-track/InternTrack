import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
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

  return (
    <div className="max-w-[2000px] mx-auto p-4 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-primary mb-1">
            Intern Performance
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Overview of intern tasks and performance metrics.
          </p>
        </div>
      </motion.div>

      {/* Performance Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-[2rem] shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Intern</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">OJT Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Completed Tasks</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">In Progress</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Performance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
              {interns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No intern data available.
                  </td>
                </tr>
              ) : (
                interns.map((intern, index) => {
                  const perf = performanceStatus(intern.completed_tasks);
                  return (
                    <motion.tr
                      key={intern.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + index * 0.04 }}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white">{intern.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{intern.email}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{intern.ojt_role}</td>
                      <td className="px-6 py-4 text-gray-900 dark:text-gray-100 font-semibold">{intern.completed_tasks}</td>
                      <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{intern.in_progress_tasks}</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${perf.color}`}>
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
    </div>
  );
};

export default InternPerformance;
