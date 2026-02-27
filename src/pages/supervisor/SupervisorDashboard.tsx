import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';

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
// Helpers
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

const computeTopIntern = (tasks: PendingTask[]) => {
  const internScores: Record<string, number[]> = {};

  tasks.forEach(t => {
    if (!internScores[t.intern]) internScores[t.intern] = [];

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

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ============================
// Component
// ============================

const SupervisorDashboard = () => {
  const supervisorName = 'Test Supervisor';

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
      <h1 style={{ fontSize: 'clamp(1.5rem, 2vw, 2rem)' }}>
        Welcome back, {supervisorName}
      </h1>
      <p style={{ color: '#555' }}>Supervisor Dashboard</p>

      {/* TOP GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem',
        }}
      >
        {/* Pending Tasks */}
        <div
          style={{
            padding: '1rem',
            background: '#f9f9f9',
            borderRadius: '0.5rem',
          }}
        >
          <h3>Pending Tasks</h3>

          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '600px',
              }}
            >
              <thead>
                <tr style={{ background: '#ff8c42', color: '#fff' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Intern</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Task</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Due Date</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {dummyTasks.map((t, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.5rem' }}>{t.intern}</td>
                    <td style={{ padding: '0.5rem' }}>{t.task}</td>
                    <td style={{ padding: '0.5rem' }}>{t.due_date}</td>
                    <td
                      style={{
                        padding: '0.5rem',
                        fontWeight: 'bold',
                        color: statusColors[t.status],
                      }}
                    >
                      {t.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Intern */}
        <div
          style={{
            padding: '1rem',
            background: '#f0f0f0',
            borderRadius: '0.5rem',
          }}
        >
          <h3>Top Performing Intern</h3>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              {topInternData.name}
            </span>

            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                background: hexToRgba(statusColors['excellent'], 0.8),
                color: '#fff',
                padding: '0.25rem 0.75rem',
                borderRadius: '0.25rem',
              }}
            >
              {topInternData.score}
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM GRID */}
      <div
        style={{
          marginTop: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
        }}
      >
        {/* Pie Chart */}
        <div style={{ width: '100%', height: '400px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>
            Overall Performance Distribution
          </h3>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius="80%"
                label={({ value }) =>
                  total > 0
                    ? `${((value / total) * 100).toFixed(0)}%`
                    : '0%'
                }
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={statusColors[entry.name.toLowerCase()]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ textAlign: 'center' }}>Performance Summary</h3>

          {Object.entries(summary).map(([key, value]) => {
            const mapping: Record<string, string> = {
              excellent: 'excellent',
              veryGood: 'very good',
              satisfactory: 'satisfactory',
              needsImprovement: 'needs improvement',
              poor: 'poor',
            };

            const percent =
              total > 0 ? ((value / total) * 100).toFixed(0) : '0';

            const label = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase());

            return (
              <div
                key={key}
                style={{
                  background: hexToRgba(statusColors[mapping[key]], 0.25),
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
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