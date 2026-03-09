import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Eye, Edit, X, Pencil, Star } from 'lucide-react';
import {
  feedbackService,
  type FeedbackTask,
  type FeedbackTaskIntern,
  type CompetencyRating,
} from '../../services/feedbackService';

const defaultCompetencies = [
  'Technical Skills',
  'Communication',
  'Teamwork',
  'Timeliness',
];

type StarRatingProps = {
  rating: number;
  onChange: (val: number) => void;
  max?: number;
};
const StarRating = ({ rating, onChange, max = 5 }: StarRatingProps) => (
  <div className="flex cursor-pointer gap-1">
    {Array.from({ length: max }, (_, i) => i + 1).map(star => (
      <Star
        key={star}
        size={18}
        className={star <= rating ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}
        fill={star <= rating ? 'currentColor' : 'none'}
        onClick={() => onChange(star)}
      />
    ))}
  </div>
);

const FeedbackDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [tasks, setTasks] = useState<FeedbackTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<FeedbackTask | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [competencyModal, setCompetencyModal] = useState<{
    taskId: number;
    internId: number;
    internIndex: number;
    internName: string;
    internRole: string;
    evaluations: CompetencyRating[];
  } | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await feedbackService.getSupervisorTasks();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch feedback tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const submittedCount = tasks.filter(t => t.status === 'Submitted').length;
  const pendingCount = tasks.filter(t => t.status === 'Pending').length;

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.taskName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus ? task.status === filterStatus : true;
    return matchesSearch && matchesFilter;
  });

  const updateEvaluation = (index: number, key: 'rating' | 'comment', value: number | string) => {
    if (!competencyModal) return;
    const newEvaluations = competencyModal.evaluations.map((evalItem, idx) =>
      idx === index ? { ...evalItem, [key]: value } : evalItem
    );
    setCompetencyModal({ ...competencyModal, evaluations: newEvaluations });
  };

  const submitCompetencyFeedback = async () => {
    if (!competencyModal || !selectedTask || submitting) return;
    try {
      setSubmitting(true);
      await feedbackService.submitFeedback(
        competencyModal.taskId,
        competencyModal.internId,
        competencyModal.evaluations,
      );
      setCompetencyModal(null);
      setSelectedTask(null);
      await fetchTasks();
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const openCompetencyModal = (task: FeedbackTask, intern: FeedbackTaskIntern, idx: number) => {
    const existing = intern.competency_ratings;
    const evaluations: CompetencyRating[] = existing?.length
      ? existing
      : defaultCompetencies.map(c => ({ competency: c, rating: 0, comment: '' }));
    setCompetencyModal({
      taskId: task.id,
      internId: intern.id,
      internIndex: idx,
      internName: intern.name,
      internRole: intern.role,
      evaluations,
    });
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Feedback</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of submitted and pending feedback for interns.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          { label: 'Feedback Submitted', value: submittedCount, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Pending Feedback', value: pendingCount, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
            className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50"
          >
            <div className={`mb-3 inline-flex rounded-2xl px-3 py-2 ${card.bg}`}>
              <span className={`text-xs font-bold uppercase tracking-widest ${card.color}`}>{card.label}</span>
            </div>
            <p className="text-4xl font-black text-gray-900 dark:text-white">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="relative md:col-span-3">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div className="relative md:col-span-2">
            <Filter size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            >
              <option value="">Filter by Status</option>
              <option value="Submitted">Submitted</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
        className="rounded-[2.5rem] border border-gray-200 bg-white shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50"
      >
        <div className="overflow-x-auto px-8 py-6">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          ) : filteredTasks.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No completed tasks found.
            </p>
          ) : (
            <table className="min-w-[880px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Task Name</th>
                  <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Completion Date</th>
                  <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Assigned Interns</th>
                  <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Status</th>
                  <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task, idx) => (
                  <motion.tr
                    key={task.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="border-b border-gray-100 last:border-none dark:border-white/5"
                  >
                    <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-gray-100">{task.taskName}</td>
                    <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{formatDate(task.completionDate)}</td>
                    <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">
                      {task.interns.length} {task.interns.length > 1 ? 'interns' : 'intern'}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        task.status === 'Submitted'
                          ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        {task.status === 'Submitted' ? (
                          <>
                            <button
                              className="rounded-md border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                              onClick={() => setSelectedTask(task)}
                              title="View Feedback"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="rounded-md border border-gray-200 p-2 text-amber-600 transition hover:bg-amber-50 hover:text-amber-700 dark:border-white/10 dark:text-amber-300 dark:hover:bg-amber-500/10"
                              onClick={() => setSelectedTask(task)}
                              title="Edit Feedback"
                            >
                              <Pencil size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            className="rounded-md border border-gray-200 p-2 text-blue-600 transition hover:bg-blue-50 hover:text-blue-700 dark:border-white/10 dark:text-blue-300 dark:hover:bg-blue-500/10"
                            onClick={() => setSelectedTask(task)}
                            title="Give Feedback"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* Task Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="relative max-h-[90%] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-white/10 dark:bg-slate-900"
          >
            <button
              onClick={() => setSelectedTask(null)}
              className="absolute right-4 top-4 rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Task Title</p>
                <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{selectedTask.taskName}</p>
              </div>
              <div className="md:text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Completion Date</p>
                <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{formatDate(selectedTask.completionDate)}</p>
              </div>
            </div>

            <div className="mb-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Task Description</p>
              <textarea
                readOnly
                value={selectedTask.taskDescription}
                rows={3}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-gray-200"
              />
            </div>

            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Assigned Interns</p>
            <table className="w-full border-collapse text-sm">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Role</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedTask.interns.map((intern, idx) => (
                  <tr key={intern.id} className="border-b border-gray-100 last:border-none dark:border-white/10">
                    <td className="px-3 py-3 text-gray-800 dark:text-gray-200">{intern.name}</td>
                    <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{intern.role}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        intern.feedback_submitted
                          ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                      }`}>
                        {intern.feedback_submitted ? 'Submitted' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-all hover:brightness-95"
                        onClick={() => openCompetencyModal(selectedTask, intern, idx)}
                      >
                        Give Feedback
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedTask(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Competency Modal */}
      {competencyModal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="relative max-h-[90%] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-white/10 dark:bg-slate-900"
          >
            <button
              onClick={() => setCompetencyModal(null)}
              className="absolute right-4 top-4 rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Intern: {competencyModal.internName}</h2>
            <h3 className="mt-1 text-sm font-semibold text-gray-600 dark:text-gray-300">Role: {competencyModal.internRole}</h3>

            <table className="mt-4 w-full bg-white text-sm dark:bg-transparent">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Competency</th>
                  <th className="px-3 py-2 text-left">Rating</th>
                  <th className="px-3 py-2 text-left">Comment</th>
                </tr>
              </thead>
              <tbody>
                {competencyModal.evaluations.map((e, idx) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-none dark:border-white/10">
                    <td className="px-3 py-3 text-gray-800 dark:text-gray-200">{e.competency}</td>
                    <td className="px-3 py-3">
                      <StarRating rating={e.rating} onChange={val => updateEvaluation(idx, 'rating', val)} />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={e.comment}
                        onChange={ev => updateEvaluation(idx, 'comment', ev.target.value)}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                        placeholder="Enter comment..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setCompetencyModal(null)}
                disabled={submitting}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50 dark:border-white/15 dark:bg-transparent dark:text-gray-200 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={submitCompetencyFeedback}
                disabled={submitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all hover:brightness-95 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FeedbackDashboard;
