import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, ClipboardList, Search, Users } from 'lucide-react';

export type Evaluation = {
  id: string;
  name: string;
  role: string;
  taskCompletion: number; 
  competencyScore: string; 
  overall: number;
  remarks: string;
};

const sampleEvaluations: Evaluation[] = [
  { id: '1', name: 'John Doe', role: 'Intern', taskCompletion: 8, competencyScore: '4.5/5 (95%)', overall: 95, remarks: 'Good work' },
  { id: '2', name: 'Jane Smith', role: 'Intern', taskCompletion: 6, competencyScore: '4.0/5 (90%)', overall: 90, remarks: 'Needs improvement on deadlines' },
  { id: '3', name: 'Mark Lee', role: 'Assistant', taskCompletion: 7, competencyScore: '4.2/5 (92%)', overall: 92, remarks: 'Well done' },
];

const Evaluations = () => {
  const [evaluations] = useState<Evaluation[]>(sampleEvaluations);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [remarksFilter, setRemarksFilter] = useState('');

  const uniqueRemarks = Array.from(new Set(evaluations.map(e => e.remarks)));

  const filteredEvaluations = evaluations.filter(e => {
    return (
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (roleFilter ? e.role === roleFilter : true) &&
      (remarksFilter ? e.remarks === remarksFilter : true)
    );
  });

  // Calculations
  const totalEvaluated = evaluations.length;
  const averageCompletion = evaluations.length > 0
    ? Math.round(evaluations.reduce((sum, e) => sum + e.taskCompletion, 0) / evaluations.length)
    : 0;
  const improvementTrend = totalEvaluated; // number of evaluated tasks

  const summaryCards = [
    {
      label: 'Total Interns Evaluated',
      value: totalEvaluated,
      icon: Users,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
    },
    {
      label: 'Average Task Completion',
      value: averageCompletion,
      icon: ClipboardList,
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-500/10',
    },
    {
      label: 'Improvement Trend',
      value: improvementTrend,
      icon: BarChart,
      iconColor: 'text-green-500',
      iconBg: 'bg-green-500/10',
    },
  ];

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
              placeholder="Search by name"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="relative md:col-span-2">
            <ClipboardList size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            >
              <option value="">All Roles</option>
              <option value="Intern">Intern</option>
              <option value="Assistant">Assistant</option>
            </select>
          </div>

          <div className="relative md:col-span-2">
            <BarChart size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={remarksFilter}
              onChange={e => setRemarksFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            >
              <option value="">All Remarks</option>
              {uniqueRemarks.map((remark) => (
                <option key={remark} value={remark}>{remark}</option>
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
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Name</th>
                <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Role</th>
                <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Task Completion</th>
                <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Competency Score</th>
                <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Overall (%)</th>
                <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Remarks</th>
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
                    <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-gray-100">{evaluation.name}</td>
                    <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{evaluation.role}</td>
                    <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{evaluation.taskCompletion}</td>
                    <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{evaluation.competencyScore}</td>
                    <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-gray-100">{evaluation.overall}%</td>
                    <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{evaluation.remarks}</td>
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