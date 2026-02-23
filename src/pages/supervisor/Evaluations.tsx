import { useState } from 'react';

export type Evaluation = {
  id: string;
  name: string;
  role: string;
  taskCompletion: number; 
  competencyScore: string; 
  overall: number;
  remarks: string;
};

const sampleEvaluations: Evaluation[] = [
  { id: '1', name: 'John Doe', role: 'Intern', taskCompletion: 8, competencyScore: '4.5/5 (95%)', overall: 95, remarks: 'Good work' },
  { id: '2', name: 'Jane Smith', role: 'Intern', taskCompletion: 6, competencyScore: '4.0/5 (90%)', overall: 90, remarks: 'Needs improvement on deadlines' },
  { id: '3', name: 'Mark Lee', role: 'Assistant', taskCompletion: 7, competencyScore: '4.2/5 (92%)', overall: 92, remarks: 'Well done' },
];

const Evaluations = () => {
  const [evaluations] = useState<Evaluation[]>(sampleEvaluations);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [remarksFilter, setRemarksFilter] = useState('');

  const uniqueRemarks = Array.from(new Set(evaluations.map(e => e.remarks)));

  const filteredEvaluations = evaluations.filter(e => {
    return (
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (roleFilter ? e.role === roleFilter : true) &&
      (remarksFilter ? e.remarks === remarksFilter : true)
    );
  });

  // Calculations
  const totalEvaluated = evaluations.length;
  const averageCompletion = evaluations.length > 0
    ? Math.round(evaluations.reduce((sum, e) => sum + e.taskCompletion, 0) / evaluations.length)
    : 0;
  const improvementTrend = totalEvaluated; // number of evaluated tasks

  return (
    <div style={{ maxWidth: '2000px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ color: '#ff8c42' }}>Evaluations</h1>
      <p style={{ color: '#555' }}>Manage evaluations for interns here.</p>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        {[
          { label: 'Total Interns Evaluated', value: totalEvaluated },
          { label: 'Average Task Completion', value: averageCompletion },
          { label: 'Improvement Trend', value: improvementTrend },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: '#ffffff',
              textAlign: 'center',
              border: '1px solid #ccc',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              minHeight: '120px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#555' }}>{item.label}</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters Container */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f5f5f5',
        borderRadius: '0.5rem',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <input
          type="text"
          placeholder="Search by name"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 2, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }}
        />

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }}
        >
          <option value="">All Roles</option>
          <option value="Intern">Intern</option>
          <option value="Assistant">Assistant</option>
        </select>

        <select
          value={remarksFilter}
          onChange={e => setRemarksFilter(e.target.value)}
          style={{ flex: 2, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }}
        >
          <option value="">All Remarks</option>
          {uniqueRemarks.map((r, idx) => (
            <option key={idx} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Evaluation Table */}
      <div style={{ marginTop: '2rem', border: '1px solid #ccc', borderRadius: '0.5rem', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ backgroundColor: '#fb8c42', color: '#fff', display: 'flex', padding: '0.75rem', fontWeight: 'bold' }}>
          <div style={{ flex: 2 }}>Name</div>
          <div style={{ flex: 1 }}>Role</div>
          <div style={{ flex: 1 }}>Task Completion</div>
          <div style={{ flex: 1 }}>Competency Score</div>
          <div style={{ flex: 1 }}>Overall (%)</div>
          <div style={{ flex: 2 }}>Remarks</div>
        </div>

        {/* Rows */}
        {filteredEvaluations.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center' }}>No evaluations found</div>
        ) : (
          filteredEvaluations.map(e => (
            <div key={e.id} style={{ display: 'flex', padding: '0.75rem', borderBottom: '1px solid #eee', alignItems: 'center' }}>
              <div style={{ flex: 2 }}>{e.name}</div>
              <div style={{ flex: 1 }}>{e.role}</div>
              <div style={{ flex: 1 }}>{e.taskCompletion}</div>
              <div style={{ flex: 1 }}>{e.competencyScore}</div>
              <div style={{ flex: 1 }}>{e.overall}%</div>
              <div style={{ flex: 2 }}>{e.remarks}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Evaluations;