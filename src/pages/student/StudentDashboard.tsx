import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  CheckCircle,
  Clock,
  BarChart,
  Megaphone,
  Calendar,
  FileText,
  X,
} from "lucide-react";
import { announcementService } from "../../services/announcementService";
import { userService } from "../../services/userServices";
import { taskService } from "../../services/taskServices";
import { attendanceService } from "../../services/attendanceServices";
import type {
  Announcement,
  Tasks,
  Users,
} from "../../types/database.types";
import PageLoader from "../../components/PageLoader";

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);

  const [stats, setStats] = useState<{
    tasksCompleted: number;
    hoursLogged: number;
    targetHours: number;
    daysRemaining: number;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        // Parallel fetching
        const [announcementsData, profileData, tasksData, attendanceStats] =
          await Promise.all([
            announcementService.getAnnouncements(),
            userService.getProfile(user.id),
            taskService.getMyTasks(),
            attendanceService.getStats(),  // pre-aggregated from backend ✅
          ]);

        // Process Announcements
        const sortedAnnouncements = (announcementsData || []).sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        setAnnouncements(sortedAnnouncements);

        // Process Stats
        const profile = profileData as Users;
        const targetHours = profile.required_hours || 400;

        // Tasks Stats (intern's assigned tasks from Laravel)
        const myTasks = (tasksData as Tasks[]) || [];
        const tasksCompleted = myTasks.filter(
          (t) => t.status === "completed",
        ).length;

        // Attendance Stats from backend aggregation
        const hoursLogged = attendanceStats?.total_hours ?? 0;

        // Days Remaining (Assuming 8 hours per day)
        const hoursRemaining = Math.max(0, targetHours - hoursLogged);
        const daysRemaining = Math.ceil(hoursRemaining / 8);

        setStats({
          tasksCompleted: tasksCompleted || 0,
          hoursLogged: Math.round(hoursLogged * 10) / 10,
          targetHours,
          daysRemaining,
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        // still set stats with zeros so page renders
        setStats({ tasksCompleted: 0, hoursLogged: 0, targetHours: 400, daysRemaining: 50 });
      }
    };

    fetchData();
  }, [user?.id]);

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "high":
        return {
          bg: "bg-red-50 dark:bg-red-500/10",
          border: "border-l-red-600",
          icon: "text-red-600 dark:text-red-400",
          badge: "bg-red-600",
        };
      case "medium":
        return {
          bg: "bg-amber-50 dark:bg-amber-500/10",
          border: "border-l-amber-600",
          icon: "text-amber-600 dark:text-amber-400",
          badge: "bg-amber-600",
        };
      case "low":
        return {
          bg: "bg-blue-50 dark:bg-blue-500/10",
          border: "border-l-blue-600",
          icon: "text-blue-600 dark:text-blue-400",
          badge: "bg-blue-600",
        };
      default:
        return {
          bg: "bg-gray-50 dark:bg-gray-500/10",
          border: "border-l-gray-600",
          icon: "text-gray-600 dark:text-gray-400",
          badge: "bg-gray-600",
        };
    }
  };

  const getAnnouncementTypeLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Reminder";
      case "medium":
        return "Announcement";
      case "low":
        return "Deadline";
      default:
        return "Announcement";
    }
  };

  const getAnnouncementIcon = (priority: string) => {
    switch (priority) {
      case "high":
      case "medium":
        return <Megaphone size={16} />;
      case "low":
        return <FileText size={16} />;
      default:
        return <Megaphone size={16} />;
    }
  };

  // Show loading spinner while data is being fetched
  if (!stats) return <PageLoader message="Loading dashboard..." />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 md:p-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-black text-gray-900 dark:text-white">
          Welcome back, <span className="text-primary">{user?.name}</span>!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Here's your internship progress at a glance
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Tasks Completed Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-sm backdrop-blur-md"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Tasks Completed
              </p>
              <motion.p
                key={stats.tasksCompleted}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-5xl font-black text-gray-900 dark:text-white mt-2"
              >
                {stats.tasksCompleted}
              </motion.p>
            </div>
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="p-3 bg-green-100 dark:bg-green-500/20 rounded-2xl"
            >
              <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
            </motion.div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Current status</p>
        </motion.div>

        {/* Hours Logged Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-sm backdrop-blur-md"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Hours Logged
              </p>
              <motion.div
                key={stats.hoursLogged}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex items-baseline gap-2 mt-2"
              >
                <p className="text-5xl font-black text-gray-900 dark:text-white">
                  {stats.hoursLogged}
                </p>
                <span className="text-xl font-bold text-gray-500 dark:text-gray-400">hrs</span>
              </motion.div>
            </div>
            <motion.div
              whileHover={{ rotate: -10, scale: 1.1 }}
              className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-2xl"
            >
              <Clock className="text-blue-600 dark:text-blue-400" size={24} />
            </motion.div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Target: {stats.targetHours}h
          </p>
        </motion.div>

        {/* Days Remaining Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-sm backdrop-blur-md"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Internship Days
              </p>
              <motion.p
                key={stats.daysRemaining}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-5xl font-black text-gray-900 dark:text-white mt-2"
              >
                {stats.daysRemaining}
              </motion.p>
            </div>
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-2xl"
            >
              <BarChart className="text-orange-600 dark:text-orange-400" size={24} />
            </motion.div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Days remaining</p>
        </motion.div>
      </div>

      {/* Announcements Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/20 rounded-xl">
            <Megaphone className="text-primary" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              Announcements
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Latest updates and reminders
            </p>
          </div>
        </div>

        {/* Announcements List */}
        <div className="bg-white dark:bg-slate-900/50 rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-sm backdrop-blur-md overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            {announcements.length === 0 ? (
              <div className="flex items-center justify-center h-48 p-6">
                <p className="text-gray-500 dark:text-gray-400">
                  No announcements yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-white/5">
                {announcements.map((announcement, index) => {
                  const styles = getPriorityStyles(announcement.priority);
                  return (
                    <motion.button
                      key={announcement.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4 }}
                      onClick={() => setSelectedAnnouncement(announcement)}
                      className={`w-full text-left p-6 transition-all hover:bg-gray-50 dark:hover:bg-slate-800/50 border-l-4 ${styles.border}`}
                    >
                      <div className="flex items-start gap-4">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className={`p-3 rounded-xl flex-shrink-0 ${styles.bg}`}
                        >
                          <div className={styles.icon}>
                            {getAnnouncementIcon(announcement.priority)}
                          </div>
                        </motion.div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                              {getAnnouncementTypeLabel(announcement.priority)}
                            </span>
                            {index < 2 && (
                              <span className="px-2 py-1 text-xs font-bold text-white bg-primary rounded">
                                NEW
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 break-words">
                            {announcement.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
                            {announcement.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>{formatDateTime(announcement.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText size={14} />
                              <span>View Details</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Announcement Modal */}
      {selectedAnnouncement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedAnnouncement(null)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-white/5 p-6 flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`p-3 rounded-xl flex-shrink-0 ${getPriorityStyles(selectedAnnouncement.priority).bg}`}
                >
                  <div className={getPriorityStyles(selectedAnnouncement.priority).icon}>
                    {getAnnouncementIcon(selectedAnnouncement.priority)}
                  </div>
                </motion.div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-1">
                    {getAnnouncementTypeLabel(selectedAnnouncement.priority)}
                  </p>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                    {selectedAnnouncement.title}
                  </h2>
                </div>
              </div>
              <motion.button
                whileHover={{ rotate: 90 }}
                onClick={() => setSelectedAnnouncement(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg flex-shrink-0 transition-colors"
              >
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </motion.button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-base leading-relaxed">
                {selectedAnnouncement.content}
              </p>

              {/* Priority Info */}
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    getPriorityStyles(selectedAnnouncement.priority).badge
                  }`}
                />
                <div>
                  <p className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                    Priority Level
                  </p>
                  <p className="font-bold text-gray-900 dark:text-white capitalize">
                    {selectedAnnouncement.priority}
                  </p>
                </div>
              </div>

              {/* Posted Date */}
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 flex items-center gap-3">
                <Calendar className="text-gray-600 dark:text-gray-400" size={20} />
                <div>
                  <p className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                    Posted
                  </p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {formatDateTime(selectedAnnouncement.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-white/5 p-6 flex gap-3 justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedAnnouncement(null)}
                className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-orange-600 transition-colors"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default StudentDashboard;
