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

const statusBadgeStyles: Record<string, string> = {
  present: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  absent:  'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
};

const hoursColor = (hours: number | null): string => {
  if (hours === null) return 'text-gray-400 dark:text-gray-500';
  if (hours >= 8) return 'text-green-600 dark:text-green-400 font-bold';
  if (hours >= 4) return 'text-amber-600 dark:text-amber-400 font-bold';
  return 'text-red-600 dark:text-red-400 font-bold';
};

const MonitorAttendance = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
          Monitor Attendance
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Track and manage intern attendance records.
        </p>
      </motion.div>

      {/* Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.07, ease: 'easeOut' }}
        className="rounded-[2.5rem] border border-gray-200 bg-white shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50 overflow-hidden"
      >
        <div className="flex items-center gap-3 border-b border-gray-200 px-8 py-6 dark:border-white/5">
          <UserCheck className="text-primary" size={20} />
          <h2 className="text-xl font-black text-gray-800 dark:text-white">Attendance Records</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/5">
                <th className="px-8 pb-3 pt-5 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Intern</th>
                <th className="px-4 pb-3 pt-5 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-4 pb-3 pt-5 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Time In</th>
                <th className="px-4 pb-3 pt-5 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Time Out</th>
                <th className="px-4 pb-3 pt-5 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Hours</th>
                <th className="px-4 pb-3 pt-5 pr-8 font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {sampleRecords.map((record, index) => (
                <motion.tr
                  key={record.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.03 * index, ease: 'easeOut' }}
                  className="border-b border-gray-100 last:border-none hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="px-8 py-4">
                    <div className="font-semibold text-gray-900 dark:text-white">{record.user.full_name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{record.user.email}</div>
                  </td>
                  <td className="px-4 py-4 text-gray-700 dark:text-gray-300">{record.date}</td>
                  <td className="px-4 py-4 text-green-600 dark:text-green-400 font-medium">
                    {record.time_in ? new Date(record.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="px-4 py-4 text-red-500 dark:text-red-400 font-medium">
                    {record.time_out ? new Date(record.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className={`px-4 py-4 ${hoursColor(record.total_hours)}`}>
                    {record.total_hours !== null ? `${record.total_hours}h` : '—'}
                  </td>
                  <td className="px-4 py-4 pr-8">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${statusBadgeStyles[record.status] ?? 'bg-gray-100 text-gray-700'}`}>
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
