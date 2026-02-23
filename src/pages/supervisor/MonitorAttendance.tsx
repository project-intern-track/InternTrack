import { UserCheck } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
  total_hours: number | null;
  user: {
    full_name: string;
    email: string;
  };
}

const sampleRecords: AttendanceRecord[] = [
  {
    id: '1',
    date: '2026-02-18',
    time_in: '2026-02-18T08:00:00',
    time_out: '2026-02-18T16:00:00',
    total_hours: 8,
    status: 'present',
    user: { full_name: 'Jay Jay Tan', email: 'jayjay@example.com' },
  },
  {
    id: '2',
    date: '2026-02-18',
    time_in: '2026-02-18T09:00:00',
    time_out: '2026-02-18T17:00:00',
    total_hours: 8,
    status: 'present',
    user: { full_name: 'Maria Cruz', email: 'maria@example.com' },
  },
  {
    id: '3',
    date: '2026-02-18',
    time_in: null,
    time_out: null,
    total_hours: null,
    status: 'absent',
    user: { full_name: 'John Doe', email: 'john@example.com' },
  },
];

const MonitorAttendance = () => {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <UserCheck size={28} />
        <h1>Monitor Attendance</h1>
      </div>

      <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '2rem' }}>
        Track and manage intern attendance records.
      </p>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: '0.75rem' }}>Intern</th>
              <th style={{ padding: '0.75rem' }}>Date</th>
              <th style={{ padding: '0.75rem' }}>Time In</th>
              <th style={{ padding: '0.75rem' }}>Time Out</th>
              <th style={{ padding: '0.75rem' }}>Hours</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sampleRecords.map((record) => (
              <tr key={record.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.75rem' }}>
                  <strong>{record.user.full_name}</strong>
                  <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                    {record.user.email}
                  </div>
                </td>
                <td style={{ padding: '0.75rem' }}>{record.date}</td>
                <td style={{ padding: '0.75rem' }}>
                  {record.time_in
                    ? new Date(record.time_in).toLocaleTimeString()
                    : '-'}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {record.time_out
                    ? new Date(record.time_out).toLocaleTimeString()
                    : '-'}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {record.total_hours ?? '-'}
                </td>
                <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>
                  {record.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonitorAttendance;
