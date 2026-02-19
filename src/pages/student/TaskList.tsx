import React, { useMemo, useState } from "react";

type TabKey = "all" | "in_progress" | "completed" | "overdue";

type TaskSkeleton = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  status: "In Progress" | "Completed" | "Overdue";
};

const DATA: Record<TabKey, TaskSkeleton[]> = {
  all: [
    {
      id: "1",
      title: "Task title goes here",
      description:
        "This is placeholder content. Backend data will appear here later.",
      dueDate: "MM/DD/YYYY",
      priority: "High",
      status: "In Progress",
    },
    {
      id: "2",
      title: "Another task title",
      description:
        "This is another placeholder card. This box is ready for backend.",
      dueDate: "MM/DD/YYYY",
      priority: "Medium",
      status: "Completed",
    },
  ],

  in_progress: [
    {
      id: "3",
      title: "In progress task",
      description: "This card represents an in-progress task.",
      dueDate: "MM/DD/YYYY",
      priority: "High",
      status: "In Progress",
    },
  ],

  completed: [
    {
      id: "4",
      title: "Completed task",
      description: "This card represents a completed task.",
      dueDate: "MM/DD/YYYY",
      priority: "Low",
      status: "Completed",
    },
  ],

  overdue: [
    {
      id: "5",
      title: "Overdue task",
      description: "This card represents an overdue task.",
      dueDate: "MM/DD/YYYY",
      priority: "Medium",
      status: "Overdue",
    },
  ],
};

function getPillStyle(status: string): React.CSSProperties {
  if (status === "In Progress")
    return { background: "#f5f0a6", color: "#333" };

  if (status === "Completed")
    return { background: "#bcd8ff", color: "#333" };

  return { background: "#ffc2c2", color: "#333" };
}

export default function TaskList() {
  const [tab, setTab] = useState<TabKey>("all");

  const counts = useMemo(() => {
    return {
      all: DATA.all.length,
      in_progress: DATA.in_progress.length,
      completed: DATA.completed.length,
      overdue: DATA.overdue.length,
    };
  }, []);

  const list = DATA[tab];

  return (
    <div style={styles.page}>
      {/* TITLE */}
      <h1 style={styles.title}>Task List</h1>

      {/* PANEL */}
      <div style={styles.panel}>
        {/* TABS */}
        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(tab === "all" ? styles.activeTab : {}),
            }}
            onClick={() => setTab("all")}
          >
            All Tasks ({counts.all})
          </button>

          <button
            style={{
              ...styles.tab,
              ...(tab === "in_progress" ? styles.activeTab : {}),
            }}
            onClick={() => setTab("in_progress")}
          >
            In Progress ({counts.in_progress})
          </button>

          <button
            style={{
              ...styles.tab,
              ...(tab === "completed" ? styles.activeTab : {}),
            }}
            onClick={() => setTab("completed")}
          >
            Completed ({counts.completed})
          </button>

          <button
            style={{
              ...styles.tab,
              ...(tab === "overdue" ? styles.activeTab : {}),
            }}
            onClick={() => setTab("overdue")}
          >
            Overdue ({counts.overdue})
          </button>
        </div>

        {/* TASK LIST */}
        <div style={styles.list}>
          {list.map((task) => (
            <div key={task.id} style={styles.card}>
              <div style={styles.cardTop}>
                <h2 style={styles.cardTitle}>{task.title}</h2>

                <div style={styles.priority}>
                  {task.priority} Priority
                </div>
              </div>

              <p style={styles.description}>{task.description}</p>

              <div style={styles.cardBottom}>
                <div>
                  <span style={styles.muted}>Due:</span>{" "}
                  {task.dueDate}
                </div>

                <div style={styles.actions}>
                  <span
                    style={{
                      ...styles.pill,
                      ...getPillStyle(task.status),
                    }}
                  >
                    {task.status}
                  </span>

                  <button style={styles.completeButton}>
                    Completed
                  </button>
                </div>
              </div>
            </div>
          ))}

          {list.length === 0 && (
            <div style={styles.empty}>
              No tasks available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "20px",
  },

  title: {
    color: "#ff7a00",
    fontSize: "26px",
    fontWeight: 800,
    marginBottom: "14px",
  },

  panel: {
    background: "#efeae4",
    borderRadius: "16px",
    padding: "16px",
    height: "75vh",
  },

  tabs: {
    display: "flex",
    gap: "10px",
    marginBottom: "12px",
  },

  tab: {
    border: "none",
    background: "transparent",
    padding: "8px 12px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 600,
  },

  activeTab: {
    background: "#ffcf96",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  card: {
    background: "#fff",
    borderRadius: "14px",
    border: "2px solid #ff8a00",
    padding: "14px",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
  },

  cardTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 900,
  },

  priority: {
    fontSize: "12px",
    fontWeight: 700,
  },

  description: {
    marginTop: "25px",
    marginBottom: "30px",
  },

  cardBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  muted: {
    opacity: 0.7,
    fontWeight: 700,
  },

  actions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  pill: {
    padding: "6px 10px",
    borderRadius: "999px",
    fontWeight: 700,
    fontSize: "12px",
  },

  completeButton: {
    padding: "6px 12px",
    borderRadius: "999px",
    border: "none",
    background: "#bcd8ff",
    fontWeight: 700,
    cursor: "pointer",
  },

  empty: {
    padding: "20px",
    textAlign: "center",
    opacity: 0.7,
  },
};
