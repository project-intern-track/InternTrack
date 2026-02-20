import { Filter, Search, Calendar, X } from 'lucide-react';
import { useState, useMemo, useRef } from 'react';
import '../../index.css';


// sample records
const sampleTasks = [
    {
        id: '1',
        title: 'MOBILE APP #1',
        description: 'This section contains the brief description of the project.',
        priority: 'low',
        assignedTo: 5,
        dueDate: '02/19/2026 - 11:59 PM',
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
    const [dueDateFilter, setDueDateFilter] = useState('All Due Date');
    const [priorityFilter, setPriorityFilter] = useState('All Priority');
    const [statusFilter, setStatusFilter] = useState('All Status');
    
    // modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // form state
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [priority, setPriority] = useState('');
    const [internSearch, setInternSearch] = useState('');
    const [selectedInterns, setSelectedInterns] = useState<string[]>([]);
    const [isInternSearchFocused, setIsInternSearchFocused] = useState(false);
    
    // ref for date input
    const dateInputRef = useRef<HTMLInputElement>(null);
    // ref for intern search input
    const internSearchInputRef = useRef<HTMLInputElement>(null);
    
    // Sample interns
    const sampleInterns = [
        'John Jones',
        'Lebron James',
        'Mike Enriquez',
        'Sarah Geronimo',
        'Totoy Brown',
        'Ant Davis'
    ];
   //intern search filter   
    const filteredInterns = useMemo(() => {
        if (!isInternSearchFocused) return [];
        
        if (!internSearch.trim()) {
            return sampleInterns.filter(intern => !selectedInterns.includes(intern));
        }
        
        return sampleInterns.filter(intern =>
            !selectedInterns.includes(intern) &&
            intern.toLowerCase().includes(internSearch.toLowerCase())
        );
    }, [internSearch, isInternSearchFocused, selectedInterns]);
    
    const handleInternSelect = (intern: string) => {
        if (!selectedInterns.includes(intern)) {
            setSelectedInterns([...selectedInterns, intern]);
        }
        setInternSearch('');
        setIsInternSearchFocused(false);
        internSearchInputRef.current?.blur();
    };
    
    // intern removal
    const handleInternRemove = (intern: string) => {
        setSelectedInterns(selectedInterns.filter(i => i !== intern));
    };
    // clear
    const handleClear = () => {
        setTaskTitle('');
        setTaskDescription('');
        setDueDate('');
        setDueTime('');
        setPriority('');
        setSelectedInterns([]);
        setInternSearch('');
    }; 
    // Handle assign
    const handleAssign = () => {
        // TODO: Connect to API
        console.log('Assign task:', {
            title: taskTitle,
            description: taskDescription,
            dueDate,
            dueTime,
            priority,
            assignedInterns: selectedInterns
        });
        setIsModalOpen(false);
        handleClear();
    };
    
    // Close modal
    const closeModal = () => {
        setIsModalOpen(false);
        handleClear();
    };

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'low':
                return {
                    backgroundColor: '#95b6e1',
                    color: '#082eae',
                    borderColor: '#93c5fd'
                };
            case 'medium':
                return {
                    backgroundColor: '#e6d9a6',
                    color: '#92400e',
                    borderColor: '#fcd34d'
                };
            case 'high':
                return {
                    backgroundColor: '#daadad',
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

    // Helper function to parse due date string to Date object
    const parseDueDate = (dueDateString: string): Date | null => {
        try {
            // Format: 'MM/DD/YYYY - HH:MM AM/PM'
            const datePart = dueDateString.split(' - ')[0]; 
            const [month, day, year] = datePart.split('/').map(Number);
            return new Date(year, month - 1, day); 
        } catch (error) {
            return null;
        }
    };

    // function to check if date is today
    const isToday = (date: Date): boolean => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    // Get all unique due dates from tasks and sort them
    const availableDueDates = useMemo(() => {
        const dateSet = new Set<string>();
        sampleTasks.forEach(task => {
            const datePart = task.dueDate.split(' - ')[0];
            dateSet.add(datePart);
        });
        
        // Convert to array and sort chronologically
        return Array.from(dateSet).sort((a, b) => {
            const [monthA, dayA, yearA] = a.split('/').map(Number);
            const [monthB, dayB, yearB] = b.split('/').map(Number);
            const dateA = new Date(yearA, monthA - 1, dayA);
            const dateB = new Date(yearB, monthB - 1, dayB);
            return dateA.getTime() - dateB.getTime();
        });
    }, []);

    // Filter tasks based on search and filters
    const filteredTasks = useMemo(() => {
        return sampleTasks.filter(task => {
            const searchLower = search.toLowerCase();
            const matchesSearch = search === '' || 
                task.title.toLowerCase().includes(searchLower) ||
                task.description.toLowerCase().includes(searchLower);

            const matchesPriority = priorityFilter === 'All Priority' ||
                task.priority.toLowerCase() === priorityFilter.toLowerCase();

            const matchesStatus = statusFilter === 'All Status' ||
                task.status === statusFilter;

            let matchesDueDate = true;
            if (dueDateFilter !== 'All Due Date') {
                const taskDueDate = parseDueDate(task.dueDate);
                if (!taskDueDate) {
                    matchesDueDate = false;
                } else if (dueDateFilter === 'Today') {
                    matchesDueDate = isToday(taskDueDate);
                } else {
                    const taskDatePart = task.dueDate.split(' - ')[0];
                    matchesDueDate = taskDatePart === dueDateFilter;
                }
            }

            return matchesSearch && matchesPriority && matchesStatus && matchesDueDate;
        });
    }, [search, priorityFilter, statusFilter, dueDateFilter]);

    return (
        <div>
         <style>{`
            input[type="datetime-local"]::-webkit-calendar-picker-indicator {
                display: none;
                -webkit-appearance: none;
            }
            input[type="datetime-local"]::-webkit-inner-spin-button,
            input[type="datetime-local"]::-webkit-clear-button {
                display: none;
                -webkit-appearance: none;
            }
            @media (max-width: 768px) {
                .manage-tasks-filter-row {
                    flex-direction: column !important;
                    align-items: stretch !important;
                }
                .manage-tasks-filter-label {
                    margin-bottom: 0.5rem;
                }
                .create-task-modal-content {
                    grid-template-columns: 1fr !important;
                }
                .create-task-modal-bottom {
                    grid-template-columns: 1fr !important;
                }
            }
            @media (max-width: 480px) {
                .manage-tasks-filter-row {
                    padding: 0.5rem !important;
                }
                .create-task-modal {
                    padding: 1.5rem !important;
                    margin: 0.5rem !important;
                }
                .create-task-modal-actions {
                    flex-direction: column !important;
                }
                .create-task-modal-actions button {
                    width: 100% !important;
                }
            }
        `}</style>
         <div className="row row-between" style={{ marginBottom: '2rem' }}>
            <h1 style={{ color: 'hsl(var(--orange))', margin: 0, fontSize: "31px"}}>Manage Tasks</h1>    
            <button 
                className='btn btn-primary' 
                style={{fontSize: "15px"}}
                onClick={() => setIsModalOpen(true)}
            >
                + Create Task
            </button>
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
         <Filter size={20} style={{ color: '#333' }} />
         <span style={{ fontWeight: 500, color: '#333' }}>Filters:</span>
       </div>

          <select 
            className="select" 
            style={{ 
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              minWidth: '150px',
            }}
            value={dueDateFilter}
            onChange={(e) => setDueDateFilter(e.target.value)}
          >
            <option>All Due Date</option>
            <option>Today</option>
            {availableDueDates.map((date) => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>

          <select 
            className="select" 
            style={{ 
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              minWidth: '150px',
            }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option>All Priority</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>

          <select 
            className="select" 
            style={{ 
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              minWidth: '150px',
            }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Status</option>
            <option>Not Started</option>
            <option>In Progress</option>
            <option>Rejected</option>
            <option>Pending</option>
            <option>Completed</option>
          </select>
        </div>

        <div className="grid-3" style={{ marginTop: '2rem' }}>
            {filteredTasks.map((task) => {
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
                        {/*title and prio*/}
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

                        {/*description*/}
                        <p style={{
                            fontSize: '0.875rem',
                            color: '#666',
                            lineHeight: '1.5',
                            marginBottom: '1.5rem',
                            flex: 1
                        }}>
                            {task.description}
                        </p>

                        {/*details*/}
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

                        {/*view details button*/}
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

        {/*Create task modal*/}
        {isModalOpen && (
            <div 
                className="modal-overlay"
                onClick={closeModal}
            >
                <div 
                    className="modal create-task-modal"
                    style={{
                        backgroundColor: '#e8ddd0',
                        maxWidth: '900px',
                        width: '100%',
                        padding: '2rem',
                        margin: '1rem',
                        position: 'relative'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/*Modal header*/}
                    <div style={{ 
                        marginBottom: '2rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h2 style={{ 
                            color: 'hsl(var(--orange))', 
                            margin: 0, 
                            fontSize: '1.5rem', 
                            fontWeight: 700 
                        }}>
                            Task Information
                        </h2>
                        <button
                            onClick={closeModal}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#666',
                                borderRadius: '4px',
                                transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="create-task-modal-content" style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '2rem',
                        marginBottom: '2rem'
                    }}>

                        <div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="label" style={{ marginBottom: '0.5rem' }}>
                                    <b>Task Title:</b>
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Enter task title"
                                    value={taskTitle}
                                    onChange={(e) => setTaskTitle(e.target.value)}
                                    style={{ backgroundColor: '#fff' }}
                                />
                            </div>

                            {/*Task desc*/}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="label" style={{ marginBottom: '0.5rem' }}>
                                    <b>Task Description:</b>
                                </label>
                                <textarea
                                    className="input"
                                    placeholder="Brief description of the task"
                                    value={taskDescription}
                                    onChange={(e) => setTaskDescription(e.target.value)}
                                    style={{ 
                                        backgroundColor: '#fff',
                                        minHeight: '120px',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>
                        </div>

                        {/*right column*/}
                        <div>
                            {/*Assign to Intern/s*/}
                            <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                                <label className="label" style={{ marginBottom: '0.5rem' }}>
                                    <b>Assign to Intern/s:</b>
                                </label>
                                <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                                    <Search
                                        size={20}
                                        style={{
                                            position: 'absolute',
                                            left: '0.875rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: 'hsl(var(--muted-foreground))',
                                            pointerEvents: 'none',
                                            zIndex: 10
                                        }}
                                    />
                                    <input
                                        ref={internSearchInputRef}
                                        type="text"
                                        className="input"
                                        placeholder="Search interns by name"
                                        value={internSearch}
                                        onChange={(e) => {
                                            setInternSearch(e.target.value);
                                            setIsInternSearchFocused(true);
                                        }}
                                        onFocus={() => setIsInternSearchFocused(true)}
                                        onBlur={() => {
                                            
                                            setTimeout(() => {
                                                const activeElement = document.activeElement;
                                                if (!activeElement || !activeElement.closest('.intern-dropdown')) {
                                                    setIsInternSearchFocused(false);
                                                }
                                            }, 200);
                                        }}
                                        style={{ 
                                            backgroundColor: '#fff',
                                            paddingLeft: '2.75rem',
                                            position: 'relative',
                                            zIndex: 1
                                        }}
                                    />
                                    
                                    {/* Intern search dropdown*/}
                                    {isInternSearchFocused && filteredInterns.length > 0 && (
                                        <div 
                                            className="intern-dropdown"
                                            style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                zIndex: 1000,
                                                backgroundColor: '#fff',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: 'var(--radius-md)',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                                maxHeight: '250px',
                                                overflowY: 'auto',
                                                marginTop: '0.25rem',
                                                width: '100%'
                                            }}
                                        >
                                            {filteredInterns.map((intern) => (
                                                <div
                                                    key={intern}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        handleInternSelect(intern);
                                                    }}
                                                    style={{
                                                        padding: '0.75rem 1rem',
                                                        cursor: 'pointer',
                                                        transition: 'background-color 0.2s ease',
                                                        borderBottom: '1px solid hsl(var(--border))'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'hsl(var(--muted))';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                    }}
                                                >
                                                    {intern}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/*Selected interns display*/}
                                <div style={{
                                    backgroundColor: '#fff',
                                    border: '1px solid hsl(var(--input))',
                                    borderRadius: 'var(--radius-md)',
                                    minHeight: '150px',
                                    padding: '1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem'
                                }}>
                                    {selectedInterns.length === 0 ? (
                                        <p style={{
                                            color: 'hsl(var(--muted-foreground))',
                                            fontSize: '0.875rem',
                                            margin: 0,
                                            fontStyle: 'italic'
                                        }}>
                                            List of selected interns will appear here
                                        </p>
                                    ) : (
                                        selectedInterns.map((intern) => (
                                            <div
                                                key={intern}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '0.5rem 0.75rem',
                                                    backgroundColor: 'hsl(var(--muted))',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontSize: '0.875rem'
                                                }}
                                            >
                                                <span>{intern}</span>
                                                <button
                                                    onClick={() => handleInternRemove(intern)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: '0.25rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        color: 'hsl(var(--danger))',
                                                        borderRadius: '4px'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'hsl(var(--danger) / 0.1)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                    }}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="create-task-modal-bottom" style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '2rem',
                        marginBottom: '2rem'
                    }}>
                        {/*Due Date*/}
                        <div>
                            <label className="label" style={{ marginBottom: '0.5rem' }}>
                               <b>Due Date:</b>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    ref={dateInputRef}
                                    type="datetime-local"
                                    className="input"
                                    value={dueDate && dueTime ? `${dueDate}T${dueTime}` : dueDate ? `${dueDate}T00:00` : ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value) {
                                            const [date, time] = value.split('T');
                                            setDueDate(date || '');
                                            setDueTime(time || '00:00');
                                        } else {
                                            setDueDate('');
                                            setDueTime('');
                                        }
                                    }}
                                    style={{ 
                                        backgroundColor: '#fff',
                                        paddingRight: '2.5rem',
                                        colorScheme: 'light'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        dateInputRef.current?.showPicker?.() || dateInputRef.current?.click();
                                    }}
                                    style={{
                                        position: 'absolute',
                                        right: '0.875rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '0.25rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'hsl(var(--muted-foreground))',
                                        borderRadius: '4px',
                                        transition: 'background-color 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <Calendar size={20} />
                                </button>
                            </div>
                        </div>

                        {/*Priority*/}
                        <div>
                            <label className="label" style={{ marginBottom: '0.5rem' }}>
                                <b>Priority:</b>
                            </label>
                            <select
                                className="select"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                style={{ backgroundColor: '#fff' }}
                            >
                                <option value="">Select priority</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    {/* Action buttons*/}
                    <div className="create-task-modal-actions" style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '1rem',
                        marginTop: '2rem',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={handleClear}
                            style={{
                                padding: '0.625rem 1.5rem',
                                backgroundColor: '#fff',
                                color: 'hsl(var(--orange))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                fontWeight: 500,
                                fontSize: '0.875rem',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f5f5f5';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#fff';
                            }}
                        >
                            Clear
                        </button>
                        <button
                            onClick={handleAssign}
                            className="btn btn-primary"
                            style={{
                                padding: '0.625rem 1.5rem',
                                fontSize: '0.875rem'
                            }}
                        >
                            Assign
                        </button>
                    </div>
                </div>
            </div>
        )}

       </div>
    );
};

export default ManageTasks;
