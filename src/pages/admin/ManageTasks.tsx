import { Filter, Search, Calendar, X, Loader2 } from 'lucide-react';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import '../../index.css';

import { taskService } from '../../services/taskServices';
import { userService } from '../../services/userServices';
import type { Tasks, TaskStatus, TaskPriority, Users } from '../../types/database.types';

const ManageTasks = () => {
    const [search, setSearch] = useState('');
    const [dueDateFilter, setDueDateFilter] = useState('All Due Date');
    const [priorityFilter, setPriorityFilter] = useState('All Priority');
    const [statusFilter, setStatusFilter] = useState('All Status');

    const [tasks, setTasks] = useState<Tasks[]>([]);
    const [interns, setInterns] = useState<Users[]>([]);
    const [selectedTask, setSelectedTask] = useState<Tasks | null>(null);
    const [isLoadingTasks, setIsLoadingTasks] = useState(true);

    // Reject modal state
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejecting, setRejecting] = useState(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [priority, setPriority] = useState('');
    const [dueDateError, setDueDateError] = useState('');
    const [internSearch, setInternSearch] = useState('');
    const [selectedInterns, setSelectedInterns] = useState<Users[]>([]);
    const [isInternSearchFocused, setIsInternSearchFocused] = useState(false);
    const [assigning, setAssigning] = useState(false);

    const dateInputRef = useRef<HTMLInputElement>(null);
    const internSearchInputRef = useRef<HTMLInputElement>(null);

    const fetchTasks = useCallback(async (showLoading = true, signal?: AbortSignal) => {
        if (showLoading) setIsLoadingTasks(true);
        try {
            const data = await taskService.getTasks(signal);
            if (signal?.aborted) return;
            setTasks(data);
        } catch (err) {
            const e = err as { name?: string; code?: string };
            if (e?.name === 'CanceledError' || e?.name === 'AbortError' || e?.code === 'ERR_CANCELED') return;
            console.error('Failed to fetch tasks:', err);
        } finally {
            if (!signal?.aborted && showLoading) setIsLoadingTasks(false);
        }
    }, []);

    const fetchInterns = useCallback(async (signal?: AbortSignal) => {
        try {
            const data = await userService.fetchInterns(undefined, { signal });
            if (signal?.aborted) return;
            setInterns(data.filter((u: Users) => u.status === 'active'));
        } catch (err) {
            const e = err as { name?: string; code?: string };
            if (e?.name === 'CanceledError' || e?.name === 'AbortError' || e?.code === 'ERR_CANCELED') return;
            console.error('Failed to fetch interns:', err);
        }
    }, []); 

    useEffect(() => {
        const controller = new AbortController();
        fetchTasks(true, controller.signal);
        fetchInterns(controller.signal);
        return () => controller.abort();
    }, [fetchTasks, fetchInterns]);

    const filteredInternOptions = useMemo(() => {
        if (!isInternSearchFocused) return [];
        const selectedIds = new Set(selectedInterns.map(i => i.id));
        return interns.filter(intern =>
            !selectedIds.has(intern.id) &&
            intern.full_name.toLowerCase().includes(internSearch.toLowerCase())
        );
    }, [internSearch, isInternSearchFocused, selectedInterns, interns]);

    const handleInternSelect = (intern: Users) => {
        setSelectedInterns(prev => [...prev, intern]);
        setInternSearch('');
        setIsInternSearchFocused(false);
        internSearchInputRef.current?.blur();
    };

    const handleInternRemove = (internId: string | number) => {
        setSelectedInterns(prev => prev.filter(i => i.id !== internId));
    };

    const handleClear = () => {
        setTaskTitle('');
        setTaskDescription('');
        setDueDate('');
        setDueTime('');
        setPriority('');
        setSelectedInterns([]);
        setInternSearch('');
        setDueDateError('');
    };

    const handleViewDetail = (task: Tasks) => setSelectedTask(task);
    const closeViewDetail = () => setSelectedTask(null);

    const openRejectModal = () => {
        setRejectionReason('');
        setRejectModalOpen(true);
    };

    const closeRejectModal = () => {
        setRejectModalOpen(false);
        setRejectionReason('');
    };

    const handleReject = async () => {
        if (!selectedTask || !rejectionReason.trim()) return;
        setRejecting(true);
        try {
            const updated = await taskService.rejectTask(selectedTask.id, rejectionReason.trim());
            setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
            setSelectedTask(updated);
            closeRejectModal();
        } catch (err) {
            console.error('Failed to reject task:', err);
            alert('Failed to reject task. Please try again.');
        } finally {
            setRejecting(false);
        }
    };

    const isFormValid = useMemo(() => {
        return taskTitle.trim() !== '' &&
               taskDescription.trim() !== '' &&
               dueDate !== '' &&
               priority !== '' &&
               selectedInterns.length > 0;
    }, [taskTitle, taskDescription, dueDate, priority, selectedInterns]);

    const handleAssign = async () => {
        try {
            if (!taskTitle.trim()) {
                alert('Please provide a task title.');
                return;
            }
            if (!taskDescription.trim()) {
                alert('Please provide a task description.');
                return;
            }
            if (!selectedInterns.length) {
                alert('Please assign at least one intern.');
                return;
            }
            if (!dueDate) {
                setDueDateError('Please select a due date.');
                return;
            }
            if (!priority) {
                alert('Please select a priority.');
                return;
            }

            // Prevent assigning tasks with a due date/time in the past
            const dueDateTimeString = `${dueDate}T${dueTime || '23:59'}:00`;
            const selectedDueDateTime = new Date(dueDateTimeString);
            const now = new Date();
            if (isNaN(selectedDueDateTime.getTime())) {
                setDueDateError('The selected due date and time is invalid.');
                return;
            }
            if (selectedDueDateTime.getTime() <= now.getTime()) {
                setDueDateError('Due date and time must be in the future.');
                return;
            }
            setDueDateError('');
            setAssigning(true);

            await taskService.createTask({
                title: taskTitle,
                description: taskDescription,
                due_date: dueDateTimeString,
                priority: priority as TaskPriority,
                intern_ids: selectedInterns.map(i => Number(i.id)),
            });

            // Refresh tasks without showing loading spinner (silent refresh)
            await fetchTasks(false);
            setIsModalOpen(false);
            handleClear();
        } catch (err) {
            console.error('Failed to create task:', err);
            alert('Failed to create task. Please try again.');
        } finally {
            setAssigning(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        handleClear();
    };

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'low':    return { backgroundColor: '#95b6e1', color: '#082eae', borderColor: '#93c5fd' };
            case 'medium': return { backgroundColor: '#e6d9a6', color: '#92400e', borderColor: '#fcd34d' };
            case 'high':   return { backgroundColor: '#daadad', color: '#991b1b', borderColor: '#fca5a5' };
            default:       return { backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#d1d5db' };
        }
    };

    const getPriorityLabel = (priority: string) =>
        priority.charAt(0).toUpperCase() + priority.slice(1) + ' Priority';

    const getStatusLabel = (status: TaskStatus) => {
        const map: Record<TaskStatus, string> = {
            not_started: 'Not Started',
            in_progress: 'In Progress',
            pending:     'Pending',
            completed:   'Completed',
            rejected:    'Rejected',
            overdue:     'Overdue',
        };
        return map[status] ?? status;
    };

    const getStatusStyle = (status: TaskStatus) => {
        switch (status) {
            case 'completed':
                return { backgroundColor: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' };
            case 'in_progress':
                return { backgroundColor: '#dbeafe', color: '#1d4ed8', borderColor: '#bfdbfe' };
            case 'not_started':
                return { backgroundColor: '#e5e7eb', color: '#4b5563', borderColor: '#d1d5db' };
            case 'pending':
                return { backgroundColor: '#fef3c7', color: '#b45309', borderColor: '#fde68a' };
            case 'overdue':
                return { backgroundColor: '#fee2e2', color: '#b91c1c', borderColor: '#fecaca' };
            case 'rejected':
                // Needs Revision
                return { backgroundColor: '#ffedd5', color: '#c2410c', borderColor: '#fed7aa' };
            default:
                return { backgroundColor: '#e5e7eb', color: '#374151', borderColor: '#d1d5db' };
        }
    };

    const parseDueDate = (dueDateString: string): Date | null => {
        try { return new Date(dueDateString); } catch { return null; }
    };

    const isToday = (date: Date): boolean => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const availableDueDates = useMemo(() => {
        const dateSet = new Set<string>();
        tasks.forEach(task => {
            const d = new Date(task.due_date);
            if (!isNaN(d.getTime())) {
                dateSet.add(d.toLocaleDateString('en-US'));
            }
        });
        return Array.from(dateSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        const filtered = tasks.filter(task => {
            const searchLower = search.toLowerCase();
            const matchesSearch = search === '' ||
                task.title.toLowerCase().includes(searchLower) ||
                (task.description ?? '').toLowerCase().includes(searchLower);

            const matchesPriority = priorityFilter === 'All Priority' ||
                task.priority.toLowerCase() === priorityFilter.toLowerCase();

            const matchesStatus = statusFilter === 'All Status' ||
                getStatusLabel(task.status) === statusFilter;

            let matchesDueDate = true;
            if (dueDateFilter !== 'All Due Date') {
                const taskDueDate = parseDueDate(task.due_date);
                if (!taskDueDate) {
                    matchesDueDate = false;
                } else if (dueDateFilter === 'Today') {
                    matchesDueDate = isToday(taskDueDate);
                } else {
                    matchesDueDate = taskDueDate.toLocaleDateString('en-US') === dueDateFilter;
                }
            }

            return matchesSearch && matchesPriority && matchesStatus && matchesDueDate;
        });

        // Sort by upcoming due date (earliest first)
        return filtered.slice().sort((a, b) => {
            const aDate = parseDueDate(a.due_date);
            const bDate = parseDueDate(b.due_date);

            if (!aDate && !bDate) return 0;
            if (!aDate) return 1;
            if (!bDate) return -1;

            return aDate.getTime() - bDate.getTime();
        });
    }, [tasks, search, priorityFilter, statusFilter, dueDateFilter]);

    return (
        <div>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                input[type="datetime-local"]::-webkit-calendar-picker-indicator { display: none; -webkit-appearance: none; }
                input[type="datetime-local"]::-webkit-inner-spin-button,
                input[type="datetime-local"]::-webkit-clear-button { display: none; -webkit-appearance: none; }
                
                /* Task Detail Modal Styles */
                .task-detail-modal {
                    width: 90%;
                    max-width: 600px;
                    padding: 2rem;
                    position: relative;
                }
                
                .task-detail-header {
                    margin-bottom: 1.5rem;
                }
                
                .task-detail-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: hsl(var(--foreground));
                    margin: 0 0 0.5rem 0;
                }
                
                .task-detail-description {
                    color: hsl(var(--muted-foreground));
                    line-height: 1.6;
                    margin-bottom: 2rem;
                }
                
                .task-detail-info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    padding: 1.5rem;
                    background-color: hsl(var(--muted));
                    border-radius: var(--radius-lg);
                    margin-bottom: 1.5rem;
                    border: 1px solid hsl(var(--border));
                }
                
                .task-detail-info-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                
                .task-detail-info-label {
                    font-size: 0.75rem;
                    color: hsl(var(--muted-foreground));
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 600;
                }
                
                .task-detail-info-value {
                    font-weight: 600;
                    color: hsl(var(--foreground));
                    font-size: 0.875rem;
                }
                
                .task-detail-rejection-box {
                    padding: 1rem;
                    background-color: hsl(var(--danger) / 0.1);
                    border: 1px solid hsl(var(--danger) / 0.3);
                    border-radius: var(--radius-md);
                    margin-bottom: 1.5rem;
                }
                
                .task-detail-rejection-label {
                    font-size: 0.75rem;
                    color: hsl(var(--danger));
                    font-weight: 700;
                    text-transform: uppercase;
                    display: block;
                    margin-bottom: 0.5rem;
                    letter-spacing: 0.05em;
                }
                
                .task-detail-rejection-text {
                    margin: 0;
                    color: hsl(var(--danger));
                    font-size: 0.875rem;
                    line-height: 1.5;
                }
                
                .task-detail-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                    margin-top: 1.5rem;
                }
                
                
                @media (max-width: 768px) {
                    .manage-tasks-filter-row { flex-direction: column !important; align-items: stretch !important; }
                    .create-task-modal-content { grid-template-columns: 1fr !important; }
                    .create-task-modal-bottom { grid-template-columns: 1fr !important; }
                    .task-detail-info-grid { grid-template-columns: 1fr; }
                    .task-detail-modal { padding: 1.5rem; }
                }
                @media (max-width: 480px) {
                    .create-task-modal { padding: 1.5rem !important; margin: 0.5rem !important; }
                    .create-task-modal-actions { flex-direction: column !important; }
                    .create-task-modal-actions button { width: 100% !important; }
                    .task-detail-actions { flex-direction: column; }
                    .task-detail-actions button { width: 100%; }
                    .task-detail-modal { padding: 1.25rem; max-width: 95vw; }
                }
            `}</style>

            <div className="row row-between" style={{ marginBottom: '2rem' }}>
                <h1 style={{ color: 'hsl(var(--orange))', margin: 0, fontSize: '31px' }}>Manage Tasks</h1>
                <button className="btn btn-primary" style={{ fontSize: '15px' }} onClick={() => setIsModalOpen(true)}>
                    + Create Task
                </button>
            </div>

            <div style={{ marginTop: '20px', marginBottom: '1.5rem' }}>
                <div className="input-group" style={{ position: 'relative', width: '100%' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                    <input type="text" className="input" placeholder="Search Task"
                        style={{ paddingLeft: '3rem', width: '100%', boxSizing: 'border-box' }}
                        value={search} onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="row manage-tasks-filter-row" style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: '#f5f5dc', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div className="manage-tasks-filter-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={20} style={{ color: '#333' }} />
                    <span style={{ fontWeight: 500, color: '#333' }}>Filters:</span>
                </div>
                <select className="select" style={{ backgroundColor: '#fff', border: '1px solid #ccc', minWidth: '150px' }}
                    value={dueDateFilter} onChange={(e) => setDueDateFilter(e.target.value)}>
                    <option>All Due Date</option>
                    <option>Today</option>
                    {availableDueDates.map(date => <option key={date} value={date}>{date}</option>)}
                </select>
                <select className="select" style={{ backgroundColor: '#fff', border: '1px solid #ccc', minWidth: '150px' }}
                    value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                    <option>All Priority</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                </select>
                <select className="select" style={{ backgroundColor: '#fff', border: '1px solid #ccc', minWidth: '150px' }}
                    value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option>All Status</option>
                    <option>Not Started</option>
                    <option>In Progress</option>
                    <option>Rejected</option>
                    <option>Pending</option>
                    <option>Completed</option>
                    <option>Overdue</option>
                </select>
            </div>

            <div className="grid-3" style={{ marginTop: '2rem' }}>
                {isLoadingTasks && tasks.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', paddingTop: '3rem', paddingBottom: '3rem' }}>
                        <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid hsl(var(--orange))', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        <p style={{ color: '#666', marginTop: '1rem', fontSize: '0.875rem' }}>Loading tasks...</p>
                    </div>
                ) : (
                    <>
                        {filteredTasks.map((task) => {
                            const priorityStyle = getPriorityStyle(task.priority);
                            const statusStyle = getStatusStyle(task.status);
                            return (
                                <div key={task.id} className="card"
                                    onClick={() => handleViewDetail(task)}
                                    style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'pointer' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
                                >
                                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#000', margin: 0, flex: 1 }}>{task.title}</h3>
                                        <div style={{ display: 'inline-block', padding: '0.375rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, border: `1px solid ${priorityStyle.borderColor}`, whiteSpace: 'nowrap', ...priorityStyle }}>
                                            {getPriorityLabel(task.priority)}
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.875rem', color: '#666', lineHeight: '1.5', marginBottom: '1.5rem', flex: 1 }}>
                                        {task.description}
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#666' }}>Assigned to:</span>
                                            <span style={{ fontWeight: 600, color: '#000' }}>{task.assigned_interns_count} intern{task.assigned_interns_count !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#666' }}>Date Created:</span>
                                            <span style={{ fontWeight: 600, color: '#000' }}>{new Date(task.created_at).toLocaleDateString('en-US')}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#666' }}>Due:</span>
                                            <span style={{ fontWeight: 600, color: '#000' }}>{new Date(task.due_date).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#666' }}>Status:</span>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    backgroundColor: statusStyle.backgroundColor,
                                                    color: statusStyle.color,
                                                    border: `1px solid ${statusStyle.borderColor}`,
                                                }}
                                            >
                                                {getStatusLabel(task.status)}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="btn btn-primary" style={{ marginTop: 'auto', fontSize: '0.875rem' }}>View Details</button>
                                </div>
                            );
                        })}
                        {filteredTasks.length === 0 && !isLoadingTasks && (
                            <p style={{ color: '#888', gridColumn: '1 / -1', textAlign: 'center', paddingTop: '2rem' }}>No tasks found.</p>
                        )}
                    </>
                )}
            </div>

            {/* Create Task Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal create-task-modal"
                        style={{ backgroundColor: '#e8ddd0', maxWidth: '900px', width: '100%', padding: '2rem', margin: '1rem', position: 'relative' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ color: 'hsl(var(--orange))', margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Task Information</h2>
                            <button onClick={closeModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', color: '#666', borderRadius: '4px' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="create-task-modal-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                            <div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label className="label" style={{ marginBottom: '0.5rem' }}><b>Task Title:</b></label>
                                    <input type="text" className="input" placeholder="Enter task title"
                                        value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                                        style={{ backgroundColor: '#fff' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label className="label" style={{ marginBottom: '0.5rem' }}><b>Task Description:</b></label>
                                    <textarea className="input" placeholder="Brief description of the task"
                                        value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)}
                                        style={{ backgroundColor: '#fff', minHeight: '120px', resize: 'vertical' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                                    <label className="label" style={{ marginBottom: '0.5rem' }}><b>Assign to Intern/s:</b></label>
                                    <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                                        <Search size={20} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))', pointerEvents: 'none', zIndex: 10 }} />
                                        <input ref={internSearchInputRef} type="text" className="input"
                                            placeholder="Search interns by name"
                                            value={internSearch}
                                            onChange={(e) => { setInternSearch(e.target.value); setIsInternSearchFocused(true); }}
                                            onFocus={() => setIsInternSearchFocused(true)}
                                            onBlur={() => setTimeout(() => { if (!document.activeElement?.closest('.intern-dropdown')) setIsInternSearchFocused(false); }, 200)}
                                            style={{ backgroundColor: '#fff', paddingLeft: '2.75rem' }}
                                        />
                                        {isInternSearchFocused && filteredInternOptions.length > 0 && (
                                            <div className="intern-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, backgroundColor: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', maxHeight: '250px', overflowY: 'auto', marginTop: '0.25rem' }}>
                                                {filteredInternOptions.map((intern) => (
                                                    <div key={intern.id}
                                                        onMouseDown={(e) => { e.preventDefault(); handleInternSelect(intern); }}
                                                        style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid hsl(var(--border))' }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                    >
                                                        {intern.full_name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ backgroundColor: '#fff', border: '1px solid hsl(var(--input))', borderRadius: 'var(--radius-md)', minHeight: '150px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {selectedInterns.length === 0 ? (
                                            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem', margin: 0, fontStyle: 'italic' }}>List of selected interns will appear here</p>
                                        ) : (
                                            selectedInterns.map((intern) => (
                                                <div key={intern.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: 'hsl(var(--muted))', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
                                                    <span>{intern.full_name}</span>
                                                    <button onClick={() => handleInternRemove(intern.id)}
                                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', color: 'hsl(var(--danger))', borderRadius: '4px' }}>
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="create-task-modal-bottom" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                            <div>
                                {dueDateError && (
                                    <p style={{ marginBottom: '0.35rem', fontSize: '0.8rem', color: 'hsl(var(--danger))', fontWeight: 500 }}>
                                        {dueDateError}
                                    </p>
                                )}
                                <label className="label" style={{ marginBottom: '0.5rem' }}><b>Due Date:</b></label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        ref={dateInputRef}
                                        type="datetime-local"
                                        className="input"
                                        value={dueDate && dueTime ? `${dueDate}T${dueTime}` : dueDate ? `${dueDate}T00:00` : ''}
                                        min={new Date().toISOString().slice(0, 16)}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value) {
                                                const [d, t] = value.split('T');
                                                setDueDate(d || '');
                                                setDueTime(t || '00:00');
                                            } else {
                                                setDueDate('');
                                                setDueTime('');
                                            }
                                            if (dueDateError) {
                                                setDueDateError('');
                                            }
                                        }}
                                        style={{ backgroundColor: '#fff', paddingRight: '2.5rem', colorScheme: 'light' }}
                                    />
                                    <button type="button" onClick={() => dateInputRef.current?.showPicker?.()}
                                        style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', color: 'hsl(var(--muted-foreground))' }}>
                                        <Calendar size={20} />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="label" style={{ marginBottom: '0.5rem' }}><b>Priority:</b></label>
                                <select className="select" value={priority} onChange={(e) => setPriority(e.target.value)} style={{ backgroundColor: '#fff' }}>
                                    <option value="">Select priority</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>

                        <div className="create-task-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <button onClick={handleClear}
                                style={{ padding: '0.625rem 1.5rem', backgroundColor: '#fff', color: 'hsl(var(--orange))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>
                                Clear
                            </button>
                            <button 
                                onClick={handleAssign} 
                                className="btn btn-primary" 
                                disabled={!isFormValid || assigning}
                                style={{ 
                                    padding: '0.625rem 1.5rem', 
                                    fontSize: '0.875rem',
                                    opacity: isFormValid && !assigning ? 1 : 0.5,
                                    cursor: isFormValid && !assigning ? 'pointer' : 'not-allowed',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                {assigning && <Loader2 size={16} className="spinner" style={{ flexShrink: 0 }} />}
                                {assigning ? 'Assigning...' : 'Assign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Detail Modal */}
            {selectedTask && (
                <div className="modal-overlay" onClick={closeViewDetail}>
                    <div className="modal task-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="task-detail-header">
                            <h2 className="task-detail-title">{selectedTask.title}</h2>
                            <span
                                className="badge"
                                style={{
                                    backgroundColor: getStatusStyle(selectedTask.status).backgroundColor,
                                    color: getStatusStyle(selectedTask.status).color,
                                    border: `1px solid ${getStatusStyle(selectedTask.status).borderColor}`,
                                }}
                            >
                                {getStatusLabel(selectedTask.status)}
                            </span>
                        </div>
                        <p className="task-detail-description">{selectedTask.description || 'No description provided.'}</p>
                        <div className="task-detail-info-grid">
                            <div className="task-detail-info-item">
                                <span className="task-detail-info-label">Assigned To</span>
                                <span className="task-detail-info-value">
                                    {selectedTask.assigned_interns?.map(i => i.full_name).join(', ') || `${selectedTask.assigned_interns_count} intern(s)`}
                                </span>
                            </div>
                            <div className="task-detail-info-item">
                                <span className="task-detail-info-label">Due Date</span>
                                <span className="task-detail-info-value">{new Date(selectedTask.due_date).toLocaleDateString()}</span>
                            </div>
                            <div className="task-detail-info-item">
                                <span className="task-detail-info-label">Priority</span>
                                <span className="task-detail-info-value">{getPriorityLabel(selectedTask.priority)}</span>
                            </div>
                            <div className="task-detail-info-item">
                                <span className="task-detail-info-label">Created By</span>
                                <span className="task-detail-info-value">{selectedTask.creator?.full_name ?? '—'}</span>
                            </div>
                        </div>

                        {/* Show existing rejection reason if already rejected */}
                        {selectedTask.status === 'rejected' && selectedTask.rejection_reason && (
                            <div className="task-detail-rejection-box">
                                <span className="task-detail-rejection-label">Rejection Reason</span>
                                <p className="task-detail-rejection-text">{selectedTask.rejection_reason}</p>
                            </div>
                        )}

                        <div className="task-detail-actions">
                            <button onClick={closeViewDetail} className="btn btn-primary">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Confirmation Modal */}
            {rejectModalOpen && selectedTask && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
                    <div style={{ backgroundColor: '#fff', width: '90%', maxWidth: '460px', borderRadius: '16px', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                        onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 800, color: '#dc2626' }}>Reject Task</h2>
                        <p style={{ margin: '0 0 1.5rem', color: '#555', fontSize: '0.9rem' }}>{selectedTask.title}</p>

                        <label style={{ fontWeight: 700, fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                            Reason for rejection <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Explain why this task is being rejected..."
                            style={{ width: '100%', minHeight: '100px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box' }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button onClick={closeRejectModal} style={{ padding: '0.625rem 1.25rem', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={rejecting || !rejectionReason.trim()}
                                style={{ padding: '0.625rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: rejectionReason.trim() ? '#dc2626' : '#fca5a5', color: '#fff', fontWeight: 700, cursor: rejectionReason.trim() ? 'pointer' : 'not-allowed', opacity: rejecting ? 0.7 : 1 }}
                            >
                                {rejecting ? 'Rejecting…' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageTasks;
