import { Filter, Search, Calendar, X, Loader2 } from 'lucide-react';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import '../../index.css';

import { taskService } from '../../services/taskServices';
import { userService } from '../../services/userServices';
import type { Tasks, TaskStatus, TaskPriority, Users } from '../../types/database.types';

const TECH_STACK_CATEGORIES = [
    'All Category',
    'Frontend Development',
    'Backend Development',
    'Database Management',
    'API & Integration',
    'DevOps & Deployment',
    'Mobile Development',
    'Testing',
    'Project Management',
    'UI/UX Design',
] as const;

const TOOLS_PER_PAGE = 9;

const TOOLS_BY_CATEGORY: Record<(typeof TECH_STACK_CATEGORIES)[number], string[]> = {
    'Frontend Development': [
        'HTML',
        'CSS',
        'JavaScript',
        'React.js',
        'Next.js',
        'Vue.js',
        'Angular',
        'Typescript',
        'Bootstrap',
        'Tailwind CSS',
    ],
    'Backend Development': [
        'Node.js',
        'Express.js',
        'Laravel',
        'PHP',
        'Django',
        'Flask',
        'Spring Boot',
        'ASP.NET',
    ],
    'Database Management': [
        'MySQL',
        'PostgreSQL',
        'MongoDB',
        'Firebase',
        'SQLite',
        'Oracle DB',
    ],
    'API & Integration': [
        'REST API',
        'GraphQL',
        'Postman',
        'Swagger / OpenAPI',
        'OAuth / Authentication',
    ],
    'DevOps & Deployment': [
        'Git / Github',
        'Docker',
        'Kubernetes',
        'Jenkins',
        'Vercel',
        'AWS',
        'Azure',
    ],
    'Mobile Development': [
        'React Native',
        'Flutter',
        'Android (Java)',
        'Android (Kotlin)',
        'Swift (iOS)',
    ],
    Testing: [
        'Selenium',
        'Jest',
        'Mocha',
        'Cypress',
        'JUnit',
    ],
    'Project Management': [
        'Jira',
        'Trello',
        'Asana',
        'ClickUp',
        'Monday.com',
        'Notion',
        'GitHub Projects',
        'GitLab Boards',
        'Scrum / Agile Methodology',
        'Kanban',
    ],
    'UI/UX Design': [
        'Figma',
        'Adobe XD',
        'Sketch',
        'InVision',
        'Hotjar',
        'Maze',
        'UserTesting',
        'Zeplin',
        'Miro',
        'Notion',
    ],
    'All Category': [
        'HTML',
        'CSS',
        'JavaScript',
        'React.js',
        'Next.js',
        'Vue.js',
        'Angular',
        'Typescript',
        'Bootstrap',
        'Tailwind CSS',
        'Node.js',
        'Express.js',
        'Laravel',
        'PHP',
        'Django',
        'Flask',
        'Spring Boot',
        'ASP.NET',
        'MySQL',
        'PostgreSQL',
        'MongoDB',
        'Firebase',
        'SQLite',
        'Oracle DB',
        'REST API',
        'GraphQL',
        'Postman',
        'Swagger / OpenAPI',
        'OAuth / Authentication',
        'Git / Github',
        'Docker',
        'Kubernetes',
        'Jenkins',
        'Vercel',
        'AWS',
        'Azure',
        'React Native',
        'Flutter',
        'Android (Java)',
        'Android (Kotlin)',
        'Swift (iOS)',
        'Selenium',
        'Jest',
        'Mocha',
        'Cypress',
        'JUnit',
        'Jira',
        'Trello',
        'Asana',
        'ClickUp',
        'Monday.com',
        'Notion',
        'GitHub Projects',
        'GitLab Boards',
        'Scrum / Agile Methodology',
        'Kanban',
        'Adobe Photoshop',
        'Adobe Illustrator',
        'Figma',
        'Canva',
        'GIMP',
        'CorelDRAW',
        'Sketch',
        'InVision',
        'Hotjar',
        'Maze',
        'UserTesting',
        'Zeplin',
        'Miro',
    ],
};

