import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Search, Filter, X, Star } from 'lucide-react';
import {
  feedbackService,
  type FeedbackRow,
  type CompetencyRating,
} from '../../services/feedbackService';
import DropdownSelect from '../../components/DropdownSelect';

const defaultCompetencies = ['Technical Skills', 'Communication', 'Teamwork', 'Timeliness'];
const ITEMS_PER_PAGE = 10;
const FEEDBACK_STATUS_OPTIONS = [
  { value: '', label: 'Filter by Status' },
  { value: 'Submitted', label: 'Submitted' },
  { value: 'Pending', label: 'Pending' },
] as const;

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
  const [currentPage, setCurrentPage] = useState(1);
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

  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const paginationItems = Array.from({ length: totalPages }, (_, index) => index + 1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Feedback</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of submitted and pending feedback for interns.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {[
          { label: 'Feedback Submitted', value: submittedCount, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Pending Feedback',   value: pendingCount,   color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm backdrop-blur-md md:rounded-[2rem] md:p-6 dark:border-white/5 dark:bg-slate-900/50"
          >
            <div className={`mb-2 inline-flex rounded-xl px-2.5 py-1.5 md:mb-3 md:rounded-2xl md:px-3 md:py-2 ${card.bg}`}>
              <span className={`text-[0.65rem] font-bold uppercase tracking-widest md:text-xs ${card.color}`}>{card.label}</span>
            </div>
            <p className="text-2xl font-black text-gray-900 md:text-4xl dark:text-white">{card.value}</p>
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
            <Filter size={16} className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-gray-400" />
            <DropdownSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={FEEDBACK_STATUS_OPTIONS as unknown as { value: string; label: string }[]}
              buttonClassName="min-h-[42px] rounded-xl py-2 pl-9"
            />
          </div>
        </div>
      </motion.div>

      {/* Desktop: Table view */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
        className="hidden rounded-[2.5rem] border border-gray-200 bg-white shadow-sm backdrop-blur-md md:block dark:border-white/5 dark:bg-slate-900/50"
      >
        <div className="overflow-x-auto px-8 py-6">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          ) : filteredRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No completed tasks found.</p>
          ) : (
            <>
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
                {paginatedRows.map((row, idx) => (
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
            {totalPages > 1 && (
              <div className="pagination-controls">
                <div className="pagination-summary">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredRows.length)} of {filteredRows.length} feedback entries
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

      {/* Mobile: Card-based view */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
            Loading...
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
            No completed tasks found.
          </div>
        ) : (
          <>
          {paginatedRows.map((row, idx) => (
            <motion.div
              key={`mobile-${row.taskId}-${row.internId}`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-slate-900/50"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{row.taskName}</h3>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${
                  row.feedbackSubmitted
                    ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                }`}>
                  {row.feedbackSubmitted ? 'Submitted' : 'Pending'}
                </span>
              </div>
              <div className="mb-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Intern</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{row.internName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Role</span>
                  <span className="text-gray-700 dark:text-gray-300">{row.internRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Completed</span>
                  <span className="text-gray-700 dark:text-gray-300">{formatDate(row.completionDate)}</span>
                </div>
              </div>
              <button
                className="w-full rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground transition-all hover:brightness-95"
                onClick={() => openModal(row)}
              >
                {row.feedbackSubmitted ? 'Edit Feedback' : 'Give Feedback'}
              </button>
            </motion.div>
          ))}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <div className="pagination-summary">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredRows.length)} of {filteredRows.length} feedback entries
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
                      <textarea
                        value={e.comment}
                        onChange={ev => updateEvaluation(idx, 'comment', ev.target.value)}
                        rows={2}
                        className="w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
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
