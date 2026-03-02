import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from 'recharts';

// ============================
// Types
// ============================

type PerformanceStatus = 'excellent' | 'very good' | 'satisfactory' | 'needs improvement' | 'poor';
type TaskStatus = 'pending' | 'approved' | 'rejected' | 'overdue';

interface PendingTask {
  intern: string;
  task: string;
  due_date: string;
  status: PerformanceStatus;
}

interface TaskTableItem {
  intern: string;
  task: string;
  due_date: string;
  status: TaskStatus;
}

type PerformanceSummary = Record<PerformanceStatus, number>;

// ============================
// Config
// ============================

const STATUS_COLORS: Record<string, string> = {
  excellent: '#2E7D32',
  'very good': '#00897B',
  satisfactory: '#F9A825',
  'needs improvement': '#FB8C00',
  poor: '#D32F2F',
  pending: '#F9A825',
  approved: '#2E7D32',
  rejected: '#616161',
  overdue: '#D32F2F',
};

const STATUS_SCORES: Record<PerformanceStatus, number> = {
  excellent: 100,
  'very good': 85,
  satisfactory: 70,
  'needs improvement': 50,
  poor: 25,
};

// ============================
// Helpers
// ============================

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getInitials = (name: string): string =>
  name.split(' ').map(n => n[0].toUpperCase()).join('');

const computeSummary = (tasks: PendingTask[]): PerformanceSummary => {
  const summary = Object.fromEntries(
    Object.keys(STATUS_SCORES).map(k => [k, 0])
  ) as PerformanceSummary;

  for (const task of tasks) summary[task.status]++;
  return summary;
};

const computeTopInterns = (tasks: PendingTask[], topN = 3) => {
  const scores: Record<string, number[]> = {};

  for (const task of tasks) {
    (scores[task.intern] ??= []).push(STATUS_SCORES[task.status]);
  }

  return Object.entries(scores)
    .map(([name, arr]) => ({
      name,
      initials: getInitials(name),
      avg: arr.reduce((a, b) => a + b, 0) / arr.length,
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, topN);
};

const toTaskStatus = (score: number): TaskStatus => {
  if (score >= 85) return 'approved';
  if (score >= 50) return 'pending';
  return 'rejected';
};

const formatLabel = (key: string): string =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

// ============================
// Shared Styles
// ============================

const AVATAR_BASE: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: '#ff8c42',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: 'bold',
  color: '#fff',
  fontSize: 12,
  flexShrink: 0,
};

// ============================
// Components
// ============================

const Avatar = ({ name, size = 32 }: { name: string; size?: number }) => (
  <div style={{ ...AVATAR_BASE, width: size, height: size }}>
    {getInitials(name)}
  </div>
);

const TaskTable = ({ tasks }: { tasks: TaskTableItem[] }) => (
  <div style={{ padding: '1rem', background: '#f9f9f9', borderRadius: '0.5rem' }}>
    <h3>Pending Tasks</h3>
    <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
        <thead>
          <tr>
            {['Intern', 'Task', 'Due Date', 'Status'].map(h => (
              <th
                key={h}
                style={{
                  background: '#ff8c42',
                  color: '#fff',
                  textAlign: 'left',
                  padding: '0.5rem',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((t, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Avatar name={t.intern} />
                {t.intern}
              </td>
              <td style={{ padding: '0.5rem' }}>{t.task}</td>
              <td style={{ padding: '0.5rem' }}>{t.due_date}</td>
              <td style={{ padding: '0.5rem', fontWeight: 'bold', color: STATUS_COLORS[t.status] }}>
                {t.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const PieSummary = ({ summary }: { summary: PerformanceSummary }) => {
  const pieData = Object.entries(summary).map(([name, value]) => ({ name, value }));
  const total = pieData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div style={{ width: '100%', height: 400 }}>
      <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Overall Performance Distribution</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            cx="50%"
            cy="50%"
            outerRadius="80%"
            label={({ value }) => total > 0 ? `${((value / total) * 100).toFixed(0)}%` : '0%'}
          >
            {pieData.map((entry, index) => (
              <Cell key={index} fill={STATUS_COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const PerformanceSummaryList = ({ summary }: { summary: PerformanceSummary }) => {
  const total = Object.values(summary).reduce((a, b) => a + b, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h3 style={{ textAlign: 'center' }}>Performance Summary</h3>
      {Object.entries(summary).map(([key, value]) => (
        <div
          key={key}
          style={{
            background: hexToRgba(STATUS_COLORS[key], 0.25),
            padding: '0.75rem',
            borderRadius: '0.5rem',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          {formatLabel(key)}: {value} ({total > 0 ? ((value / total) * 100).toFixed(0) : '0'}%)
        </div>
      ))}
    </div>
  );
};

const TopPerformers = ({ interns }: { interns: { name: string; avg: number; initials: string }[] }) => (
  <div style={{ padding: '1rem', background: '#f0f0f0', borderRadius: '0.5rem' }}>
    <h3>Top Performing Interns</h3>
    {interns.map((t, i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: i > 0 ? 8 : 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={t.name} size={35} />
          <span>{t.name}</span>
        </div>
        <span
          style={{
            fontWeight: 'bold',
            background: hexToRgba(STATUS_COLORS['excellent'], 0.8),
            color: '#fff',
            padding: '0.25rem 0.75rem',
            borderRadius: '0.25rem',
          }}
        >
          {Math.round(t.avg)}
        </span>
      </div>
    ))}
  </div>
);

// ============================
// Main Component
// ============================

const SupervisorDashboard = () => {
  const supervisorName = 'Test Supervisor';

  // TODO: Replace with real DB data
  const tasks: PendingTask[] = [
    { intern: 'Juan Dela Cruz', task: 'Weekly Report', due_date: '2026-02-22', status: 'excellent' },
    { intern: 'Maria Santos', task: 'UI Prototype', due_date: '2026-02-23', status: 'very good' },
    { intern: 'Carlo Reyes', task: 'Database Schema', due_date: '2026-02-20', status: 'satisfactory' },
    { intern: 'Angela Lim', task: 'API Integration', due_date: '2026-02-21', status: 'needs improvement' },
    { intern: 'Pedro Gonzales', task: 'Frontend Fixes', due_date: '2026-02-19', status: 'poor' },
    { intern: 'Luisa Mendoza', task: 'Unit Testing', due_date: '2026-02-24', status: 'very good' },
    { intern: 'Juan Dela Cruz', task: 'Documentation', due_date: '2026-02-25', status: 'excellent' },
  ];

  const tableTasks: TaskTableItem[] = tasks.map(t => ({
    intern: t.intern,
    task: t.task,
    due_date: t.due_date,
    status: toTaskStatus(STATUS_SCORES[t.status]),
  }));

  const summary = computeSummary(tasks);
  const topInterns = computeTopInterns(tasks);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 'clamp(1.5rem, 2vw, 2rem)', color: '#ff8c42' }}>
        Welcome back, {supervisorName}
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem',
        }}
      >
        <TaskTable tasks={tableTasks} />
        <TopPerformers interns={topInterns} />
      </div>

      <div
        style={{
          marginTop: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
        }}
      >
        <PieSummary summary={summary} />
        <PerformanceSummaryList summary={summary} />
      </div>
    </div>
  );
};

export default SupervisorDashboard;