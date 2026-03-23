import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { BarChart, ClipboardList, Search, Users, Trash, X } from 'lucide-react';
import type { Evaluation } from '../../types/database.types';
import { evaluationService } from '../../services/evaluationService';
import { authService } from '../../services/authService';
import { userService } from '../../services/userServices';
import { feedbackService } from '../../services/feedbackService';

const Evaluations = () => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [internMap, setInternMap] = useState<{ [key: number]: string}>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [createFormData, setCreateFormData] = useState({
    intern_id: '',
    task_completion: 0,
    competency_score: '',
    score: 0,
    feedback: '',
  });
  const [allInterns, setAllInterns] = useState<any[]>([]);

  const handleInternSelect = async (internId: string) => {
    const existingEvaluation = evaluations.find(e => String(e.intern_id) === String(internId));
    if (existingEvaluation) {
      setIsReadOnly(true);
      setCreateFormData({
        intern_id: internId,
        task_completion: existingEvaluation.task_completion || 0,
        competency_score: existingEvaluation.competency_score || '',
        score: existingEvaluation.score || 0,
        feedback: existingEvaluation.feedback || '',
      });
      return;
    }

    setIsReadOnly(false);
    try {
      const scoreData = await feedbackService.getInternFinalScore(Number(internId));
      setCreateFormData({
        intern_id: internId,
        task_completion: scoreData.avgTaskCompletion,
        competency_score: scoreData.avgCompetency,
        score: scoreData.finalScore,
        feedback: '',
      });
    } catch (err) {
      console.log('Error Message: ', err);
      setCreateFormData({
        intern_id: internId,
        task_completion: 0,
        competency_score: '',
        score: 0,
        feedback: '',
      });
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { session, error } = await authService.getSession();
        if (session?.user?.id) {
          setCurrentUser({ id: session.user.id });
        } else {
          console.error('No user session found', error);
        }
      } catch (err: any) {
        console.error('Failed to fetch current user:', err);
      }
    };

    // All intern Data from Feedback
    const fetchInterns = async () => {
      try {
        const params = { role: 'intern' };
        const interns = await userService.fetchInterns(params);
        if (Array.isArray(interns)) {
          setAllInterns(interns);
        } else {
          console.warn('API did not return an array. Check the structure:', interns);
          setAllInterns([]);
        }
      } catch (err: any) {
        console.error('Failed to fetch interns:', err);
      }
    };

    // All Intern Names For Map Guide in Table Data
    const fetchInternName = async () => {
      try {
        const internName: { [key: number]: string } = {};

        for (const intern of allInterns) {
          internName[intern.id] = intern.full_name || intern.name || `Intern ${intern.id}`;
        }

        setInternMap(internName)
      } catch (err){
        console.error("Failed to Catch Intern Name", err);
      }

    if (allInterns.length > 0) {
      fetchInternName();
    }

    };

    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        const data = await evaluationService.getEvaluations();
        setEvaluations(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch evaluations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInterns();
    fetchInternName();
    fetchCurrentUser();
    fetchEvaluations();
  }, []);

  useEffect(() =>  {
    if (allInterns.length > 0) {
      try {
      const internNames: { [key: number]: string} = {};

      for (const intern of allInterns) {
        internNames[intern.id] = intern.full_name || intern.name || `Intern ${intern.id}`;
        }

        setInternMap(internNames)
      } catch (err){
        console.error("Failed to Catch Intern Name", err);
      }
    }

  }, [allInterns])

  const filteredEvaluations = evaluations.filter(e => {
    const internName = internMap[Number(e.intern_id)] || e.intern_name || '';
    const trimmedSearch = searchTerm.trim().toLowerCase();
    
    // If search is empty, show all
    if (!trimmedSearch) return true;
    
    return (
      String(e.intern_id).toLowerCase().includes(trimmedSearch) ||
      String(e.supervisor_id).toLowerCase().includes(trimmedSearch) ||
      internName.toLowerCase().includes(trimmedSearch)
    );
  });

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalEvaluated = evaluations.length;
  const averageScore = evaluations.length > 0
    ? Math.round(evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length)
    : 0;
  const excellentCount = evaluations.filter(e => e.score >= 80).length;

  const handleCreateEvaluation = async () => {
    if (!currentUser) return;
    try {
      const selectedInternName = internMap[Number(createFormData.intern_id)] || 'Unknown Intern';

      const payload = {
        intern_id: Number(createFormData.intern_id),
        supervisor_id: Number(currentUser.id),
        task_completion: Number(createFormData.task_completion),
        competency_score: String(createFormData.competency_score),
        score: Number(createFormData.score),
        feedback: String(createFormData.feedback),
        evaluation_date: new Date().toISOString().split('T')[0],
        intern_name: selectedInternName,
      };
      const newEvaluation = await evaluationService.createEvaluation(payload as any);
      setEvaluations([...evaluations, newEvaluation]);
      setShowCreateModal(false);
    } catch (err: any) {
      console.error('Create failed:', err);
    }
  };

  const handleCloseCreateModal = async () => {
    setShowCreateModal(false);
    setIsReadOnly(false);
    setCreateFormData({
      intern_id: '',
      task_completion: 0,
      competency_score: '',
      score: 0,
      feedback: '',
    });
  };

  // Updated Handle Deletion
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    setDeleteConfirm(id);
  };


  const confirmDelete = async () => {
    if (deleteConfirm === null) return;
    try {
      await evaluationService.deleteEvaluation(String(deleteConfirm));
      setEvaluations(evaluations.filter(evaluation => Number(evaluation.id) !== Number(deleteConfirm)));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error Message: ', err);
      alert('Failed to Delete Evaluation');
    }
  };  

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const summaryCards = [
    { label: 'Total Evaluated',      value: totalEvaluated,  icon: Users,         iconColor: 'text-blue-500',   iconBg: 'bg-blue-500/10'   },
    { label: 'Average Score',        value: averageScore,    icon: ClipboardList, iconColor: 'text-orange-500', iconBg: 'bg-orange-500/10' },
    { label: 'Excellent Performers', value: excellentCount,  icon: BarChart,      iconColor: 'text-green-500',  iconBg: 'bg-green-500/10'  },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Loading evaluations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      >
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Evaluations</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage evaluations for interns here.</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {summaryCards.map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.3 }}
            className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50"
          >
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconBg}`}>
              <item.icon className={item.iconColor} size={24} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{item.label}</p>
            <p className="mt-2 text-4xl font-black text-gray-900 dark:text-white">{item.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <div className="relative md:col-span-6">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Search by Name or ID" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>
      </motion.div>

      {/* Evaluation Records Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="rounded-[2.5rem] border border-gray-200 bg-white shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-8 py-6 dark:border-white/5">
          <div className="flex items-center gap-3">
            <ClipboardList className="text-primary" size={20} />
            <h2 className="text-xl font-black text-gray-800 dark:text-white">Evaluation Records</h2>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-primary/90"
          >
            + Create Evaluation
          </button>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto px-8 py-6 min-[851px]:block">
          {(() => {
            const totalPages = Math.ceil(filteredEvaluations.length / ITEMS_PER_PAGE);
            const paginatedEvaluations = filteredEvaluations.slice(
              (currentPage - 1) * ITEMS_PER_PAGE,
              currentPage * ITEMS_PER_PAGE
            );
            return (
              <>
                <table className="min-w-full w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10">
                      <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Intern ID</th>
                      <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Intern Name</th>
                      <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Score</th>
                      <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Date</th>
                      <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Feedback</th>
                      <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEvaluations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                          No evaluations found.
                        </td>
                      </tr>
                    ) : (
                      paginatedEvaluations.map((evaluation, idx) => (
                        <motion.tr
                          key={evaluation.id}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: idx * 0.04 }}
                          className="border-b border-gray-100 last:border-none dark:border-white/5"
                        >
                          <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-gray-100">{evaluation.intern_id}</td>
                          <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{internMap[Number(evaluation.intern_id)] || evaluation.intern_name || `Intern ${evaluation.intern_id}`}</td>
                          <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-gray-100">{evaluation.score}/100</td>
                          <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{evaluation.evaluation_date}</td>
                          <td className="py-3 pr-4 text-gray-700 dark:text-gray-300 truncate max-w-xs">{evaluation.feedback || '-'}</td>
                          <td className="py-3 pr-4">
                            <button
                              onClick={() => handleDelete(Number(evaluation.id))}
                              className="flex items-center gap-1 rounded-lg bg-red-500/10 p-2 text-red-600 hover:bg-red-500/20 dark:text-red-400"
                            >
                              <Trash size={16} />
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <div className="pagination-controls">
                    <div className="pagination-summary">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredEvaluations.length)} of {filteredEvaluations.length} evaluations
                    </div>
                    <div className="pagination-buttons">
                      <button className="pagination-btn pagination-arrow" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                          return <button key={page} className={`pagination-btn ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>;
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="pagination-ellipsis">...</span>;
                        }
                        return null;
                      })}
                      <button className="pagination-btn pagination-arrow" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Mobile card view */}
        {(() => {
          const totalPages = Math.ceil(filteredEvaluations.length / ITEMS_PER_PAGE);
          const paginatedEvaluations = filteredEvaluations.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
          );
          return (
            <div className="space-y-3 px-4 pb-6 pt-2 min-[851px]:hidden">
              {paginatedEvaluations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
                  No evaluations found.
                </div>
              ) : (
                paginatedEvaluations.map((evaluation, idx) => (
                  <motion.div
                    key={evaluation.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-slate-900/50"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {internMap[Number(evaluation.intern_id)] || evaluation.intern_name || `Intern ${evaluation.intern_id}`}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">ID: {evaluation.intern_id}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{evaluation.score}/100</span>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Date</span>
                        <span className="text-gray-700 dark:text-gray-300">{evaluation.evaluation_date}</span>
                      </div>
                      {evaluation.feedback && (
                        <div>
                          <span className="block text-xs text-gray-400 dark:text-gray-500 mb-0.5">Feedback</span>
                          <p className="text-gray-700 dark:text-gray-300 text-xs line-clamp-2">{evaluation.feedback}</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(Number(evaluation.id))}
                      className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/20 dark:text-red-400"
                    >
                      <Trash size={13} /> Delete
                    </button>
                  </motion.div>
                ))
              )}
              {totalPages > 1 && (
                <div className="pagination-controls">
                  <div className="pagination-summary">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredEvaluations.length)} of {filteredEvaluations.length} evaluations
                  </div>
                  <div className="pagination-buttons">
                    <button className="pagination-btn pagination-arrow" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                        return <button key={page} className={`pagination-btn ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>;
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="pagination-ellipsis">...</span>;
                      }
                      return null;
                    })}
                    <button className="pagination-btn pagination-arrow" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </motion.div>

      {/* Create Modal */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                {isReadOnly ? 'View Evaluation' : 'Create Evaluation'}
              </h3>
              <button
                onClick={handleCloseCreateModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Select Intern</label>
                <select
                  value={createFormData.intern_id}
                  onChange={e => handleInternSelect(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">Select an intern...</option>
                  {allInterns.map(intern => (
                    <option key={intern.id} value={intern.id}>
                      {intern.full_name || intern.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Task Completion</label>
                <input
                  type="number" min="0" max="10" value={createFormData.task_completion}
                  onChange={e => setCreateFormData({ ...createFormData, task_completion: Number(e.target.value) })}
                  disabled={isReadOnly}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed dark:border-white/10 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-800/50 dark:disabled:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Competency Score</label>
                <input
                  type="text" placeholder="e.g., 4.5/5" value={createFormData.competency_score}
                  onChange={e => setCreateFormData({ ...createFormData, competency_score: e.target.value })}
                  disabled={isReadOnly}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed dark:border-white/10 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-800/50 dark:disabled:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Score (0-100)</label>
                <input
                  type="number" min="0" max="100" value={createFormData.score}
                  onChange={e => setCreateFormData({ ...createFormData, score: Number(e.target.value) })}
                  disabled={isReadOnly}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed dark:border-white/10 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-800/50 dark:disabled:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Feedback</label>
                <textarea
                  value={createFormData.feedback}
                  onChange={e => setCreateFormData({ ...createFormData, feedback: e.target.value })}
                  disabled={isReadOnly}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed dark:border-white/10 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-800/50 dark:disabled:text-gray-400"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCloseCreateModal}
                className="flex-1 rounded-lg border border-gray-300 py-2 font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-slate-800"
              >
                {isReadOnly ? 'Close' : 'Cancel'}
              </button>
              {!isReadOnly && (
                <button
                  onClick={handleCreateEvaluation}
                  className="flex-1 rounded-lg bg-primary py-2 font-semibold text-white hover:bg-primary/90"
                >
                  Create
                </button>
              )}
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
          >
            <div className="mb-4">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">Delete Evaluation</h3>
            </div>

            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to delete this evaluation? This action cannot be undone.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 rounded-lg border border-gray-300 py-2 font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-lg bg-red-500 py-2 font-semibold text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Evaluations;