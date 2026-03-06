import { motion } from 'framer-motion';
import { BarChart, ClipboardList, Star, Users } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

type PendingTask = {
  intern: string;
  task: string;
  due_date: string;
  status: 'excellent' | 'very good' | 'satisfactory' | 'needs improvement' | 'poor';
};

type PerformanceSummary = {
  excellent: number;
  veryGood: number;
  satisfactory: number;
  needsImprovement: number;
  poor: number;
};

// ============================
// Dummy Static Data
// ============================
const dummyTasks: PendingTask[] = [
  { intern: 'Juan Dela Cruz', task: 'Weekly Report', due_date: '2026-02-22', status: 'excellent' },
  { intern: 'Maria Santos', task: 'UI Prototype', due_date: '2026-02-23', status: 'very good' },
  { intern: 'Carlo Reyes', task: 'Database Schema', due_date: '2026-02-20', status: 'satisfactory' },
  { intern: 'Angela Lim', task: 'API Integration', due_date: '2026-02-21', status: 'needs improvement' },
  { intern: 'Carlo Reyes', task: 'Frontend Fixes', due_date: '2026-02-19', status: 'poor' },
  { intern: 'Juan Dela Cruz', task: 'Unit Testing', due_date: '2026-02-24', status: 'very good' },
  { intern: 'Angela Lim', task: 'Documentation', due_date: '2026-02-25', status: 'excellent' },
];

const summaryKeyToStatus: Record<keyof PerformanceSummary, PendingTask['status']> = {
  excellent: 'excellent',
  veryGood: 'very good',
  satisfactory: 'satisfactory',
  needsImprovement: 'needs improvement',
  poor: 'poor',
};

const statusStyles: Record<PendingTask['status'], { pill: string; soft: string; text: string }> = {
  excellent: {
    pill: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
    soft: 'bg-green-50 dark:bg-green-500/10',
    text: 'text-green-700 dark:text-green-300',
  },
  'very good': {
    pill: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
    soft: 'bg-cyan-50 dark:bg-cyan-500/10',
    text: 'text-cyan-700 dark:text-cyan-300',
  },
  satisfactory: {
    pill: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    soft: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-300',
  },
  'needs improvement': {
    pill: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
    soft: 'bg-orange-50 dark:bg-orange-500/10',
    text: 'text-orange-700 dark:text-orange-300',
  },
  poor: {
    pill: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    soft: 'bg-red-50 dark:bg-red-500/10',
    text: 'text-red-700 dark:text-red-300',
  },
};

const statusChartColors: Record<PendingTask['status'], string> = {
  excellent: 'hsl(var(--success))',
  'very good': 'hsl(var(--secondary))',
  satisfactory: 'hsl(var(--warning))',
  'needs improvement': 'hsl(var(--primary))',
  poor: 'hsl(var(--danger))',
};

// ============================
// Helper Functions
// ============================
const computeSummary = (tasks: PendingTask[]): PerformanceSummary => {
  const summary: PerformanceSummary = {
    excellent: 0,
    veryGood: 0,
    satisfactory: 0,
    needsImprovement: 0,
    poor: 0,
  };
  tasks.forEach(t => {
    switch (t.status) {
      case 'excellent':
        summary.excellent++;
        break;
      case 'very good':
        summary.veryGood++;
        break;
      case 'satisfactory':
        summary.satisfactory++;
        break;
      case 'needs improvement':
        summary.needsImprovement++;
        break;
      case 'poor':
        summary.poor++;
        break;
    }
  });
  return summary;
};

// Compute top performing intern and score out of 100
const computeTopIntern = (tasks: PendingTask[]): { name: string; score: number } => {
  const internScores: Record<string, number[]> = {};
  tasks.forEach(t => {
    if (!internScores[t.intern]) internScores[t.intern] = [];
    // Count excellent & very good as 100 points, satisfactory 75, needs improvement 50, poor 25
    let points = 0;
    switch (t.status) {
      case 'excellent':
        points = 100;
        break;
      case 'very good':
        points = 85;
        break;
      case 'satisfactory':
        points = 70;
        break;
      case 'needs improvement':
        points = 50;
        break;
      case 'poor':
        points = 25;
        break;
    }
    internScores[t.intern].push(points);
  });

  let bestName = 'N/A';
  let bestScore = 0;

  Object.entries(internScores).forEach(([name, scores]) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg > bestScore) {
      bestScore = avg;
      bestName = name;
    }
  });

  return { name: bestName, score: Math.round(bestScore) };
};

