import { UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface AttendanceRecord {
  id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
  total_hours: number | null;
  user: {
    full_name: string;
    email: string;
  };
}

const sampleRecords: AttendanceRecord[] = [
  {
    id: '1',
    date: '2026-02-18',
    time_in: '2026-02-18T08:00:00',
    time_out: '2026-02-18T16:00:00',
    total_hours: 8,
    status: 'present',
    user: { full_name: 'Jay Jay Tan', email: 'jayjay@example.com' },
  },
  {
    id: '2',
    date: '2026-02-18',
    time_in: '2026-02-18T09:00:00',
    time_out: '2026-02-18T17:00:00',
    total_hours: 8,
    status: 'present',
    user: { full_name: 'Maria Cruz', email: 'maria@example.com' },
  },
  {
    id: '3',
    date: '2026-02-18',
    time_in: null,
    time_out: null,
    total_hours: null,
    status: 'absent',
    user: { full_name: 'John Doe', email: 'john@example.com' },
  },
];

const MonitorAttendance = () => {
  return (
    <div className="max-w-[2000px] mx-auto p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <UserCheck size={32} className="text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Monitor Attendance
          </h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-1">
            Track and manage intern attendance records.
          </p>
        </div>
      </motion.div>

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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Time In</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Time Out</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Hours</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
              {sampleRecords.map((record, index) => (
                <motion.tr
                  key={record.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 dark:text-white">{record.user.full_name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{record.user.email}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{record.date}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
                    {record.time_in ? new Date(record.time_in).toLocaleTimeString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
                    {record.time_out ? new Date(record.time_out).toLocaleTimeString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
                    {record.total_hours ?? '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      record.status === 'present' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                      {record.status}
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

export default MonitorAttendance;
