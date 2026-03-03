
import { motion } from 'framer-motion';

type Intern = {
  id: string;
  name: string;
  email: string;
  totalHours: number;
  tasksCompleted: number;
  attendancePercent: number;
  performanceStatus: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement';
};

// Sample static data
const interns: Intern[] = [
  { id: '1', name: 'Alice Tan', email: 'alice@example.com', totalHours: 120, tasksCompleted: 15, attendancePercent: 95, performanceStatus: 'Excellent' },
  { id: '2', name: 'Bob Cruz', email: 'bob@example.com', totalHours: 100, tasksCompleted: 12, attendancePercent: 90, performanceStatus: 'Good' },
  { id: '3', name: 'Jay Jay Tan', email: 'jayjay@example.com', totalHours: 85, tasksCompleted: 10, attendancePercent: 80, performanceStatus: 'Average' },
  { id: '4', name: 'Mia Lopez', email: 'mia@example.com', totalHours: 60, tasksCompleted: 5, attendancePercent: 70, performanceStatus: 'Needs Improvement' },
];

const InternPerformance = () => {
  return (
    <div className="max-w-[2000px] mx-auto p-4 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-primary mb-1">
            Intern Performance
          </h1>
          <p className="text-muted-foreground dark:text-gray-400">
            Overview of intern attendance, tasks, and performance metrics.
          </p>
        </div>
      </motion.div>

      {/* Performance Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-[2rem] shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Intern</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Total Hours</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tasks Completed</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Attendance %</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Performance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
              {interns.map((intern, index) => (
                <motion.tr
                  key={intern.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 dark:text-white">{intern.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{intern.email}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{intern.totalHours}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{intern.tasksCompleted}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{intern.attendancePercent}%</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold capitalize ${performanceColorClass(intern.performanceStatus)}`}>
                      {intern.performanceStatus}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

// Helper for performance status colors
const performanceColorClass = (status: Intern['performanceStatus']) => {
  switch (status) {
    case 'Excellent': return 'text-green-600 dark:text-green-400';
    case 'Good': return 'text-blue-600 dark:text-blue-400';
    case 'Average': return 'text-orange-600 dark:text-orange-400';
    case 'Needs Improvement': return 'text-red-600 dark:text-red-400';
  }
};

export default InternPerformance;