const ManageTasks = () => {
    const [search, setSearch] = useState('');
    const [dueDateFilter, setDueDateFilter] = useState('All Due Date');
    const [priorityFilter, setPriorityFilter] = useState('All Priority');
    const [statusFilter, setStatusFilter] = useState('All Status');

    const [tasks, setTasks] = useState<Tasks[]>([]);
    const [interns, setInterns] = useState<Users[]>([]);
    const [selectedTask, setSelectedTask] = useState<Tasks | null>(null);
    const [isLoadingTasks, setIsLoadingTasks] = useState(true);

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejecting, setRejecting] = useState(false);
    const [archiving, setArchiving] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [priority, setPriority] = useState('');
    const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
    const [techCategory, setTechCategory] = useState<(typeof TECH_STACK_CATEGORIES)[number]>('All Category');
    const [dueDateError, setDueDateError] = useState('');
    const [internSearch, setInternSearch] = useState('');
    const [selectedInterns, setSelectedInterns] = useState<Users[]>([]);
    const [isInternSearchFocused, setIsInternSearchFocused] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [editingTask, setEditingTask] = useState<Tasks | null>(null);
    const [selectedTools, setSelectedTools] = useState<string[]>([]);
    const [toolsPage, setToolsPage] = useState(1);

    // Toast notification state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({ message: '', type: 'error', visible: false });
    const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'error') => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToast({ message, type, visible: true });
        toastTimeoutRef.current = setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 4000);
    };

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

    const toggleToolSelection = (tool: string) => {
        setSelectedTools(prev =>
            prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
        );
    };

    const handleClear = () => {
        setEditingTask(null);
        setTaskTitle('');
        setTaskDescription('');
        setDueDate('');
        setDueTime('');
        setPriority('');
        setIsPriorityDropdownOpen(false);
        setTechCategory('All Category');
        setSelectedInterns([]);
        setInternSearch('');
        setDueDateError('');
        setSelectedTools([]);
    };

    const handleViewDetail = (task: Tasks) => setSelectedTask(task);
    const closeViewDetail = () => setSelectedTask(null);

    const closeRejectModal = () => {
        setRejectModalOpen(false);
        setRejectionReason('');
    };


    const handleArchive = async () => {
        if (!selectedTask) return;
        if (!window.confirm('Archive this task? This cannot be undone.')) return;
        setArchiving(true);
        try {
            await taskService.deleteTask(selectedTask.id);
            setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
            closeViewDetail();
        } catch (err) {
            console.error('Failed to archive task:', err);
        } finally {
            setArchiving(false);
        }
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
            showToast('Failed to reject task. Please try again.');
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
                showToast('Please provide a task title.');
                    return;
                }
            if (!taskDescription.trim()) {
                showToast('Please provide a task description.');
                return;
            }
            if (!selectedInterns.length) {
                showToast('Please assign at least one intern.');
                return;
            }
            if (!dueDate) {
                setDueDateError('Please select a due date.');
                return;
            }
            if (!priority) {
                showToast('Please select a priority.');
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

            if (editingTask) {
                await taskService.updateTask(editingTask.id, {
                    title: taskTitle,
                    description: taskDescription,
                    due_date: dueDateTimeString,
                    priority: priority as TaskPriority,
                    status: 'pending_approval',
                    intern_ids: selectedInterns.map(i => Number(i.id)),
                    tech_stack_categories: techCategory === 'All Category' ? null : [techCategory],
                    tools: selectedTools.length ? selectedTools : null,
                });
            } else {
                await taskService.createTask({
                    title: taskTitle,
                    description: taskDescription,
                    due_date: dueDateTimeString,
                    priority: priority as TaskPriority,
                    intern_ids: selectedInterns.map(i => Number(i.id)),
                    tech_stack_categories: techCategory === 'All Category' ? undefined : [techCategory],
                    tools: selectedTools.length ? selectedTools : undefined,
                });
            }

            // Refresh tasks without showing loading spinner (silent refresh)
            await fetchTasks(false);
            setIsModalOpen(false);
            handleClear();
        } catch (err) {
            console.error('Failed to create task:', err);
            showToast('Failed to create task. Please try again.');
        } finally {
            setAssigning(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        handleClear();
    };

    const openCreateModal = () => {
        handleClear();
        setIsModalOpen(true);
    };

    const startEditTask = (task: Tasks) => {
        setEditingTask(task);
        setTaskTitle(task.title);
        setTaskDescription(task.description ?? '');
        setPriority(task.priority ?? '');

        const due = new Date(task.due_date);
        if (!Number.isNaN(due.getTime())) {
            const iso = due.toISOString();
            const datePart = iso.slice(0, 10);
            const timePart = iso.slice(11, 16);
            setDueDate(datePart);
            setDueTime(timePart);
        } else {
            setDueDate('');
            setDueTime('');
        }

        const assignedIds = new Set(task.assigned_interns?.map(i => i.id));
        const preselected = interns.filter(i => assignedIds.has(Number(i.id)));
        setSelectedInterns(preselected);
        setTechCategory((task.tech_stack_categories?.[0] as (typeof TECH_STACK_CATEGORIES)[number]) ?? 'All Category');
        setSelectedTools(task.tools ?? []);
        setDueDateError('');
        setIsModalOpen(true);
    };

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'low': return { backgroundColor: '#95b6e1', color: '#082eae', borderColor: '#93c5fd' };
            case 'medium': return { backgroundColor: '#e6d9a6', color: '#92400e', borderColor: '#fcd34d' };
            case 'high': return { backgroundColor: '#daadad', color: '#991b1b', borderColor: '#fca5a5' };
            default: return { backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#d1d5db' };
        }
    };

    const getPriorityLabel = (priority: string) =>
        priority.charAt(0).toUpperCase() + priority.slice(1) + ' Priority';

    const getStatusLabel = (status: TaskStatus) => {
        const map: Record<TaskStatus, string> = {
            pending_approval: 'For checking',
            needs_revision: 'For revision',
            not_started: 'Not Started',
            in_progress: 'In Progress',
            pending: 'Pending',
            completed: 'Completed',
            rejected: 'Rejected',
            overdue: 'Overdue',
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
                return { backgroundColor: '#ffedd5', color: '#c2410c', borderColor: '#fed7aa' };
            case 'pending_approval':
                return { backgroundColor: '#e0e7ff', color: '#3730a3', borderColor: '#c7d2fe' };
            case 'needs_revision':
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

    const availableTools = useMemo(() => {
        const tools = TOOLS_BY_CATEGORY[techCategory] ?? [];
        return Array.from(new Set(tools));
    }, [techCategory]);

    const toolsMaxPage = useMemo(
        () => Math.max(1, Math.ceil(availableTools.length / TOOLS_PER_PAGE || 1)),
        [availableTools.length]
    );

    useEffect(() => {
        setToolsPage(1);
    }, [techCategory]);

    useEffect(() => {
        if (availableTools.length === 0) {
            setToolsPage(1);
            return;
        }
        if (toolsPage > toolsMaxPage) {
            setToolsPage(toolsMaxPage);
        }
    }, [availableTools.length, toolsMaxPage, toolsPage]);

    const paginatedTools = useMemo(() => {
        const start = (toolsPage - 1) * TOOLS_PER_PAGE;
        return availableTools.slice(start, start + TOOLS_PER_PAGE);
    }, [availableTools, toolsPage]);

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
                    max-width: 640px;
                    padding: 2rem 2.25rem;
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
                <button className="btn btn-primary" style={{ fontSize: '15px' }} onClick={openCreateModal}>
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
                    <option>For checking</option>
                    <option>For revision</option>
                    <option>Not Started</option>
                    <option>In Progress</option>
                    <option>Pending</option>
                    <option>Completed</option>
                    <option>Overdue</option>
                    <option>Rejected</option>
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
                        style={{ backgroundColor: '#e8ddd0', maxWidth: '880px', width: '100%', padding: '1.25rem', margin: '0.75rem', position: 'relative' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ color: 'hsl(var(--orange))', margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Task Information</h2>
                            <button onClick={closeModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', color: '#666', borderRadius: '4px' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="create-task-modal-content" style={{ display: 'grid', gridTemplateColumns: '1.05fr 1.05fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                            <div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="label" style={{ marginBottom: '0.5rem' }}><b>Task Title:</b></label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Enter task title"
                                        value={taskTitle}
                                        onChange={(e) => setTaskTitle(e.target.value)}
                                        style={{ backgroundColor: '#fff' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="label" style={{ marginBottom: '0.5rem' }}><b>Task Description:</b></label>
                                    <textarea
                                        className="input"
                                        placeholder="Brief description of the task"
                                        value={taskDescription}
                                        onChange={(e) => setTaskDescription(e.target.value)}
                                        style={{ backgroundColor: '#fff', minHeight: '100px', resize: 'vertical' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem', position: 'relative' }}>
                                    <label className="label" style={{ marginBottom: '0.5rem' }}><b>Assign to Intern/s:</b></label>
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
                                                zIndex: 10,
                                            }}
                                        />
                                        <input
                                            ref={internSearchInputRef}
                                            type="text"
                                            className="input"
                                            placeholder="Search interns by name"
                                            value={internSearch}
                                            onChange={(e) => { setInternSearch(e.target.value); setIsInternSearchFocused(true); }}
                                            onFocus={() => setIsInternSearchFocused(true)}
                                            onBlur={() =>
                                                setTimeout(() => {
                                                    if (!document.activeElement?.closest('.intern-dropdown')) setIsInternSearchFocused(false);
                                                }, 200)
                                            }
                                            style={{ backgroundColor: '#fff', paddingLeft: '2.75rem' }}
                                        />
                                        {isInternSearchFocused && filteredInternOptions.length > 0 && (
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
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                    maxHeight: '250px',
                                                    overflowY: 'auto',
                                                    marginTop: '0.25rem',
                                                }}
                                            >
                                                {filteredInternOptions.map((intern) => (
                                                    <div
                                                        key={intern.id}
                                                        onMouseDown={(e) => { e.preventDefault(); handleInternSelect(intern); }}
                                                        style={{
                                                            padding: '0.75rem 1rem',
                                                            cursor: 'pointer',
                                                            borderBottom: '1px solid hsl(var(--border))',
                                                        }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'hsl(var(--muted))'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                    >
                                                        {intern.full_name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        style={{
                                            backgroundColor: '#fff',
                                            border: '1px solid hsl(var(--input))',
                                            borderRadius: 'var(--radius-md)',
                                            minHeight: '170px',
                                            padding: '0.75rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.5rem',
                                        }}
                                    >
                                        {selectedInterns.length === 0 ? (
                                            <p
                                                style={{
                                                    color: 'hsl(var(--muted-foreground))',
                                                    fontSize: '0.875rem',
                                                    margin: 0,
                                                    fontStyle: 'italic',
                                                }}
                                            >
                                                List of selected interns will appear here
                                            </p>
                                        ) : (
                                            selectedInterns.map((intern) => (
                                                <div
                                                    key={intern.id}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '0.5rem 0.75rem',
                                                        backgroundColor: 'hsl(var(--muted))',
                                                        borderRadius: 'var(--radius-sm)',
                                                        fontSize: '0.875rem',
                                                    }}
                                                >
                                                    <span>{intern.full_name}</span>
                                                    <button
                                                        onClick={() => handleInternRemove(intern.id)}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: '0.25rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            color: 'hsl(var(--danger))',
                                                            borderRadius: '4px',
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

                            <div className="create-task-modal-bottom" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                                <div style={{ marginBottom: '0.25rem' }}>
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
                                <div style={{ marginBottom: '0.25rem' }}>
                                    <label className="label" style={{ marginBottom: '0.5rem' }}><b>Priority:</b></label>
                                    <div
                                        style={{ position: 'relative' }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setIsPriorityDropdownOpen((prev) => !prev)}
                                            style={{
                                                width: '100%',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid hsl(var(--input))',
                                                backgroundColor: '#fff',
                                                padding: '0.55rem 0.9rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-start',
                                                gap: '0.6rem',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                color: '#111827',
                                            }}
                                        >
                                            {priority ? (
                                                <>
                                                    <span
                                                        style={{
                                                            width: '12px',
                                                            height: '12px',
                                                            borderRadius: '999px',
                                                            backgroundColor:
                                                                priority === 'low'
                                                                    ? '#60a5fa'
                                                                    : priority === 'medium'
                                                                        ? '#eab308'
                                                                        : '#f97373',
                                                            border: '2px solid #e5e7eb',
                                                        }}
                                                    />
                                                    <span style={{ fontWeight: 500 }}>
                                                        {priority === 'low'
                                                            ? 'Low Priority'
                                                            : priority === 'medium'
                                                                ? 'Medium Priority'
                                                                : 'High Priority'}
                                                    </span>
                                                </>
                                            ) : (
                                                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Select priority</span>
                                            )}
                                        </button>
                                        {isPriorityDropdownOpen && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 'calc(100% + 4px)',
                                                    left: 0,
                                                    right: 0,
                                                    backgroundColor: '#fff',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: '1px solid hsl(var(--border))',
                                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                                    zIndex: 50,
                                                    overflow: 'hidden',
                                                    fontSize: '0.9rem',
                                                }}
                                            >
                                                {[
                                                    { value: 'low', label: 'Low Priority', color: '#60a5fa' },
                                                    { value: 'medium', label: 'Medium Priority', color: '#eab308' },
                                                    { value: 'high', label: 'High Priority', color: '#f97373' },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => {
                                                            setPriority(opt.value);
                                                            setIsPriorityDropdownOpen(false);
                                                        }}
                                                        style={{
                                                            width: '100%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'flex-start',
                                                            gap: '0.6rem',
                                                            padding: '0.5rem 0.9rem',
                                                            backgroundColor: priority === opt.value ? '#f9fafb' : '#fff',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            textAlign: 'left',
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                width: '12px',
                                                                height: '12px',
                                                                borderRadius: '999px',
                                                                backgroundColor: opt.color,
                                                                border: '2px solid #e5e7eb',
                                                            }}
                                                        />
                                                        <span style={{ fontWeight: 500 }}>{opt.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="label" style={{ marginBottom: '0.5rem' }}><b>Tech Stack Category:</b></label>
                                    <select
                                        className="select"
                                        value={techCategory}
                                        onChange={(e) => setTechCategory(e.target.value as (typeof TECH_STACK_CATEGORIES)[number])}
                                        style={{ backgroundColor: '#fff' }}
                                    >
                                        {TECH_STACK_CATEGORIES.map((category) => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label" style={{ marginBottom: '0.5rem' }}><b>Tools &amp; Technologies:</b></label>
                                    <div
                                        style={{
                                            backgroundColor: '#fff',
                                            border: '1px solid hsl(var(--input))',
                                            borderRadius: 'var(--radius-md)',
                                            minHeight: '185px',
                                            padding: '0.75rem 0.9rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.75rem',
                                        }}
                                    >
                                        <p
                                            style={{
                                                color: 'hsl(var(--muted-foreground))',
                                                fontSize: '0.85rem',
                                                margin: 0,
                                            }}
                                        >
                                            Showing tools for{' '}
                                            <span style={{ fontWeight: 600, color: '#111827' }}>
                                                {techCategory}
                                            </span>
                                        </p>

                                        {availableTools.length === 0 ? (
                                            <p
                                                style={{
                                                    color: 'hsl(var(--muted-foreground))',
                                                    fontSize: '0.9rem',
                                                    margin: 0,
                                                    fontStyle: 'italic',
                                                }}
                                            >
                                                Select a tech stack category to view available tools and technologies.
                                            </p>
                                        ) : (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    flex: 1,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                                        gap: '0.5rem 1.25rem',
                                                        flexGrow: 1,
                                                        alignContent: 'flex-start',
                                                    }}
                                                >
                                                    {paginatedTools.map((tool) => {
                                                        const id = `tool-${tool.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                                                        const checked = selectedTools.includes(tool);
                                                        return (
                                                            <label
                                                                key={tool}
                                                                htmlFor={id}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.5rem',
                                                                    fontSize: '0.85rem',
                                                                    color: '#111827',
                                                                    cursor: 'pointer',
                                                                    userSelect: 'none',
                                                                }}
                                                            >
                                                                <input
                                                                    id={id}
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={() => toggleToolSelection(tool)}
                                                                    style={{
                                                                        width: '14px',
                                                                        height: '14px',
                                                                        cursor: 'pointer',
                                                                    }}
                                                                />
                                                                <span>{tool}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>

                                                {availableTools.length > TOOLS_PER_PAGE && (
                                                    <div
                                                        style={{
                                                            marginTop: '0.75rem',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            gap: '0.75rem',
                                                            fontSize: '0.8rem',
                                                        }}
                                                    >
                                                        <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                            {(() => {
                                                                const start = (toolsPage - 1) * TOOLS_PER_PAGE + 1;
                                                                const end = Math.min(toolsPage * TOOLS_PER_PAGE, availableTools.length);
                                                                return `Showing ${start}-${end} of ${availableTools.length}`;
                                                            })()}
                                                        </span>
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem',
                                                            }}
                                                        >
                                                            {toolsPage > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setToolsPage((p) => Math.max(1, p - 1))}
                                                                    style={{
                                                                        padding: '0.3rem 0.9rem',
                                                                        borderRadius: '999px',
                                                                        border: 'none',
                                                                        backgroundColor: 'hsl(var(--orange))',
                                                                        color: '#fff',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.8rem',
                                                                        fontWeight: 500,
                                                                    }}
                                                                >
                                                                    Prev
                                                                </button>
                                                            )}
                                                            <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                                                                Page {toolsPage} of {toolsMaxPage}
                                                            </span>
                                                            {toolsPage < toolsMaxPage && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setToolsPage((p) => Math.min(toolsMaxPage, p + 1))}
                                                                    style={{
                                                                        padding: '0.3rem 0.9rem',
                                                                        borderRadius: '999px',
                                                                        border: 'none',
                                                                        backgroundColor: 'hsl(var(--orange))',
                                                                        color: '#fff',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.8rem',
                                                                        fontWeight: 500,
                                                                    }}
                                                                >
                                                                    Next
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                        {/* Header */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '1.5rem',
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: '0.8rem',
                                        textTransform: 'none',
                                        color: 'hsl(var(--orange))',
                                        fontWeight: 700,
                                        marginBottom: '0.35rem',
                                    }}
                                >
                                    Task Information
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                                    {selectedTask.title}
                                </div>
                                {/* Status / Priority and Dates row */}
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '3rem',
                                        fontSize: '0.8rem',
                                        color: '#111827',
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                        <div>
                                            <span style={{ fontWeight: 600 }}>Status:&nbsp;</span>
                                            <span
                                                style={{
                                                    padding: '0.15rem 0.75rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    backgroundColor: getStatusStyle(selectedTask.status).backgroundColor,
                                                    color: getStatusStyle(selectedTask.status).color,
                                                    border: `1px solid ${getStatusStyle(selectedTask.status).borderColor}`,
                                                }}
                                            >
                                                {getStatusLabel(selectedTask.status)}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <span style={{ fontWeight: 600 }}>Priority:&nbsp;</span>
                                            <span
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '999px',
                                                    backgroundColor:
                                                        selectedTask.priority === 'high'
                                                            ? '#f97373'
                                                            : selectedTask.priority === 'medium'
                                                                ? '#facc15'
                                                                : '#4ade80',
                                                    display: 'inline-block',
                                                }}
                                            />
                                            <span>{getPriorityLabel(selectedTask.priority)}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                        <div>
                                            <span style={{ fontWeight: 600 }}>Date Created:&nbsp;</span>
                                            <span>
                                                {selectedTask.created_at
                                                    ? new Date(selectedTask.created_at).toLocaleString()
                                                    : '—'}
                                            </span>
                                        </div>
                                        <div>
                                            <span style={{ fontWeight: 600 }}>Due:&nbsp;</span>
                                            <span>{new Date(selectedTask.due_date).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Close icon */}
                        <button
                            onClick={closeViewDetail}
                            style={{
                                backgroundColor: 'hsl(var(--orange))',
                                color: '#fff',
                                borderRadius: '999px',
                                border: 'none',
                                width: 28,
                                height: 28,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Tech stack */}
                    <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#111827' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Tech Stack:</div>
                        <div style={{ color: 'hsl(var(--muted-foreground))' }}>Not set</div>
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#111827' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Task Description:</div>
                        <p style={{ margin: 0, lineHeight: 1.5 }}>
                            {selectedTask.description || 'No description provided.'}
                        </p>
                    </div>

                    {/* Assigned list */}
                    <div style={{ marginBottom: '1.25rem', fontSize: '0.875rem', color: '#111827' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Assigned to Intern/s:</div>
                        {selectedTask.assigned_interns && selectedTask.assigned_interns.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                {selectedTask.assigned_interns.map(intern => (
                                    <li key={intern.id}>{intern.full_name}</li>
                                ))}
                            </ul>
                        ) : (
                            <p
                                style={{
                                    margin: 0,
                                    color: 'hsl(var(--muted-foreground))',
                                }}
                            >
                                {selectedTask.assigned_interns_count > 0
                                    ? `${selectedTask.assigned_interns_count} intern(s)`
                                    : 'No interns assigned.'}
                            </p>
                        )}
                    </div>

                    {/* Existing rejection reason, if any */}
                    {selectedTask.status === 'rejected' && selectedTask.rejection_reason && (
                        <div className="task-detail-rejection-box">
                            <span className="task-detail-rejection-label">Rejection Reason</span>
                            <p className="task-detail-rejection-text">{selectedTask.rejection_reason}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="task-detail-actions">
                        {selectedTask.status === 'needs_revision' && (
                            <button
                                onClick={closeViewDetail}
                                style={{
                                    backgroundColor: 'hsl(var(--orange))',
                                    color: '#fff',
                                    borderRadius: '999px',
                                    border: 'none',
                                    width: 28,
                                    height: 28,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Tech stack */}
                        <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#111827' }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Tech Stack:</div>
                            <div style={{ color: selectedTask.tools?.length ? '#111827' : 'hsl(var(--muted-foreground))' }}>
                                {selectedTask.tools?.length ? selectedTask.tools.join(', ') : 'Not set'}
                            </div>
                        </div>

                        {/* Description */}
                        <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#111827' }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Task Description:</div>
                            <p style={{ margin: 0, lineHeight: 1.5 }}>
                                {selectedTask.description || 'No description provided.'}
                            </p>
                        </div>

                        {/* Assigned list */}
                        <div style={{ marginBottom: '1.25rem', fontSize: '0.875rem', color: '#111827' }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Assigned to Intern/s:</div>
                            {selectedTask.assigned_interns && selectedTask.assigned_interns.length > 0 ? (
                                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                    {selectedTask.assigned_interns.map(intern => (
                                        <li key={intern.id}>{intern.full_name}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p
                                    style={{
                                        margin: 0,
                                        color: 'hsl(var(--muted-foreground))',
                                    }}
                                >
                                    {selectedTask.assigned_interns_count > 0
                                        ? `${selectedTask.assigned_interns_count} intern(s)`
                                        : 'No interns assigned.'}
                                </p>
                            )}
                        </div>

                        {selectedTask.status === 'rejected' && selectedTask.rejection_reason && (
                            <div className="task-detail-rejection-box">
                                <span className="task-detail-rejection-label">Rejection Reason</span>
                                <p className="task-detail-rejection-text">{selectedTask.rejection_reason}</p>
                            </div>
                        )}

                        {selectedTask.status === 'needs_revision' && (selectedTask.rejection_reason || selectedTask.revision_category) && (
                            <div className="task-detail-rejection-box">
                                <span className="task-detail-rejection-label">Supervisor&apos;s revision message</span>
                                {selectedTask.revision_category && (
                                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#706f6c' }}>
                                        <strong>Category:</strong> {selectedTask.revision_category}
                                    </p>
                                )}
                                {selectedTask.rejection_reason && (
                                    <p className="task-detail-rejection-text">{selectedTask.rejection_reason}</p>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="task-detail-actions">
                            {(selectedTask.status === 'needs_revision' || selectedTask.status === 'rejected') && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        startEditTask(selectedTask);
                                        closeViewDetail();
                                    }}
                                    style={{
                                        padding: '0.625rem 1.25rem',
                                        borderRadius: '999px',
                                        border: 'none',
                                        backgroundColor: '#2563eb',
                                        color: '#fff',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                    }}
                                >
                                    Edit Task
                                </button>
                            )}

                            {/*}
                        {selectedTask.status === 'completed' && (
                            <button
                                onClick={openRejectModal}
                                style={{
                                    padding: '0.625rem 1.25rem',
                                    borderRadius: '999px',
                                    border: 'none',
                                    backgroundColor: '#dc2626',
                                    color: '#fff',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                }}
                            >
                                Reject Task
                            </button>
                        )}
                        */}

                            {(selectedTask.status === 'needs_revision' || selectedTask.status === 'rejected' || selectedTask.status === 'completed') && (
                                <button
                                    type="button"
                                    onClick={handleArchive}
                                    disabled={archiving}
                                    style={{
                                        padding: '0.625rem 1.25rem',
                                        borderRadius: '999px',
                                        border: 'none',
                                        backgroundColor: 'hsl(var(--orange))',
                                        color: '#fff',
                                        fontWeight: 600,
                                        cursor: archiving ? 'wait' : 'pointer',
                                        fontSize: '0.85rem',
                                        opacity: archiving ? 0.7 : 1,
                                    }}
                                >
                                    {archiving ? 'Archiving…' : 'Archive Task'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Reject confirmation modal*/}
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
            </div>
        )}
            {toast.visible && (
                <div style={{ ...toastStyles.container, ...(toast.type === 'error' ? toastStyles.error : toastStyles.success) }}>
                    <span>{toast.type === 'error' ? '\u26A0' : '\u2713'}</span>
                    <span style={{ flex: 1 }}>{toast.message}</span>
                    <button
                        style={toastStyles.closeBtn}
                        onClick={() => setToast(prev => ({ ...prev, visible: false }))}
                    >
                        &times;
                    </button>
                </div>
            )}
       </div>
    );
};

/* Toast notification styles */
const toastStyles = {
    container: {
        position: 'fixed' as const,
        top: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 20px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        fontSize: '0.95rem',
        fontWeight: 500,
        maxWidth: '420px',
        animation: 'slideIn 0.3s ease-out',
    },
    error: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #fca5a5',
    },
    success: {
        backgroundColor: '#dcfce7',
        color: '#166534',
        border: '1px solid #86efac',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1.1rem',
        lineHeight: 1,
        padding: '0 0 0 8px',
        color: 'inherit',
        opacity: 0.7,
    },
};

export default ManageTasks;
