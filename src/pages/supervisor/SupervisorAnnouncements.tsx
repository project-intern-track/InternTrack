import { Bell } from 'lucide-react';
import { motion } from 'framer-motion';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'company' | 'internship';
  created_at: string;
  created_by: {
    full_name: string;
    email: string;
  };
}

// Sample static announcements
const sampleAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Office Closed on Feb 25',
    content: 'The office will be closed for maintenance. Please plan accordingly.',
    type: 'company',
    created_at: '2026-02-18T09:00:00',
    created_by: { full_name: 'Admin', email: 'admin@example.com' },
  },
  {
    id: '2',
    title: 'Submit Weekly Reports',
    content: 'All interns must submit their weekly reports by Friday 5 PM.',
    type: 'internship',
    created_at: '2026-02-17T16:30:00',
    created_by: { full_name: 'Supervisor', email: 'supervisor@example.com' },
  },
  {
    id: '3',
    title: 'Team Meeting',
    content: 'Mandatory team meeting on Feb 20 at 10 AM via Zoom.',
    type: 'company',
    created_at: '2026-02-16T14:00:00',
    created_by: { full_name: 'HR', email: 'hr@example.com' },
  },
];

const SupervisorAnnouncements = ({ type = 'company' }: { type?: 'company' | 'internship' }) => {
  const title = type === 'company' ? 'Company Notices' : 'Internship Reminders';
  const description =
    type === 'company'
      ? 'Post and manage company announcements for interns.'
      : 'Create and manage internship reminders and important dates.';

  // Filter announcements by type
  const filteredAnnouncements = sampleAnnouncements.filter((a) => a.type === type);

  return (
    <div className="max-w-[2000px] mx-auto p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <Bell size={32} className="text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-1">{description}</p>
        </div>
      </motion.div>

      {filteredAnnouncements.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-[2rem] p-8 text-center shadow-sm"
        >
          <p className="text-gray-500 dark:text-gray-400">No announcements found.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((a, index) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{a.title}</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">{a.content}</p>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                By {a.created_by.full_name} — {new Date(a.created_at).toLocaleString()}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupervisorAnnouncements;
