import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, ClipboardList, Search, Users, Edit, Trash } from 'lucide-react';
import type { Evaluation } from '../../types/database.types';
import { evaluationService } from '../../services/evaluationService';

const Evaluations = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [internIdFilter, setInternIdFilter] = useState('');
  const [supervisorIdFilter, setSupervisorIdFilter] = useState('');

  useEffect(() => {
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

    fetchEvaluations();
  }, []);

  const uniqueInternIds = Array.from(new Set(evaluations.map(e => e.intern_id).filter(Boolean)));
  const uniqueSupervisorIds = Array.from(new Set(evaluations.map(e => e.supervisor_id).filter(Boolean)));

  const filteredEvaluations = evaluations.filter(e => {
    return (
      (String(e.intern_id).toLowerCase().includes(searchTerm.toLowerCase()) || 
      String(e.supervisor_id).toLowerCase().includes(searchTerm.toLowerCase())) &&
      (internIdFilter ? e.intern_id === internIdFilter : true) &&
      (supervisorIdFilter ? e.supervisor_id === supervisorIdFilter : true)
    );
  });

  const totalEvaluated = evaluations.length;
  const averageScore = evaluations.length > 0
    ? Math.round(evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length)
    : 0;
  const excellentCount = evaluations.filter(e => e.score >= 80).length;

  const handleDelete = async (id: string) => { // Updated from number to string
    if (window.confirm('Are you sure you want to delete this evaluation?')) {
      try {
        await evaluationService.deleteEvaluation(id); 
        setEvaluations(evaluations.filter(evaluation => evaluation.id !== id));
      } catch (err: any) {
        console.error('Delete failed:', err);
      }
    }
  };

  const handleEdit = (evaluation: Evaluation) => {
    console.log('Edit:', evaluation);
    // TODO: Open edit modal or navigate to edit page
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
        <div className="flex items-center gap-3 border-b border-gray-200 px-8 py-6 dark:border-white/5">
          <ClipboardList className="text-primary" size={20} />
          <h2 className="text-xl font-black text-gray-800 dark:text-white">Evaluation Records</h2>
        </div>

        <div className="overflow-x-auto px-8 py-6">
          <table className="min-w-full w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Intern ID</th>
                <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Supervisor ID</th>
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
                    <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{evaluation.supervisor_id}</td>
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
                        onClick={() => handleDelete(evaluation.id)}
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
    </div>
  );
};

export default Evaluations;