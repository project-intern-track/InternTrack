type Evaluation = {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
};

// Dummy static data
const dummyEvaluations: Evaluation[] = [
  { id: '1', title: 'Project Report', description: 'Evaluate the intern project report', due_date: '2026-02-22', priority: 'High', status: 'Pending' },
  { id: '2', title: 'Code Review', description: 'Review the submitted code', due_date: '2026-02-21', priority: 'Medium', status: 'In Progress' },
  { id: '3', title: 'Presentation', description: 'Evaluate the final presentation', due_date: '2026-02-25', priority: 'High', status: 'Pending' },
  { id: '4', title: 'Attendance Check', description: 'Review intern attendance logs', due_date: '2026-02-20', priority: 'Low', status: 'Completed' },
  { id: '5', title: 'Feedback Survey', description: 'Evaluate feedback survey responses', due_date: '2026-02-23', priority: 'Medium', status: 'Pending' },
];

const Evaluations = () => {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
      <h1>Evaluations</h1>
      <p style={{ color: '#555' }}>Manage evaluations for interns here.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        {dummyEvaluations.map(task => (
          <div key={task.id} style={{
            border: '1px solid #ccc',
            borderRadius: '0.5rem',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.5rem',
            position: 'relative',
          }}>
            {/* Top-right priority badge */}
            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
              <span style={{
                backgroundColor: task.priority === 'High' ? '#e74c3c' : task.priority === 'Medium' ? '#f39c12' : '#2ecc71',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: 'bold',
              }}>
                {task.priority}
              </span>
            </div>

            <div>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
            </div>

            {/* Bottom section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Due: {new Date(task.due_date).toLocaleDateString()}</p>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 'bold',
                color: task.status === 'Completed' ? '#2ecc71' : task.status === 'In Progress' ? '#f39c12' : '#e74c3c',
              }}>
                {task.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Evaluations;
