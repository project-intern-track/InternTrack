import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { FaCheckCircle } from "react-icons/fa";
import { FiClock } from "react-icons/fi";
import { BsHourglassSplit } from "react-icons/bs";
import { MdAnnouncement, MdAccessTime } from "react-icons/md";
import { IoMdDocument } from "react-icons/io";
import { announcementService } from "../../services/announcementService";
import { userService } from "../../services/userServices";
import { taskService } from "../../services/taskServices";
import { attendanceService } from "../../services/attendanceServices";
import type {
  Announcement,
  Tasks,
  Attendance,
  Users,
} from "../../types/database.types";
import PageLoader from "../../components/PageLoader";

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

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
        const [announcementsData, profileData, tasksData, attendanceData] =
          await Promise.all([
            announcementService.getAnnouncements(),
            userService.getProfile(user.id),
            taskService.getMyTasks(),
            attendanceService.getAttendance(),
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

        // Attendance Stats (RLS filters attendance for this user)
        const myAttendance = (attendanceData as Attendance[]) || [];
        const hoursLogged = myAttendance.reduce(
          (sum, record) => sum + (record.total_hours || 0),
          0,
        );

        // Days Remaining (Assuming 8 hours per day)
        const hoursRemaining = Math.max(0, targetHours - hoursLogged);
        const daysRemaining = Math.ceil(hoursRemaining / 8);

        setStats({
          tasksCompleted: tasksCompleted || 0,
          hoursLogged: Math.round(hoursLogged * 10) / 10, // Round to 1 decimal
          targetHours,
          daysRemaining,
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
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

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "high":
        return "#991b1b"; // Dark red
      case "medium":
        return "#eab308"; // Blue
      case "low":
        return "#1e40af"; // Yellow
      default:
        return "#9ca3af";
    }
  };

  const getPriorityLabel = (p: string) => {
    return p.charAt(0).toUpperCase() + p.slice(1) + " Priority";
  };

  const getAnnouncementIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <MdAnnouncement />;
      case "medium":
        return <MdAnnouncement />;
      case "low":
        return <IoMdDocument />;
      default:
        return <MdAnnouncement />;
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

  /* Track which card is hovered */
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [hoveredAnnouncement, setHoveredAnnouncement] = useState<number | null>(
    null,
  );
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);

  const styles: Record<string, React.CSSProperties> = {
    container: {
      padding: "30px",
      background: "#f5f6f8",
      minHeight: "100vh",
      animation: "fadeIn 0.5s ease",
    },

    header: {
      marginBottom: "25px",
      animation: "slideDown 0.4s ease",
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
      transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
      transform: "translateY(0px) scale(1)",
      boxShadow: "-2px 4px 8px -4px rgba(0,0,0,0.25)",
      cursor: "pointer",
    },

    /* Applied when hovered */
    cardHover: {
      transform: "translateY(-1px) scale(1)",
      boxShadow: "0px 16px 32px -6px rgba(0,0,0,0.3)",
    },

    icon: {
      position: "absolute",
      top: "20px",
      right: "20px",
      fontSize: "20px",
      opacity: 0.9,
      transition: "all 0.3s ease",
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
      transition: "color 0.3s ease",
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
      animation: "fadeSlideUp 0.6s ease",
    },

    announcementTitle: {
      color: "#ff7a00",
      marginBottom: "20px",
      fontSize: "1.5rem",
      fontWeight: 700,
    },

    announcementBox: {
      background: "#e9e6e1",
      height: "60vh",
      borderRadius: "14px",
      padding: "20px",
      color: "#666",
      boxShadow: "-2px 4px 8px -4px rgba(0,0,0,0.25)",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    },

    announcementCard: {
      padding: "1rem 1.25rem",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#fff",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      border: "1px solid #e5e7eb",
      borderLeft: "4px solid",
      flexShrink: 0,
      minHeight: "120px",
      position: "relative",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      cursor: "pointer",
    },

    announcementCardHover: {
      transform: "translateX(4px)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    },

    announcementHeader: {
      display: "flex",
      alignItems: "flex-start",
      gap: "0.75rem",
      marginBottom: "0.75rem",
    },

    announcementIconWrapper: {
      width: "32px",
      height: "32px",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "16px",
      color: "#fff",
      flexShrink: 0,
    },

    announcementContent: {
      flex: 1,
    },

    announcementTopRow: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      marginBottom: "0.25rem",
    },

    announcementType: {
      display: "flex",
      alignItems: "center",
      gap: "0.25rem",
      fontSize: "0.75rem",
      color: "#6b7280",
    },

    announcementBadge: {
      fontSize: "0.65rem",
      fontWeight: 700,
      color: "#fff",
      backgroundColor: "#ff8a00",
      padding: "2px 6px",
      borderRadius: "4px",
      textTransform: "uppercase",
    },

    announcementTitleText: {
      margin: 0,
      fontSize: "0.95rem",
      fontWeight: 700,
      color: "#111827",
      lineHeight: 1.3,
    },

    announcementText: {
      margin: "0.5rem 0 0.75rem 0",
      color: "#374151",
      lineHeight: 1.5,
      fontSize: "0.875rem",
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical" as const,
    },

    announcementFooter: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      fontSize: "0.75rem",
      color: "#9ca3af",
      marginTop: "auto",
    },

    announcementDate: {
      display: "flex",
      alignItems: "center",
      gap: "0.25rem",
    },

    announcementAttachment: {
      display: "flex",
      alignItems: "center",
      gap: "0.25rem",
      fontSize: "0.7rem",
      color: "#6b7280",
      marginLeft: "auto",
    },
  };

  /* Helper to merge hover style */
  const getCardStyle = (index: number): React.CSSProperties => ({
    ...styles.card,
    ...(hoveredCard === index ? styles.cardHover : {}),
    animation: `fadeSlideUp 0.5s ease backwards ${index * 0.1}s`,
  });

  const getAnnouncementCardStyle = (
    index: number,
    priority: string,
  ): React.CSSProperties => ({
    ...styles.announcementCard,
    borderLeftColor: getPriorityColor(priority),
    ...(hoveredAnnouncement === index ? styles.announcementCardHover : {}),
  });

  // Show loading spinner while data is being fetched
  if (!stats) return <PageLoader message="Loading dashboard..." />;

  return (
    <>
      <style>{keyframesCSS}</style>
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
            <FaCheckCircle
              style={{
                ...styles.icon,
                color: "#22c55e",
                ...(hoveredCard === 0
                  ? { transform: "scale(1.15) rotate(10deg)" }
                  : {}),
              }}
            />
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
            <FiClock
              style={{
                ...styles.icon,
                color: "#3b82f6",
                ...(hoveredCard === 1
                  ? { transform: "scale(1.15) rotate(-10deg)" }
                  : {}),
              }}
            />
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
            <BsHourglassSplit
              style={{
                ...styles.icon,
                color: "#f97316",
                ...(hoveredCard === 2
                  ? { transform: "scale(1.15) rotate(10deg)" }
                  : {}),
              }}
            />
            <p style={styles.title}>Internship Days</p>
            <h1 style={styles.bigNumber}>{stats.daysRemaining}</h1>
            <span style={styles.subText}>Days Remaining</span>
          </div>
        </div>

        <div style={styles.announcementSection}>
          <h3 style={styles.announcementTitle}>Announcements</h3>

          <div style={styles.announcementBox}>
            {announcements.length === 0 ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                No new announcements.
              </div>
            ) : (
              announcements.map((announcement, index) => (
                <div
                  key={announcement.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedAnnouncement(announcement)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && setSelectedAnnouncement(announcement)
                  }
                  onMouseEnter={() => setHoveredAnnouncement(index)}
                  onMouseLeave={() => setHoveredAnnouncement(null)}
                  style={{
                    ...getAnnouncementCardStyle(index, announcement.priority),
                    animation: `slideInLeft 0.4s ease backwards ${index * 0.08}s`,
                  }}
                >
                  <div style={styles.announcementHeader}>
                    <div
                      style={{
                        ...styles.announcementIconWrapper,
                        backgroundColor: getPriorityColor(
                          announcement.priority,
                        ),
                      }}
                    >
                      {getAnnouncementIcon(announcement.priority)}
                    </div>

                    <div style={styles.announcementContent}>
                      <div style={styles.announcementTopRow}>
                        <div style={styles.announcementType}>
                          {getAnnouncementTypeLabel(announcement.priority)}
                        </div>
                        {index < 2 && (
                          <span style={styles.announcementBadge}>NEW</span>
                        )}
                      </div>
                      <h3 style={styles.announcementTitleText}>
                        {announcement.title}
                      </h3>
                    </div>
                  </div>

                  <p style={styles.announcementText}>{announcement.content}</p>

                  <div style={styles.announcementFooter}>
                    <div style={styles.announcementDate}>
                      <MdAccessTime />
                      <span>
                        Posted {formatDateTime(announcement.created_at)}
                      </span>
                    </div>
                    <div style={styles.announcementAttachment}>
                      <IoMdDocument />
                      <span>View Details</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Announcement Detail Modal */}
        {selectedAnnouncement && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001,
              backdropFilter: "blur(4px)",
              animation: "fadeIn 0.3s ease",
            }}
            onClick={() => setSelectedAnnouncement(null)}
          >
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "2rem",
                width: "100%",
                maxWidth: "560px",
                maxHeight: "90vh",
                overflowX: "hidden",
                overflowY: "auto",
                boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                animation: "scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    color: "#fff",
                    backgroundColor: getPriorityColor(
                      selectedAnnouncement.priority,
                    ),
                  }}
                >
                  {getAnnouncementIcon(selectedAnnouncement.priority)}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {getAnnouncementTypeLabel(selectedAnnouncement.priority)}
                  </div>
                  <h2
                    style={{
                      color: "#111827",
                      margin: 0,
                      fontSize: "1.35rem",
                      fontWeight: 700,
                    }}
                  >
                    {selectedAnnouncement.title}
                  </h2>
                </div>
              </div>

              <p
                style={{
                  margin: "0 0 1.5rem",
                  color: "#374151",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  maxWidth: "100%",
                }}
              >
                {selectedAnnouncement.content}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  padding: "1rem",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>Priority:</span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor: getPriorityColor(
                          selectedAnnouncement.priority,
                        ),
                      }}
                    />
                    <span style={{ fontWeight: 600, color: "#111827" }}>
                      {getPriorityLabel(selectedAnnouncement.priority)}
                    </span>
                  </div>
                </div>
                <div>
                  <span>Posted: </span>
                  <span style={{ fontWeight: 600, color: "#111827" }}>
                    {formatDateTime(selectedAnnouncement.created_at)}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => setSelectedAnnouncement(null)}
                  style={{
                    padding: "0.65rem 1.5rem",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#ff7a00",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#ff6f00";
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ff7a00";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const keyframesCSS = `
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
`;

export default StudentDashboard;
