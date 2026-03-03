import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, ClipboardList, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { useRealtime } from '../../hooks/useRealtime';
import PageLoader from '../../components/PageLoader';

interface InternPerformanceRow {
  id: string;
  name: string;
  completedTasks: number;
}

const Performance = () => {
  const { user } = useAuth();
  const [interns, setInterns] = useState<InternPerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInterns = useCallback(async () => {
    if (!user) return;

    // Get all interns
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, full_name, role')
      .eq('role', 'intern');

    if (error) return;

    // For each intern, count completed tasks
    const results = await Promise.all(
      (users || []).map(async intern => {
        const { count } = await supabase
          .from('tasks')
          .select('*', { count: 'exact' })
          .eq('assigned_to', intern.id)
          .eq('status', 'done');

        return {
          id: intern.id,
          name: intern.full_name || intern.name || 'Unnamed Intern',
          completedTasks: count || 0,
        };
      })
    );

    setInterns(results.sort((a, b) => b.completedTasks - a.completedTasks));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchInterns();
  }, [fetchInterns]);

  // Re-fetch whenever users or tasks change in real-time
  useRealtime(['users', 'tasks'], fetchInterns);

  if (loading) return <PageLoader message="Loading performance data..." />;

  const topTasks = interns[0]?.completedTasks ?? 0;
  const totalCompletedTasks = interns.reduce((sum, intern) => sum + intern.completedTasks, 0);
  const averageCompletedTasks = interns.length > 0
    ? Math.round(totalCompletedTasks / interns.length)
    : 0;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-lg border border-border bg-card p-6"
      >
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Intern Performance</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track completed tasks and identify top-performing interns.
        </p>
        {user && (
          <p className="mt-3 text-sm text-muted-foreground">
            Signed in as <span className="font-semibold text-foreground">{user.name || 'Supervisor'}</span>
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Users size={16} /> Total Interns
          </div>
          <p className="text-2xl font-bold text-foreground">{interns.length}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <ClipboardList size={16} /> Completed Tasks
          </div>
          <p className="text-2xl font-bold text-foreground">{totalCompletedTasks}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Star size={16} /> Average per Intern
          </div>
          <p className="text-2xl font-bold text-foreground">{averageCompletedTasks}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-lg border border-border bg-card p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Intern Ranking</h2>
          <span className="text-sm text-muted-foreground">Sorted by completed tasks</span>
        </div>

        <div className="space-y-3">
          {interns.length === 0 && (
            <p className="rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
              No intern performance data available.
            </p>
          )}

          {interns.map((intern, index) => {
            const progress = topTasks > 0 ? (intern.completedTasks / topTasks) * 100 : 0;

            return (
              <motion.div
                key={intern.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.06 * index }}
                className="rounded-md border border-border bg-background p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">{intern.name}</p>
                    <p className="text-xs text-muted-foreground">Rank #{index + 1}</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{intern.completedTasks} tasks</p>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.45, delay: 0.08 * index }}
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