// ============================
// Main Component
// ============================
const SupervisorDashboard = () => {
  const supervisorName = 'Test Supervisor';

  const pendingTasks = dummyTasks;
  const summary = computeSummary(dummyTasks);
  const topInternData = computeTopIntern(dummyTasks);

  const total = Object.values(summary).reduce((acc, v) => acc + v, 0);

  const pieData = [
    { name: 'Excellent', value: summary.excellent },
    { name: 'Very Good', value: summary.veryGood },
    { name: 'Satisfactory', value: summary.satisfactory },
    { name: 'Needs Improvement', value: summary.needsImprovement },
    { name: 'Poor', value: summary.poor },
  ];

  const summaryRows = Object.entries(summary) as [keyof PerformanceSummary, number][];

  const formatDueDate = (isoDate: string) => new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            Welcome back, {supervisorName}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Supervisor Dashboard Overview</p>
        </div>
        <div className="hidden rounded-xl border border-gray-200 bg-white px-4 py-2 text-right shadow-sm dark:border-white/5 dark:bg-slate-900/50 md:block">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Top Intern</p>
          <p className="text-sm font-bold text-primary">{topInternData.name} ({topInternData.score}/100)</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            label: 'Pending Tasks',
            value: pendingTasks.length,
            icon: ClipboardList,
            iconColor: 'text-orange-500',
            iconBg: 'bg-orange-500/10',
          },
          {
            label: 'Unique Interns',
            value: new Set(pendingTasks.map(task => task.intern)).size,
            icon: Users,
            iconColor: 'text-blue-500',
            iconBg: 'bg-blue-500/10',
          },
          {
            label: 'Top Score',
            value: topInternData.score,
            icon: Star,
            iconColor: 'text-green-500',
            iconBg: 'bg-green-500/10',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * index, duration: 0.35 }}
            className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50"
          >
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${stat.iconBg}`}>
              <stat.icon className={stat.iconColor} size={24} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className="mt-2 text-4xl font-black text-gray-900 dark:text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-[2.5rem] border border-gray-200 bg-white shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50 lg:col-span-2"
        >
          <div className="flex items-center gap-3 border-b border-gray-200 px-8 py-6 dark:border-white/5">
            <ClipboardList className="text-primary" size={20} />
            <h2 className="text-xl font-black text-gray-800 dark:text-white">Pending Tasks</h2>
          </div>
          <div className="overflow-x-auto px-8 py-6">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/5">
                  <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Intern</th>
                  <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Task</th>
                  <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Due Date</th>
                  <th className="pb-3 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingTasks.map((task, index) => (
                  <motion.tr
                    key={`${task.intern}-${task.task}-${task.due_date}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * index, duration: 0.25 }}
                    className="border-b border-gray-100 last:border-none dark:border-white/5"
                  >
                    <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-gray-100">{task.intern}</td>
                    <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{task.task}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{formatDueDate(task.due_date)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyles[task.status].pill}`}>
                        {task.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
          className="rounded-[2.5rem] border border-gray-200 bg-white p-8 shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50"
        >
          <div className="mb-5 flex items-center gap-3">
            <Star className="text-primary" size={20} />
            <h2 className="text-xl font-black text-gray-800 dark:text-white">Top Performing Intern</h2>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/5 dark:bg-white/5">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Intern Name</p>
            <p className="mt-1 text-xl font-black text-gray-900 dark:text-white">{topInternData.name}</p>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-primary px-4 py-3 text-primary-foreground">
              <p className="text-sm font-bold">Performance Score</p>
              <p className="text-lg font-black">{topInternData.score}/100</p>
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Quick Insight</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Strong momentum in the top tier with consistent Excellent and Very Good ratings.
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2 }}
        className="rounded-[2.5rem] border border-gray-200 bg-white p-8 shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50"
      >
        <div className="mb-6 flex items-center gap-3">
          <BarChart className="text-primary" size={20} />
          <h2 className="text-xl font-black text-gray-800 dark:text-white">Overall Performance Distribution</h2>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={({ value }) => {
                    if (!value || total === 0) return '0%';
                    return `${((value / total) * 100).toFixed(0)}%`;
                  }}
                  labelLine={false}
                >
                  {pieData.map((entry) => {
                    const status = summaryKeyToStatus[
                      entry.name === 'Very Good'
                        ? 'veryGood'
                        : entry.name === 'Needs Improvement'
                          ? 'needsImprovement'
                          : entry.name.toLowerCase() as keyof PerformanceSummary
                    ];
                    return <Cell key={entry.name} fill={statusChartColors[status]} />;
                  })}
                </Pie>
                <Tooltip
                  formatter={(value: number | undefined) => {
                    if (total === 0 || value === undefined) return ['0%', 'Share'];
                    return [`${((value / total) * 100).toFixed(0)}%`, 'Share'];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2">
              <Users className="text-primary" size={16} />
              <h3 className="text-base font-black text-gray-800 dark:text-white">Performance Summary</h3>
            </div>
            {summaryRows.map(([key, value], index) => {
              const status = summaryKeyToStatus[key];
              const percent = total === 0 ? 0 : Math.round((value / total) * 100);
              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index, duration: 0.25 }}
                  className={`rounded-xl border border-gray-200 px-4 py-3 dark:border-white/5 ${statusStyles[status].soft}`}
                >
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-bold ${statusStyles[status].text}`}>{label}</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white">{value} ({percent}%)</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SupervisorDashboard;