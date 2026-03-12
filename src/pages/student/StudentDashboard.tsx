import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  CheckCircle,
  Clock,
  Megaphone,
  Calendar,
  FileText,
  X,
  Target,
  CalendarDays,
  ListTodo,
  Star,
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

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const progressPercent = Math.min(1, stats.hoursLogged / stats.targetHours);
  const RING_R = 52;
  const RING_C = 2 * Math.PI * RING_R;
  const strokeOffset = RING_C * (1 - progressPercent);
  const hoursRemaining = Math.max(0, stats.targetHours - stats.hoursLogged);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 md:p-6 lg:p-8 space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
          {getGreeting()},{" "}
          <span className="text-primary">{user?.name?.split(" ")[0]}</span> 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {today} · Internship Overview
        </p>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-3 space-y-5">
          {/* Stats 2×2 Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Tasks Completed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              whileHover={{ y: -3 }}
              className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-xl">
                  <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/20 px-2 py-0.5 rounded-full">
                  Done
                </span>
              </div>
              <motion.p
                key={stats.tasksCompleted}
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                className="text-4xl font-black text-gray-900 dark:text-white"
              >
                {stats.tasksCompleted}
              </motion.p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold uppercase tracking-wider">
                Tasks Completed
              </p>
            </motion.div>

            {/* Hours Logged */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -3 }}
              className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-xl">
                  <Clock className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 px-2 py-0.5 rounded-full">
                  hrs
                </span>
              </div>
              <motion.p
                key={stats.hoursLogged}
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                className="text-4xl font-black text-gray-900 dark:text-white"
              >
                {stats.hoursLogged}
              </motion.p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold uppercase tracking-wider">
                Hours Logged
              </p>
            </motion.div>

            {/* Required Hours */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              whileHover={{ y: -3 }}
              className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-xl">
                  <Target className="text-primary" size={20} />
                </div>
                <span className="text-xs font-semibold text-primary bg-orange-100 dark:bg-orange-500/20 px-2 py-0.5 rounded-full">
                  Target
                </span>
              </div>
              <motion.p
                key={stats.targetHours}
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                className="text-4xl font-black text-gray-900 dark:text-white"
              >
                {stats.targetHours}
              </motion.p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold uppercase tracking-wider">
                Required Hours
              </p>
            </motion.div>

            {/* Days Remaining */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -3 }}
              className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-xl">
                  <CalendarDays className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20 px-2 py-0.5 rounded-full">
                  Left
                </span>
              </div>
              <motion.p
                key={stats.daysRemaining}
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                className="text-4xl font-black text-gray-900 dark:text-white"
              >
                {stats.daysRemaining}
              </motion.p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold uppercase tracking-wider">
                Days Remaining
              </p>
            </motion.div>
          </div>

          {/* OJT Progress Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  OJT Hours Progress
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.hoursLogged} of {stats.targetHours} hours completed
                </p>
              </div>
              <span
                className={`text-sm font-bold px-3 py-1 rounded-full ${
                  progressPercent >= 1
                    ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                    : progressPercent >= 0.5
                    ? "bg-orange-100 text-primary dark:bg-orange-500/20"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400"
                }`}
              >
                {Math.round(progressPercent * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-6">
              {/* Donut ring */}
              <div className="relative w-[120px] h-[120px] flex-shrink-0">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  {/* Track */}
                  <circle
                    cx="60" cy="60" r={RING_R}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-gray-100 dark:text-slate-700"
                  />
                  {/* Progress */}
                  <circle
                    cx="60" cy="60" r={RING_R}
                    fill="none"
                    stroke="#FF8800"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={RING_C}
                    strokeDashoffset={strokeOffset}
                    transform="rotate(-90 60 60)"
                    style={{ transition: "stroke-dashoffset 1.2s ease-in-out" }}
                  />
                </svg>
                {/* Centered overlay text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-black text-gray-900 dark:text-white leading-none">
                    {Math.round(progressPercent * 100)}%
                  </span>
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
                    completed
                  </span>
                </div>
              </div>

              {/* Progress bars breakdown */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600 dark:text-gray-400">Logged so far</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {stats.hoursLogged}h
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent * 100}%` }}
                      transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600 dark:text-gray-400">Remaining</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {hoursRemaining.toFixed(1)}h
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(1 - progressPercent) * 100}%` }}
                      transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                      className="h-full bg-gray-300 dark:bg-slate-600 rounded-full"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500">
                  At 8 hrs/day · ~{stats.daysRemaining} working days remaining
                </p>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              {
                label: "Log Time",
                icon: Clock,
                to: "/intern/logs",
                iconCls: "text-blue-600 dark:text-blue-400",
                bgCls: "bg-blue-100 dark:bg-blue-500/20",
              },
              {
                label: "My Tasks",
                icon: ListTodo,
                to: "/intern/tasks",
                iconCls: "text-primary",
                bgCls: "bg-orange-100 dark:bg-orange-500/20",
              },
              {
                label: "Feedback",
                icon: Star,
                to: "/intern/feedback",
                iconCls: "text-purple-600 dark:text-purple-400",
                bgCls: "bg-purple-100 dark:bg-purple-500/20",
              },
            ].map((action) => {
              const ActionIcon = action.icon;
              return (
                <Link key={action.to} to={action.to}>
                  <motion.div
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-xl p-4 flex flex-col items-center gap-2 text-center cursor-pointer shadow-sm hover:shadow-md transition-all"
                  >
                    <div className={`p-2.5 rounded-xl ${action.bgCls}`}>
                      <ActionIcon size={20} className={action.iconCls} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {action.label}
                    </span>
                  </motion.div>
                </Link>
              );
            })}
          </motion.div>
        </div>

        {/* ── RIGHT COLUMN: Announcements ── */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm flex flex-col"
            style={{ minHeight: 400 }}
          >
            {/* Card Header */}
            <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-white/5 flex-shrink-0">
              <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-xl">
                <Megaphone className="text-primary" size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Announcements
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {announcements.length} update{announcements.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1" style={{ maxHeight: 520 }}>
              {announcements.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 p-6 text-center">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-3">
                    <Megaphone className="text-gray-400" size={22} />
                  </div>
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    No announcements yet
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Check back later for updates
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {announcements.map((announcement, index) => {
                    const styles = getPriorityStyles(announcement.priority);
                    return (
                      <motion.button
                        key={announcement.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        onClick={() => setSelectedAnnouncement(announcement)}
                        className={`w-full text-left p-4 transition-all hover:bg-gray-50 dark:hover:bg-slate-800/50 border-l-[3px] ${styles.border}`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${styles.bg}`}
                          >
                            <div className={styles.icon}>
                              {getAnnouncementIcon(announcement.priority)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                {getAnnouncementTypeLabel(announcement.priority)}
                              </span>
                              {index < 2 && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-primary rounded-full">
                                  NEW
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 truncate">
                              {announcement.title}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                              {announcement.content}
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1">
                              <Calendar size={10} />
                              {formatDateTime(announcement.created_at)}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Announcement Detail Modal ── */}
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
            className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/5 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-white/5 p-6 flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`p-3 rounded-xl flex-shrink-0 ${
                    getPriorityStyles(selectedAnnouncement.priority).bg
                  }`}
                >
                  <div className={getPriorityStyles(selectedAnnouncement.priority).icon}>
                    {getAnnouncementIcon(selectedAnnouncement.priority)}
                  </div>
                </motion.div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-1">
                    {getAnnouncementTypeLabel(selectedAnnouncement.priority)}
                  </p>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">
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

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-base leading-relaxed">
                {selectedAnnouncement.content}
              </p>

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

              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 flex items-center gap-3">
                <Calendar className="text-gray-500 dark:text-gray-400 flex-shrink-0" size={18} />
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
            <div className="bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-white/5 p-5 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
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
