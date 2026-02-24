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
// import { Loader2 } from "lucide-react";

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
    switch (p) {
      case 'high': return 'bg-red-500'; // Red
      case 'medium': return 'bg-yellow-500'; // Yellow
      case 'low': return 'bg-blue-500'; // Blue
      default: return 'bg-gray-400';
    }
  };

  const getPriorityLabel = (p: string) => {
    return p.charAt(0).toUpperCase() + p.slice(1) + " Priority";
  };

  // This guard removes zero flash while data are being fetched when restarting the website
  if (!stats) return null;

  return (
    <div className="p-[30px] bg-[#f5f6f8] min-h-screen">
      <div className="mb-[25px]">
        <h2 className="text-[#ff7a00] font-bold text-2xl">Welcome back, Intern {user?.name}!</h2>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[20px] mt-[20px]">
        {/* Card 1 */}
        <div className="bg-[#e9e6e1] px-[25px] pt-[25px] pb-[15px] rounded-[14px] relative min-h-[140px] transition-all duration-[250ms] ease-in-out shadow-[-2px_4px_8px_-4px_rgba(0,0,0,0.25)] cursor-pointer hover:-translate-y-[2px] hover:shadow-[0px_14px_28px_-6px_rgba(0,0,0,0.35)]">
          <FaCheckCircle className="absolute top-[20px] right-[20px] text-[20px] opacity-90 text-green-500" />
          <p className="text-[#444] font-medium mb-[10px]">Tasks Completed</p>
          <h1 className="text-[56px] font-bold m-0 leading-none">{stats.tasksCompleted}</h1>
          <span className="text-[#22c55e] text-[18px] block mt-2.5">Current Status</span>
        </div>

        {/* Card 2 */}
        <div className="bg-[#e9e6e1] px-[25px] pt-[25px] pb-[15px] rounded-[14px] relative min-h-[140px] transition-all duration-[250ms] ease-in-out shadow-[-2px_4px_8px_-4px_rgba(0,0,0,0.25)] cursor-pointer hover:-translate-y-[2px] hover:shadow-[0px_14px_28px_-6px_rgba(0,0,0,0.35)]">
          <FiClock className="absolute top-[20px] right-[20px] text-[20px] opacity-90 text-blue-500" />
          <p className="text-[#444] font-medium mb-[10px]">Hours Logged</p>
          <div className="flex items-baseline gap-[6px]">
            <h1 className="text-[56px] font-bold m-0 leading-none">{stats.hoursLogged}</h1>
            <span className="text-[20px] font-semibold">hrs</span>
          </div>
          <span className="text-[18px] text-[#888] block mt-[10px]">Target: {stats.targetHours}h</span>
        </div>

        {/* Card 3 */}
        <div className="bg-[#e9e6e1] px-[25px] pt-[25px] pb-[15px] rounded-[14px] relative min-h-[140px] transition-all duration-[250ms] ease-in-out shadow-[-2px_4px_8px_-4px_rgba(0,0,0,0.25)] cursor-pointer hover:-translate-y-[2px] hover:shadow-[0px_14px_28px_-6px_rgba(0,0,0,0.35)]">
          <BsHourglassSplit className="absolute top-[20px] right-[20px] text-[20px] opacity-90 text-orange-500" />
          <p className="text-[#444] font-medium mb-[10px]">Internship Days</p>
          <h1 className="text-[56px] font-bold m-0 leading-none">{stats.daysRemaining}</h1>
          <span className="text-[18px] text-[#888] block mt-[10px]">Days Remaining</span>
        </div>
      </div>

      <div className="mt-[40px]">
        <h3 className="text-[#ff7a00] mb-[20px] text-[1.5rem] font-bold">Announcements</h3>

        <div className="bg-[#e9e6e1] h-[80vh] rounded-[14px] p-[20px] text-[#666] shadow-[-2px_4px_8px_-4px_rgba(0,0,0,0.25)] overflow-y-auto flex flex-col gap-[1rem]">
          {announcements.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              No new announcements.
            </div>
          ) : (
            announcements.map((announcement) => (
              <div key={announcement.id} className="p-[1.5rem] flex flex-col bg-[#F9F7F4] rounded-[8px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] border border-[#e5e5e5] shrink-0">
                <div className="mb-[1rem]">
                  <h3 className="m-0 text-[1.1rem] font-bold text-[#1f2937]">
                    {announcement.title}
                  </h3>
                </div>
                <div className="mb-[1rem]">
                  <p className="m-0 text-[#4b5563] leading-[1.5] whitespace-pre-wrap">
                    {announcement.content}
                  </p>
                </div>
                <div className="flex justify-between items-center text-[0.875rem] text-[#6b7280] mt-auto">
                  <div className="flex gap-[0.5rem] items-center">
                    <span>Priority:</span>
                    <div className="flex items-center gap-[0.25rem]">
                      <div className={`w-[10px] h-[10px] rounded-full ${getPriorityColorClass(announcement.priority)}`} />
                      <span className="font-semibold text-[#111827]">
                        {getPriorityLabel(announcement.priority)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-[0.5rem]">
                    <span>Date Created:</span>
                    <span className="font-semibold text-[#111827]">
                      {formatDate(announcement.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;