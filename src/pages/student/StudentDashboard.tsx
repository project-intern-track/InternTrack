import React from "react";
import { useAuth } from "../../context/AuthContext";
import { FaCheckCircle } from "react-icons/fa";
import { FiClock } from "react-icons/fi";
import { BsHourglassSplit } from "react-icons/bs";

/* ---- Define User Type (adjust if your AuthContext differs) ---- */
interface User {
  name?: string;
}

/* ---- If your AuthContext already has a type, you can remove this ---- */
interface AuthContextType {
  user?: User;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth() as AuthContextType;

  /* --- Styles (Typed) --- */
  const styles: Record<string, React.CSSProperties> = {
    container: {
      padding: "30px",
      background: "#f5f6f8",
      minHeight: "100vh",
    },

    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
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

    card: {
      background: "#e9e6e1",
      padding: "25px 25px 15px 25px",
      borderRadius: "14px",
      boxShadow: "-2px 4px 8px -4px rgba(0,0,0,0.25)",
      position: "relative",
      minHeight: "140px",
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
      marginBottom: "10px",
    },

    announcementBox: {
      background: "#e9e6e1",
      height: "390px",
      borderRadius: "14px",
      padding: "20px",
      color: "#666",
      boxShadow: "-2px 4px 8px -4px rgba(0,0,0,0.25)",
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.welcome}>Welcome back, Intern {user?.name}!</h2>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        {/* Tasks Completed */}
        <div style={styles.card}>
          <FaCheckCircle style={{ ...styles.icon, color: "#22c55e" }} />
          <p style={styles.title}>Tasks Completed</p>
          <h1 style={styles.bigNumber}>24</h1>
          <span style={styles.green}>+2 this week</span>
        </div>

        {/* Hours Logged */}
        <div style={styles.card}>
          <FiClock style={{ ...styles.icon, color: "#3b82f6" }} />
          <p style={styles.title}>Hours Logged</p>
          <div style={styles.numberRow}>
            <h1 style={styles.bigNumber}>128</h1>
            <span style={styles.unit}>hrs</span>
          </div>
          <span style={styles.subText}>Target: 400h</span>
        </div>

        {/* Internship Days */}
        <div style={styles.card}>
          <BsHourglassSplit style={{ ...styles.icon, color: "#f97316" }} />
          <p style={styles.title}>Internship Days</p>
          <h1 style={styles.bigNumber}>45</h1>
          <span style={styles.subText}>Days remaining</span>
        </div>
      </div>

      {/* Announcements */}
      <div style={styles.announcementSection}>
        <h3 style={styles.announcementTitle}>Announcements</h3>
        <div style={styles.announcementBox}>No new announcements.</div>
      </div>
    </div>
  );
};

export default StudentDashboard;
