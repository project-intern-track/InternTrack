import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Search, Filter, X, Star } from 'lucide-react';
import {
  feedbackService,
  type FeedbackRow,
  type CompetencyRating,
} from '../../services/feedbackService';

const defaultCompetencies = ['Technical Skills', 'Communication', 'Teamwork', 'Timeliness'];

type StarRatingProps = { rating: number; onChange: (val: number) => void; max?: number };
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
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [competencyModal, setCompetencyModal] = useState<{
    row: FeedbackRow;
    evaluations: CompetencyRating[];
  } | null>(null);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const data = await feedbackService.getSupervisorTasks();
      setRows(data);
    } catch (err) {
      console.error('Failed to fetch feedback rows:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const submittedCount = rows.filter(r => r.feedbackSubmitted).length;
  const pendingCount = rows.filter(r => !r.feedbackSubmitted).length;

  const filteredRows = rows.filter(row => {
    const matchesSearch =
      row.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.internName.toLowerCase().includes(searchTerm.toLowerCase());
    const status = row.feedbackSubmitted ? 'Submitted' : 'Pending';
    const matchesFilter = filterStatus ? status === filterStatus : true;
    return matchesSearch && matchesFilter;
  });

  const openModal = (row: FeedbackRow) => {
    const evaluations: CompetencyRating[] = row.competencyRatings?.length
      ? row.competencyRatings
      : defaultCompetencies.map(c => ({ competency: c, rating: 0, comment: '' }));
    setCompetencyModal({ row, evaluations });
  };

  const updateEvaluation = (index: number, key: 'rating' | 'comment', value: number | string) => {
    if (!competencyModal) return;
    setCompetencyModal({
      ...competencyModal,
      evaluations: competencyModal.evaluations.map((e, i) =>
        i === index ? { ...e, [key]: value } : e
      ),
    });
  };

  const submitFeedback = async () => {
    if (!competencyModal || submitting) return;
    try {
      setSubmitting(true);
      await feedbackService.submitFeedback(
        competencyModal.row.taskId,
        competencyModal.row.internId,
        competencyModal.evaluations,
      );
      setCompetencyModal(null);
      await fetchRows();
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-4 p-4 md:p-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Feedback</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of submitted and pending feedback for interns.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          { label: 'Feedback Submitted', value: submittedCount, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Pending Feedback',   value: pendingCount,   color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
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
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="relative md:col-span-3">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Search task or intern..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div className="relative md:col-span-2">
            <Filter size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-16 text-sm text-gray-800 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            >
              <option value="">Filter by Status</option>
              <option value="Submitted">Submitted</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
        className="rounded-[2.5rem] border border-gray-200 bg-white shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50"
      >
        <div className="overflow-x-auto px-8 py-6">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          ) : filteredRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No completed tasks found.</p>
          ) : (
            <table className="min-w-[880px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Task Name</th>
                  <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Intern</th>
                  <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Completion Date</th>
                  <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Status</th>
                  <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <motion.tr
                    key={`${row.taskId}-${row.internId}`}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="border-b border-gray-100 last:border-none dark:border-white/5"
                  >
                    <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-gray-100">{row.taskName}</td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-gray-800 dark:text-gray-200">{row.internName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{row.internRole}</div>
                    </td>
                    <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{formatDate(row.completionDate)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        row.feedbackSubmitted
                          ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                      }`}>
                        {row.feedbackSubmitted ? 'Submitted' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-all hover:brightness-95"
                        onClick={() => openModal(row)}
                      >
                        {row.feedbackSubmitted ? 'Edit Feedback' : 'Give Feedback'}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* Competency Modal — portaled to document.body to escape layout stacking context */}
      {competencyModal && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="relative max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-white/10 dark:bg-slate-900"
          >
            <button
              onClick={() => setCompetencyModal(null)}
              className="absolute right-4 top-4 rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              Intern: {competencyModal.row.internName}
            </h2>
            <p className="mt-0.5 text-sm font-semibold text-gray-500 dark:text-gray-400">
              Role: {competencyModal.row.internRole}
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              Task: {competencyModal.row.taskName}
            </p>

            <table className="mt-5 w-full text-sm">
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
                        type="text" value={e.comment}
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
                onClick={submitFeedback}
                disabled={submitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all hover:brightness-95 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default FeedbackDashboard;