import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { FaCheckCircle } from "react-icons/fa";
import { FiClock } from "react-icons/fi";
import { BsHourglassSplit } from "react-icons/bs";

interface User {
  name?: string;
}

interface AuthContextType {
  user?: User;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth() as AuthContextType;

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
      marginBottom: "10px",
      fontWeight: 700,
    },

    announcementBox: {
      background: "#e9e6e1",
      height: "80vh",
      borderRadius: "14px",
      padding: "20px",
      color: "#666",
      boxShadow: "-2px 4px 8px -4px rgba(0,0,0,0.25)",
    },
  };

  /* Helper to merge hover style */
  const getCardStyle = (index: number): React.CSSProperties => ({
    ...styles.card,
    ...(hoveredCard === index ? styles.cardHover : {}),
  });

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
          <h1 style={styles.bigNumber}>24</h1>
          <span style={styles.green}>+2 this week</span>
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
            <h1 style={styles.bigNumber}>128</h1>
            <span style={styles.unit}>hrs</span>
          </div>
          <span style={styles.subText}>Target: 400h</span>
        </div>

        {/* Card 3 */}
        <div
          style={getCardStyle(2)}
          onMouseEnter={() => setHoveredCard(2)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <BsHourglassSplit style={{ ...styles.icon, color: "#f97316" }} />
          <p style={styles.title}>Internship Days</p>
          <h1 style={styles.bigNumber}>45</h1>
          <span style={styles.subText}>Days remaining</span>
        </div>
      </div>

      <div style={styles.announcementSection}>
        <div style={styles.announcementBox}>
          <h3 style={styles.announcementTitle}>Announcements</h3>
          No new announcements.
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
