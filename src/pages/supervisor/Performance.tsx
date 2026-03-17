import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, ClipboardList, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userServices';
import { taskService } from '../../services/taskServices';
import PageLoader from '../../components/PageLoader';

import type { Tasks } from '../../types/database.types';

interface InternPerformanceRow {
  id: number;
  name: string;
  email: string;
  ojt_role: string;
  completedTasks: number;
}

const Performance = () => {
  const { } = useAuth();
  const [interns, setInterns] = useState<InternPerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInterns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all interns and all supervisor tasks in parallel
      const [internUsers, allTasks] = await Promise.all([
        userService.fetchInterns(),
        taskService.getSupervisorTasks(),
      ]);

      // Count completed tasks per intern
      const completedByIntern: Record<number, number> = {};
      (allTasks as Tasks[]).forEach((task) => {
        if (task.status === 'completed') {
          task.assigned_interns?.forEach((intern) => {
            completedByIntern[intern.id] = (completedByIntern[intern.id] ?? 0) + 1;
          });
        }
      });

      const rows: InternPerformanceRow[] = (internUsers as any[]).map((u) => ({
        id: u.id,
        name: u.full_name ?? '—',
        email: u.email ?? '—',
        ojt_role: u.ojt_role ?? '—',
        completedTasks: completedByIntern[u.id] ?? 0,
      }));

      // Sort descending by completed tasks
      rows.sort((a, b) => b.completedTasks - a.completedTasks);

      setInterns(rows);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load performance data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterns();
  }, [fetchInterns]);

  if (loading) return <PageLoader message="Loading performance data..." />;

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center dark:border-red-400/20 dark:bg-red-500/10">
          <p className="font-bold text-red-700 dark:text-red-300">Failed to load performance data</p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchInterns}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const topTasks = interns[0]?.completedTasks ?? 0;
  const totalCompletedTasks = interns.reduce((sum, i) => sum + i.completedTasks, 0);
  const averageCompletedTasks = interns.length > 0
    ? Math.round(totalCompletedTasks / interns.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Intern Performance</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Track completed tasks and identify top-performing interns.
        </p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.07, ease: 'easeOut' }}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900/50">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-500/20">
            <Users size={22} className="text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Total Interns</p>
          <p className="mt-1 text-4xl font-black text-gray-900 dark:text-white">{interns.length}</p>
        </div>

        <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900/50">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-500/20">
            <ClipboardList size={22} className="text-green-600 dark:text-green-400" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Completed Tasks</p>
          <p className="mt-1 text-4xl font-black text-gray-900 dark:text-white">{totalCompletedTasks}</p>
        </div>

        <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900/50">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-500/20">
            <Star size={22} className="text-amber-500 dark:text-amber-400" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Avg. per Intern</p>
          <p className="mt-1 text-4xl font-black text-gray-900 dark:text-white">{averageCompletedTasks}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.14, ease: 'easeOut' }}
        className="rounded-[2.5rem] border border-gray-200 bg-white shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50 overflow-hidden"
      >
        <div className="flex items-center gap-3 border-b border-gray-200 px-8 py-6 dark:border-white/5">
          <Star className="text-primary" size={20} />
          <h2 className="text-xl font-black text-gray-800 dark:text-white">Intern Ranking</h2>
          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">Sorted by completed tasks</span>
        </div>

        <div className="p-6 space-y-3">
          {interns.length === 0 && (
            <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
              No intern performance data available.
            </p>
          )}

          {interns.map((intern, index) => {
            const progress = topTasks > 0 ? (intern.completedTasks / topTasks) * 100 : 0;
            return (
              <motion.div
                key={intern.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.03 * index, ease: 'easeOut' }}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/5 dark:bg-white/5"
              >
                <div className="mb-2 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{intern.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      #{index + 1} · {intern.ojt_role}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {intern.completedTasks} task{intern.completedTasks !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.55, delay: 0.18 + 0.04 * index, ease: 'easeOut' }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default Performance;
