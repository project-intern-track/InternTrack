import { Bell } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'company' | 'internship';
  created_at: string;
  created_by: {
    full_name: string;
    email: string;
  };
}

// Sample static announcements
const sampleAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Office Closed on Feb 25',
    content: 'The office will be closed for maintenance. Please plan accordingly.',
    type: 'company',
    created_at: '2026-02-18T09:00:00',
    created_by: { full_name: 'Admin', email: 'admin@example.com' },
  },
  {
    id: '2',
    title: 'Submit Weekly Reports',
    content: 'All interns must submit their weekly reports by Friday 5 PM.',
    type: 'internship',
    created_at: '2026-02-17T16:30:00',
    created_by: { full_name: 'Supervisor', email: 'supervisor@example.com' },
  },
  {
    id: '3',
    title: 'Team Meeting',
    content: 'Mandatory team meeting on Feb 20 at 10 AM via Zoom.',
    type: 'company',
    created_at: '2026-02-16T14:00:00',
    created_by: { full_name: 'HR', email: 'hr@example.com' },
  },
];

const SupervisorAnnouncements = ({ type = 'company' }: { type?: 'company' | 'internship' }) => {
  const title = type === 'company' ? 'Company Notices' : 'Internship Reminders';
  const description =
    type === 'company'
      ? 'Post and manage company announcements for interns.'
      : 'Create and manage internship reminders and important dates.';

  // Filter announcements by type
  const filteredAnnouncements = sampleAnnouncements.filter((a) => a.type === type);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Bell size={28} />
        <h1>{title}</h1>
      </div>

      <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '1.5rem' }}>
        {description}
      </p>

      {filteredAnnouncements.length === 0 ? (
        <p>No announcements found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredAnnouncements.map((a) => (
            <div key={a.id} className="card" style={{ padding: '1rem' }}>
              <h3>{a.title}</h3>
              <p style={{ marginBottom: '0.5rem' }}>{a.content}</p>
              <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                By {a.created_by.full_name} — {new Date(a.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupervisorAnnouncements;
