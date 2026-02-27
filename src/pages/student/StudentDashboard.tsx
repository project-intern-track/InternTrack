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
import PageLoader from '../../components/PageLoader';

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
          taskService.getMyTasks(),
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

        // Tasks Stats (intern's assigned tasks from Laravel)
        const myTasks = tasksData as Tasks[] || [];
        const tasksCompleted = myTasks.filter(t => t.status === 'completed').length;

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

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return '#ef4444'; // Red
      case 'medium': return '#eab308'; // Yellow
      case 'low': return '#3b82f6'; // Blue
      default: return '#9ca3af';
    }
  };

  const getPriorityLabel = (p: string) => {
    return p.charAt(0).toUpperCase() + p.slice(1) + " Priority";
  };

  /* Track which card is hovered */
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const styles: Record<string, React.CSSProperties> = {
    container: {
      padding: "30px",
      background: "#f5f6f8",
      minHeight: "100vh",
    },

    header: {
      marginBottom: "25px",
    },

    welcome: {
      color: "#ff7a00",
      fontWeight: 700,
    },

    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: "20px",
      marginTop: "20px",
    },

    /* Base card style */
    card: {
      background: "#e9e6e1",
      padding: "25px 25px 15px 25px",
      borderRadius: "14px",
      position: "relative",
      minHeight: "140px",

      /* Animation setup */
      transition: "all 0.25s ease",
      transform: "translateY(0px) scale(1)",
      boxShadow: "-2px 4px 8px -4px rgba(0,0,0,0.25)",
      cursor: "pointer",
    },

    /* Applied when hovered */
    cardHover: {
      transform: "translateY(-2px) scale(1)",
      boxShadow: "0px 14px 28px -6px rgba(0,0,0,0.35)",
    },

    icon: {
      position: "absolute",
      top: "20px",
      right: "20px",
      fontSize: "20px",
      opacity: 0.9,
    },

    title: {
      color: "#444",
      fontWeight: 500,
      marginBottom: "10px",
    },

    numberRow: {
      display: "flex",
      alignItems: "baseline",
      gap: "6px",
    },

    bigNumber: {
      fontSize: "56px",
      fontWeight: 700,
      margin: 0,
    },

    unit: {
      fontSize: "20px",
      fontWeight: 600,
    },

    subText: {
      fontSize: "18px",
      color: "#888",
      marginTop: "10px",
    },

    green: {
      color: "#22c55e",
      fontSize: "18px",
      display: "block",
    },

    announcementSection: {
      marginTop: "40px",
    },

    announcementTitle: {
      color: "#ff7a00",
      marginBottom: "20px",
      fontSize: "1.5rem",
      fontWeight: 700,
    },

    announcementBox: {
      background: "#e9e6e1",
      height: "80vh",
      borderRadius: "14px",
      padding: "20px",
      color: "#666",
      boxShadow: "-2px 4px 8px -4px rgba(0,0,0,0.25)",
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },

    announcementCard: {
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#F9F7F4', // Admin style match
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      border: '1px solid #e5e5e5',
      flexShrink: 0
    },
  };

  /* Helper to merge hover style */
  const getCardStyle = (index: number): React.CSSProperties => ({
    ...styles.card,
    ...(hoveredCard === index ? styles.cardHover : {}),
  });

  // Show loading spinner while data is being fetched
  if (!stats) return <PageLoader message="Loading dashboard..." />;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.welcome}>Welcome back, Intern {user?.name}!</h2>
      </div>

      <div style={styles.statsGrid}>
        {/* Card 1 */}
        <div
          style={getCardStyle(0)}
          onMouseEnter={() => setHoveredCard(0)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <FaCheckCircle style={{ ...styles.icon, color: "#22c55e" }} />
          <p style={styles.title}>Tasks Completed</p>
          <h1 style={styles.bigNumber}>{stats.tasksCompleted}</h1>
          <span style={styles.green}>Current Status</span>
        </div>

        {/* Card 2 */}
        <div
          style={getCardStyle(1)}
          onMouseEnter={() => setHoveredCard(1)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <FiClock style={{ ...styles.icon, color: "#3b82f6" }} />
          <p style={styles.title}>Hours Logged</p>
          <div style={styles.numberRow}>
            <h1 style={styles.bigNumber}>{stats.hoursLogged}</h1>
            <span style={styles.unit}>hrs</span>
          </div>
          <span style={styles.subText}>Target: {stats.targetHours}h</span>
        </div>

        {/* Card 3 */}
        <div
          style={getCardStyle(2)}
          onMouseEnter={() => setHoveredCard(2)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <BsHourglassSplit style={{ ...styles.icon, color: "#f97316" }} />
          <p style={styles.title}>Internship Days</p>
          <h1 style={styles.bigNumber}>{stats.daysRemaining}</h1>
          <span style={styles.subText}>Days Remaining</span>
        </div>
      </div>

      <div style={styles.announcementSection}>
        <h3 style={styles.announcementTitle}>Announcements</h3>

        <div style={styles.announcementBox}>
          {announcements.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              No new announcements.
            </div>
          ) : (
            announcements.map((announcement) => (
              <div key={announcement.id} style={styles.announcementCard}>
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>
                    {announcement.title}
                  </h3>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ margin: 0, color: '#4b5563', lineHeight: '1.5' }}>
                    {announcement.content}
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  marginTop: 'auto'
                }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span>Priority:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: getPriorityColor(announcement.priority)
                      }} />
                      <span style={{ fontWeight: 600, color: '#111827' }}>
                        {getPriorityLabel(announcement.priority)}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span>Date Created:</span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>
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