import { Bell, ClipboardList } from 'lucide-react';
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

const formatRelativeTime = (isoDate: string): string => {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${minutes}m ago`;
};

const SupervisorAnnouncements = ({ type = 'company' }: { type?: 'company' | 'internship' }) => {
  const title = type === 'company' ? 'Company Notices' : 'Internship Reminders';
  const description =
    type === 'company'
      ? 'Post and manage company announcements for interns.'
      : 'Create and manage internship reminders and important dates.';

  const TypeIcon = type === 'company' ? Bell : ClipboardList;

  // Filter announcements by type
  const filteredAnnouncements = sampleAnnouncements.filter((a) => a.type === type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">{title}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </motion.div>

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.07, ease: 'easeOut' }}
          className="rounded-[2.5rem] border border-gray-200 bg-white p-6 sm:p-16 text-center shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5">
            <Bell className="text-gray-400 dark:text-gray-500" size={28} />
          </div>
          <p className="font-bold text-gray-500 dark:text-gray-400">No announcements found</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Check back later for updates.</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.07, ease: 'easeOut' }}
          className="rounded-[2.5rem] border border-gray-200 bg-white shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-slate-900/50 overflow-hidden"
        >
          <div className="flex items-center gap-3 border-b border-gray-200 px-4 sm:px-8 py-4 sm:py-6 dark:border-white/5">
            <TypeIcon className="text-primary" size={20} />
            <h2 className="text-xl font-black text-gray-800 dark:text-white">{title}</h2>
            <span className="ml-auto rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {filteredAnnouncements.length}
            </span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {filteredAnnouncements.map((a, index) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 + index * 0.04, ease: 'easeOut' }}
                className="px-4 sm:px-8 py-4 sm:py-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                    <Bell className="text-primary" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-black text-gray-900 dark:text-white">{a.title}</h3>
                      <span className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
                        {formatRelativeTime(a.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{a.content}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center">
                        <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase">
                          {a.created_by.full_name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{a.created_by.full_name}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SupervisorAnnouncements;
