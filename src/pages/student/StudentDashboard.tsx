import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { FaCheckCircle } from "react-icons/fa";
import { FiClock } from "react-icons/fi";
import { BsHourglassSplit } from "react-icons/bs";
import { announcementService } from "../../services/announcementService";
import { userService } from "../../services/userServices";
import { taskService } from "../../services/taskServices";
import { attendanceService } from "../../services/attendanceServices";
import type { Announcement, Tasks, Attendance, Users } from "../../types/database.types";
import { motion } from "framer-motion";

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // REMOVED: const [loading, setLoading] = useState(true);

  // Set Value can be number or null
  const [stats, setStats] = useState<{
    tasksCompleted: number,
    hoursLogged: number,
    targetHours: number,
    daysRemaining: number,
    } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        // Parallel fetching
        const [announcementsData, profileData, tasksData, attendanceData] = await Promise.all([
          announcementService.getAnnouncements(),
          userService.getProfile(user.id),
          taskService.getTasks(),
          attendanceService.getAttendance()
        ]);

        // Process Announcements
        const sortedAnnouncements = (announcementsData || []).sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setAnnouncements(sortedAnnouncements);

        // Process Stats
        const profile = profileData as Users;
        const targetHours = profile.required_hours || 400;

        // Tasks Stats (RLS filters tasks for this user)
        const myTasks = tasksData as Tasks[] || [];
        const tasksCompleted = myTasks.filter(t => t.status === 'done').length;

        // Attendance Stats (RLS filters attendance for this user)
        const myAttendance = attendanceData as Attendance[] || [];
        const hoursLogged = myAttendance.reduce((sum, record) => sum + (record.total_hours || 0), 0);

        // Days Remaining (Assuming 8 hours per day)
        const hoursRemaining = Math.max(0, targetHours - hoursLogged);
        const daysRemaining = Math.ceil(hoursRemaining / 8);

        setStats({
          tasksCompleted : tasksCompleted || 0,
          hoursLogged: Math.round(hoursLogged * 10) / 10, // Round to 1 decimal
          targetHours,
          daysRemaining
        });

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
      // REMOVED: finally { setLoading(false); }
    };

    fetchData();
  }, [user?.id]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getPriorityColorClass = (p: string) => {
    switch (p?.toLowerCase()) {
      case 'high': return 'bg-red-50 text-red-600 border border-red-100';
      case 'medium': return 'bg-orange-50 text-orange-600 border border-orange-100';
      case 'low': return 'bg-blue-50 text-blue-600 border border-blue-100';
      default: return 'bg-gray-50 text-gray-600 border border-gray-100';
    }
  };

  const getPriorityDotClass = (p: string) => {
    switch (p?.toLowerCase()) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (p: string) => {
    if (!p) return 'Unknown Priority';
    return p.charAt(0).toUpperCase() + p.slice(1) + " Priority";
  };

  // This guard removes zero flash while data are being fetched when restarting the website
  if (!stats) return null;

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen font-sans">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Welcome back, <span className="text-[#ff7a00]">Intern {user?.name}</span>!
        </h2>
        <p className="text-gray-500 mt-2 font-medium">Here's what's happening with your internship today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="bg-white p-6 rounded-2xl relative min-h-[160px] shadow-sm border border-gray-100 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center absolute top-6 right-6">
             <FaCheckCircle className="text-2xl" />
          </div>
          <p className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-3">Tasks Completed</p>
          <div className="flex items-end gap-2">
            <h1 className="text-5xl font-black text-gray-900 leading-none tracking-tight">{stats.tasksCompleted}</h1>
          </div>
          <span className="inline-flex items-center gap-1.5 text-green-600 font-bold text-xs mt-5 bg-green-50 px-2.5 py-1.5 rounded-md border border-green-100">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            CURRENT STATUS
          </span>
        </motion.div>

        {/* Card 2 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="bg-white p-6 rounded-2xl relative min-h-[160px] shadow-sm border border-gray-100 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center absolute top-6 right-6">
            <FiClock className="text-2xl" />
          </div>
          <p className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-3">Hours Logged</p>
          <div className="flex items-baseline gap-1.5">
            <h1 className="text-5xl font-black text-gray-900 leading-none tracking-tight">{stats.hoursLogged}</h1>
            <span className="text-xl font-bold text-gray-400">/ {stats.targetHours}h</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-6 overflow-hidden">
            <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${Math.min(100, (stats.hoursLogged / stats.targetHours) * 100)}%` }}
               transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
               className="bg-blue-500 h-1.5 rounded-full" 
            />
          </div>
        </motion.div>

        {/* Card 3 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="bg-white p-6 rounded-2xl relative min-h-[160px] shadow-sm border border-gray-100 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-orange-50 text-[#ff7a00] flex items-center justify-center absolute top-6 right-6">
            <BsHourglassSplit className="text-2xl" />
          </div>
          <p className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-3">Internship Days</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h1 className="text-5xl font-black text-gray-900 leading-none tracking-tight">{stats.daysRemaining}</h1>
            <span className="text-xl font-bold text-gray-400">Days</span>
          </div>
          <span className="text-gray-500 font-medium text-sm block mt-5">Remaining in term</span>
        </motion.div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Recent Announcements</h3>
        </div>

        <div className="bg-white max-h-[60vh] rounded-2xl p-6 shadow-sm border border-gray-100 overflow-y-auto flex flex-col gap-4">
          {announcements.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <span className="text-gray-400 text-3xl">📭</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No announcements yet</h3>
              <p className="text-gray-500 font-medium">There are currently no new announcements to display.</p>
            </div>
          ) : (
            announcements.map((announcement, index) => (
              <motion.div 
                key={announcement.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1, ease: "easeOut" }}
                className="p-5 flex flex-col bg-gray-50 hover:bg-gray-100/60 transition-colors rounded-xl border border-gray-100 shrink-0"
              >
                <div className="mb-3 flex justify-between items-start gap-4">
                  <h3 className="m-0 text-lg font-extrabold text-gray-900 leading-tight">
                    {announcement.title}
                  </h3>
                  <div className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 text-xs font-bold shadow-sm ${getPriorityColorClass(announcement.priority)}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${getPriorityDotClass(announcement.priority)}`} />
                    <span>{getPriorityLabel(announcement.priority)}</span>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="m-0 text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">
                    {announcement.content}
                  </p>
                </div>
                <div className="flex justify-between items-center text-xs mt-auto pt-4 border-t border-gray-200/60">
                  <span className="font-bold text-gray-400 uppercase tracking-wide">
                    Posted on {formatDate(announcement.created_at)}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;