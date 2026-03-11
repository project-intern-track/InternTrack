import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, ClipboardList, Search, Users, Edit, Trash, X } from 'lucide-react';
import type { Evaluation } from '../../types/database.types';
import { evaluationService } from '../../services/evaluationService';
import { authService } from '../../services/authService';
import { userService } from '../../services/userServices';

const Evaluations = () => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [internIdFilter, setInternIdFilter] = useState('');
  const [supervisorIdFilter, setSupervisorIdFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);
  const [formData, setFormData] = useState({
    task_completion: 0,
    competency_score: '',
    score: 0,
    feedback: '',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    intern_id: '',
    task_completion: 0,
    competency_score: '',
    score: 0,
    feedback: '',
  });
  const [allInterns, setAllInterns] = useState<any[]>([]); // For dropdowns

  useEffect(() => {
    // Get Supervisor Data for Auto-filling Supervisor ID in Create Form
    const fetchCurrentUser = async () => {
      try{
        const { session, error } = await authService.getSession();
        
        if (session?.user?.id) {
          setCurrentUser({id: session.user.id});
          
        } else {
          console.error('No user session found', error);

        }
      } catch (err: any) {
        console.error('Failed to fetch current user:', err);

      }
    };

    const fetchInterns = async () => {
      try { 
        // Get All Current Interns for Dropdowns (Create/Edit Forms)
        const params = {role: 'intern'}; // Adjusted so only Role = Intern will be given back

        const interns = await userService.fetchInterns(params);

        console.log("What did the API return?", interns);


        if (Array.isArray(interns)) {
          setAllInterns(interns);
        } else {
          console.warn("API did not return an array. Check the structure:", interns);
          setAllInterns([]);
        }
      } catch (err: any) {
        console.error('Failed to fetch interns:', err);
      };
    };

    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        const data = await evaluationService.getEvaluations();
        console.log('Fetched Evaluations:', data);
        setEvaluations(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch evaluations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInterns();
    fetchCurrentUser();
    fetchEvaluations();
  }, []);



  const uniqueInternIds = Array.from(new Set(evaluations.map(e => e.intern_id).filter(Boolean)));
  const uniqueSupervisorIds = Array.from(new Set(evaluations.map(e => e.supervisor_id).filter(Boolean)));

  const filteredEvaluations = evaluations.filter(e => {
    return (
      (String(e.intern_id).toLowerCase().includes(searchTerm.toLowerCase()) || 
      String(e.supervisor_id).toLowerCase().includes(searchTerm.toLowerCase())) &&
      (internIdFilter ? Number(e.intern_id) === Number(internIdFilter) : true) &&
      (supervisorIdFilter ? Number(e.supervisor_id) === Number(supervisorIdFilter) : true)
    );
  });

  const totalEvaluated = evaluations.length;
  const averageScore = evaluations.length > 0
    ? Math.round(evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length)
    : 0;
  const excellentCount = evaluations.filter(e => e.score >= 80).length;

  const handleCreateEvaluation = async () => {
    if (!currentUser) return;

    try {
      const payload = {
        intern_id: Number(createFormData.intern_id), // Needed to link the intern
        supervisor_id: Number(currentUser.id),       // Needed to link the supervisor
        task_completion: Number(createFormData.task_completion),
        competency_score: String(createFormData.competency_score),
        score: Number(createFormData.score),
        feedback: String(createFormData.feedback),
        evaluation_date: new Date().toISOString().split('T')[0],
        intern_name: `Intern ${createFormData.intern_id}`, 
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
    setCreateFormData({
      intern_id: '',
      task_completion: 0,
      competency_score: '',
      score: 0,
      feedback: '',
    });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this evaluation?')) {
      try {
        await evaluationService.deleteEvaluation(String(id));
        setEvaluations(evaluations.filter(evaluation => Number(evaluation.id) !== Number(id)));
      } catch (err: any) {
        console.error('Delete failed:', err);
      }
    }
  };

  const handleEdit = (evaluation: Evaluation) => {
    setEditingEvaluation(evaluation);
    setFormData({
      task_completion: evaluation.task_completion || 0,
      competency_score: evaluation.competency_score || '',
      score: evaluation.score,
      feedback: evaluation.feedback || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingEvaluation) return;

    try {
      await evaluationService.updateEvaluation(String(editingEvaluation.id), formData);
      setEvaluations(evaluations.map(e => 
        e.id === editingEvaluation.id 
          ? { ...e, ...formData }
          : e
      ));
      setShowModal(false);
      setEditingEvaluation(null);
    } catch (err: any) {
      console.error('Update failed:', err);
      alert('Failed to update evaluation');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEvaluation(null);
  };

  const summaryCards = [
    {
      label: 'Total Evaluated',
      value: totalEvaluated,
      icon: Users,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
    },
    {
      label: 'Average Score',
      value: averageScore,
      icon: ClipboardList,
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-500/10',
    },
    {
      label: 'Excellent Performers',
      value: excellentCount,
      icon: BarChart,
      iconColor: 'text-green-500',
      iconBg: 'bg-green-500/10',
    },
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
        <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Evaluations</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage evaluations for interns here.</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {summaryCards.map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
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
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <div className="relative md:col-span-2">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="relative md:col-span-2">
            <Users size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={internIdFilter}
              onChange={e => setInternIdFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            >
              <option value="">All Interns</option>
              {uniqueInternIds.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>

          <div className="relative md:col-span-2">
            <ClipboardList size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={supervisorIdFilter}
              onChange={e => setSupervisorIdFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            >
              <option value="">All Supervisors</option>
              {uniqueSupervisorIds.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
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

        <div className="overflow-x-auto px-8 py-6">
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
              {filteredEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No evaluations found.
                  </td>
                </tr>
              ) : (
                filteredEvaluations.map((evaluation, idx) => (
                  <motion.tr
                    key={evaluation.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.04 }}
                    className="border-b border-gray-100 last:border-none dark:border-white/5"
                  >
                    <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-gray-100">{evaluation.intern_id}</td>
                    <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{evaluation.intern_name}</td>
                    <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-gray-100">{evaluation.score}/100</td>
                    <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{evaluation.evaluation_date}</td>
                    <td className="py-3 pr-4 text-gray-700 dark:text-gray-300 truncate max-w-xs">{evaluation.feedback || '-'}</td>
                    <td className="py-3 pr-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(evaluation)}
                        className="flex items-center gap-1 rounded-lg bg-blue-500/10 p-2 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400"
                      >
                        <Edit size={16} />
                      </button>
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
        </div>
      </motion.div>


      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">Create Evaluation</h3>
              <button
                onClick={handleCloseCreateModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Select Intern
                </label>
                  <select
                    value={createFormData.intern_id}
                    onChange={(e) => setCreateFormData({ ...createFormData, intern_id: e.target.value })}
                    className="your-tailwind-classes-here"
                  >
                    <option value="">Select an intern...</option>
                    {/* Mapping the state to options */}
                    {allInterns.map((intern) => (
                    <option key={intern.id} value={intern.id}>
                        {intern.full_name || intern.name}
                      </option>
                    ))}
                  </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Task Completion
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={createFormData.task_completion}
                  onChange={e => setCreateFormData({ ...createFormData, task_completion: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Competency Score
                </label>
                <input
                  type="text"
                  placeholder="e.g., 4.5/5"
                  value={createFormData.competency_score}
                  onChange={e => setCreateFormData({ ...createFormData, competency_score: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Score (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={createFormData.score}
                  onChange={e => setCreateFormData({ ...createFormData, score: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Feedback
                </label>
                <textarea
                  value={createFormData.feedback}
                  onChange={e => setCreateFormData({ ...createFormData, feedback: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCloseCreateModal}
                className="flex-1 rounded-lg border border-gray-300 py-2 font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvaluation}
                className="flex-1 rounded-lg bg-primary py-2 font-semibold text-white hover:bg-primary/90"
              >
                Create
              </button>
            </div>
          </motion.div>
        </div>
      )}

      

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">Edit Evaluation</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Task Completion
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.task_completion}
                  onChange={e => setFormData({ ...formData, task_completion: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Competency Score
                </label>
                <input
                  type="text"
                  placeholder="e.g., 4.5/5"
                  value={formData.competency_score}
                  onChange={e => setFormData({ ...formData, competency_score: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Score (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.score}
                  onChange={e => setFormData({ ...formData, score: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Feedback
                </label>
                <textarea
                  value={formData.feedback}
                  onChange={e => setFormData({ ...formData, feedback: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 rounded-lg border border-gray-300 py-2 font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 rounded-lg bg-primary py-2 font-semibold text-white hover:bg-primary/90"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Evaluations;