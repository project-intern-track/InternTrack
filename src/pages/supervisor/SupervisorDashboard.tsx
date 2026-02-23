import { PieChart, Pie, Tooltip, Cell } from 'recharts';

type PendingTask = {
  intern: string;
  task: string;
  due_date: string;
  status: 'excellent' | 'very good' | 'satisfactory' | 'needs improvement' | 'poor';
};

type PerformanceSummary = {
  excellent: number;
  veryGood: number;
  satisfactory: number;
  needsImprovement: number;
  poor: number;
};

// ============================
// Dummy Static Data
// ============================
const dummyTasks: PendingTask[] = [
  { intern: 'Juan Dela Cruz', task: 'Weekly Report', due_date: '2026-02-22', status: 'excellent' },
  { intern: 'Maria Santos', task: 'UI Prototype', due_date: '2026-02-23', status: 'very good' },
  { intern: 'Carlo Reyes', task: 'Database Schema', due_date: '2026-02-20', status: 'satisfactory' },
  { intern: 'Angela Lim', task: 'API Integration', due_date: '2026-02-21', status: 'needs improvement' },
  { intern: 'Carlo Reyes', task: 'Frontend Fixes', due_date: '2026-02-19', status: 'poor' },
  { intern: 'Juan Dela Cruz', task: 'Unit Testing', due_date: '2026-02-24', status: 'very good' },
  { intern: 'Angela Lim', task: 'Documentation', due_date: '2026-02-25', status: 'excellent' },
];

// ============================
// Helper Functions
// ============================
const computeSummary = (tasks: PendingTask[]): PerformanceSummary => {
  const summary: PerformanceSummary = {
    excellent: 0,
    veryGood: 0,
    satisfactory: 0,
    needsImprovement: 0,
    poor: 0,
  };
  tasks.forEach(t => {
    switch (t.status) {
      case 'excellent':
        summary.excellent++;
        break;
      case 'very good':
        summary.veryGood++;
        break;
      case 'satisfactory':
        summary.satisfactory++;
        break;
      case 'needs improvement':
        summary.needsImprovement++;
        break;
      case 'poor':
        summary.poor++;
        break;
    }
  });
  return summary;
};

// Compute top performing intern and score out of 100
const computeTopIntern = (tasks: PendingTask[]): { name: string; score: number } => {
  const internScores: Record<string, number[]> = {};
  tasks.forEach(t => {
    if (!internScores[t.intern]) internScores[t.intern] = [];
    // Count excellent & very good as 100 points, satisfactory 75, needs improvement 50, poor 25
    let points = 0;
    switch (t.status) {
      case 'excellent':
        points = 100;
        break;
      case 'very good':
        points = 85;
        break;
      case 'satisfactory':
        points = 70;
        break;
      case 'needs improvement':
        points = 50;
        break;
      case 'poor':
        points = 25;
        break;
    }
    internScores[t.intern].push(points);
  });

  let bestName = 'N/A';
  let bestScore = 0;

  Object.entries(internScores).forEach(([name, scores]) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg > bestScore) {
      bestScore = avg;
      bestName = name;
    }
  });

  return { name: bestName, score: Math.round(bestScore) };
};

// ============================
// Colors
// ============================
const statusColors: Record<string, string> = {
  excellent: '#2E7D32',
  'very good': '#00897B',
  satisfactory: '#F9A825',
  'needs improvement': '#FB8C00',
  poor: '#D32F2F',
};

// Helper to make hex color slightly transparent
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ============================
// Main Component
// ============================
const SupervisorDashboard = () => {
  const supervisorName = 'Supervisor Maria';

  const pendingTasks = dummyTasks;
  const summary = computeSummary(dummyTasks);
  const topInternData = computeTopIntern(dummyTasks);

  const total = Object.values(summary).reduce((acc, v) => acc + v, 0);

  const pieData = [
    { name: 'Excellent', value: summary.excellent },
    { name: 'Very Good', value: summary.veryGood },
    { name: 'Satisfactory', value: summary.satisfactory },
    { name: 'Needs Improvement', value: summary.needsImprovement },
    { name: 'Poor', value: summary.poor },
  ];

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Welcome back, {supervisorName}</h1>
      <p style={{ color: '#555' }}>Supervisor Dashboard</p>

      {/* TOP GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '1rem',
          marginTop: '2rem',
        }}
      >
        {/* Pending Tasks */}
        <div
          className="card"
          style={{ textAlign: 'left', padding: '1rem', background: '#f9f9f9', borderRadius: '0.5rem' }}
        >
          <h3 style={{ textAlign: 'left' }}>Pending Tasks</h3>
          <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#ff8c42', color: '#fff' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Intern</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Task</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Due Date</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingTasks.map((t, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.5rem' }}>{t.intern}</td>
                  <td style={{ padding: '0.5rem' }}>{t.task}</td>
                  <td style={{ padding: '0.5rem' }}>{t.due_date}</td>
                  <td style={{ padding: '0.5rem', fontWeight: 'bold', color: statusColors[t.status] }}>
                    {t.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

{/* Top Intern */}
<div
  className="card"
  style={{ padding: '1rem', background: '#f0f0f0', borderRadius: '0.5rem' }}
>
  <h3>Top Performing Intern</h3>
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '1rem',
    }}
  >
    <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{topInternData.name}</span>
    <span
      style={{
        fontSize: '1.25rem',
        fontWeight: 'bold',
        background: hexToRgba(statusColors['excellent'], 0.8),
        color: '#fff',
        padding: '0.25rem 0.5rem',
        borderRadius: '0.25rem',
        minWidth: '60px',
        textAlign: 'center',
      }}
    >
      {topInternData.score}
    </span>
  </div>
</div>
</div>
      {/* BOTTOM GRID */}
      <div
        className="card"
        style={{
          marginTop: '1rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
        }}
      >
        {/* Pie Chart Column */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1rem' }}>Overall Performance Distribution</h3>
          <PieChart width={600} height={450}>
            <Pie
              data={pieData}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={200}
              label={({ value }) => `${((value / total) * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={index} fill={statusColors[entry.name.toLowerCase()]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => `${((Number(value) / total) * 100).toFixed(0)}%`} />
          </PieChart>
        </div>

        {/* Performance Summary Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Performance Summary</h3>
          {Object.entries(summary).map(([key, value]) => {
            const summaryKeyToStatus: Record<string, string> = {
              excellent: 'excellent',
              veryGood: 'very good',
              satisfactory: 'satisfactory',
              needsImprovement: 'needs improvement',
              poor: 'poor',
            };
            const color = hexToRgba(statusColors[summaryKeyToStatus[key]], 0.3); // transparent
            const percent = ((value / total) * 100).toFixed(0);
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return (
              <div
                key={key}
                style={{
                  background: color,
                  color: '#000', // black text
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                {label}: {value} ({percent}%)
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;