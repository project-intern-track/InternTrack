import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Search } from 'lucide-react';
import '../../index.css';

// Sample task data for UI display
const sampleTasks = [
    {
        id: '1',
        title: 'MOBILE APP #1',
        description: 'This section contains the brief description of the project.',
        priority: 'low',
        assignedTo: 5,
        dueDate: '02/27/2026 - 11:59 PM',
        status: 'In Progress'
    },
    {
        id: '2',
        title: 'MOBILE APP #2',
        description: 'This section contains the brief description of the project.',
        priority: 'low',
        assignedTo: 6,
        dueDate: '02/27/2026 - 11:59 PM',
        status: 'Not Started'
    },
    {
        id: '3',
        title: 'UI DESIGN #1',
        description: 'This section contains the brief description of the project.',
        priority: 'medium',
        assignedTo: 3,
        dueDate: '02/27/2026 - 11:59 PM',
        status: 'Completed'
    },
    {
        id: '4',
        title: 'WEBSITE #1',
        description: 'This section contains the brief description of the project.',
        priority: 'high',
        assignedTo: 8,
        dueDate: '02/27/2026 - 11:59 PM',
        status: 'Pending'
    },
    {
        id: '5',
        title: 'WEBSITE #2',
        description: 'This section contains the brief description of the project.',
        priority: 'high',
        assignedTo: 8,
        dueDate: '02/27/2026 - 11:59 PM',
        status: 'Rejected'
    }
];

const ManageTasks = () => {
    const [search, setSearch] = useState('');

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'low':
                return {
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    borderColor: '#93c5fd'
                };
            case 'medium':
                return {
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    borderColor: '#fcd34d'
                };
            case 'high':
                return {
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    borderColor: '#fca5a5'
                };
            default:
                return {
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    borderColor: '#d1d5db'
                };
        }
    };

    const getPriorityLabel = (priority: string) => {
        return priority.charAt(0).toUpperCase() + priority.slice(1) + ' Priority';
    };

    return (
        <div>
         <style>{`
            @media (max-width: 768px) {
                .manage-tasks-filter-row {
                    flex-direction: column !important;
                    align-items: stretch !important;
                }
                .manage-tasks-filter-label {
                    margin-bottom: 0.5rem;
                }
            }
            @media (max-width: 480px) {
                .manage-tasks-filter-row {
                    padding: 0.5rem !important;
                }
            }
        `}</style>
         <div className="row row-between" style={{ marginBottom: '2rem' }}>
            <h1 style={{ color: 'hsl(var(--orange))', margin: 0, fontSize: "32px"}}>Manage Tasks</h1>    
            <button className='btn btn-primary' style={{fontSize: "15px"}}>
                + Create Task</button>
         </div>
                
        <div style={{ marginTop: '20px', marginBottom: '1.5rem' }}>
         <div className="input-group" style={{ position: 'relative', width: '100%' }}>
            <Search
            size={20}
            style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'hsl(var(--muted-foreground))'
            }}
            />
           
            <input
            type="text"
            className="input"
            placeholder="Search Task"
            style={{
                paddingLeft: '3rem', 
                width: '100%',       
                boxSizing: 'border-box'
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            />
         </div>
        </div>

       <div className="row manage-tasks-filter-row" style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          backgroundColor: '#f5f5dc',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}>
       <div className="manage-tasks-filter-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
         <Menu size={20} style={{ color: '#333' }} />
         <span style={{ fontWeight: 500, color: '#333' }}>Filters:</span>
       </div>

          <select className="select" style={{ 
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            minWidth: '150px',
          }}>
            <option>All Due Date</option>
            <option>Today</option>
            <option>This Week</option>
          </select>

          <select className="select" style={{ 
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            minWidth: '150px',
          }}>
            <option>All Priority</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>

          <select className="select" style={{ 
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            minWidth: '150px',
          }}>
            <option>All Status</option>
            <option>Not Started</option>
            <option>In Progress</option>
            <option>Rejected</option>
            <option>Pending</option>
            <option>Completed</option>
          </select>
        </div>

        
        <div className="grid-3" style={{ marginTop: '2rem' }}>
            {sampleTasks.map((task) => {
                const priorityStyle = getPriorityStyle(task.priority);
                return (
                    <div
                        key={task.id}
                        className="card"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '1.5rem',
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                        }}
                    >
                        {/* title and prio */}
                        <div style={{ 
                            marginBottom: '1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '1rem'
                        }}>
                            <h3 style={{ 
                                fontSize: '1.125rem', 
                                fontWeight: 700, 
                                color: '#000',
                                margin: 0,
                                flex: 1
                            }}>
                                {task.title}
                            </h3>
                            <div
                                style={{
                                    display: 'inline-block',
                                    padding: '0.375rem 0.75rem',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    border: `1px solid ${priorityStyle.borderColor}`,
                                    whiteSpace: 'nowrap',
                                    ...priorityStyle
                                }}
                            >
                                {getPriorityLabel(task.priority)}
                            </div>
                        </div>

                        {/* description */}
                        <p style={{
                            fontSize: '0.875rem',
                            color: '#666',
                            lineHeight: '1.5',
                            marginBottom: '1.5rem',
                            flex: 1
                        }}>
                            {task.description}
                        </p>

                        {/* details */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            marginBottom: '1.5rem',
                            fontSize: '0.875rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#666' }}>Assigned to:</span>
                                <span style={{ fontWeight: 600, color: '#000' }}>
                                    {task.assignedTo} intern{task.assignedTo !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#666' }}>Due:</span>
                                <span style={{ fontWeight: 600, color: '#000' }}>
                                    {task.dueDate}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#666' }}>Status:</span>
                                <span style={{ fontWeight: 600, color: '#000' }}>
                                    {task.status}
                                </span>
                            </div>
                        </div>

                        {/* view details button */}
                        <button
                            className="btn btn-primary"
                            style={{
                                marginTop: 'auto',
                                fontSize: '0.875rem'
                            }}
                        >
                            View Details
                        </button>
                    </div>
                );
            })}
        </div>

       </div>
    );
};

export default ManageTasks;
