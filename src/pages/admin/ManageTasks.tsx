import { Filter, Search, Calendar, X, Loader2, ChevronDown } from 'lucide-react';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

type DropdownOption<T extends string> = {
    value: T;
    label: string;
};

type CustomDropdownProps<T extends string> = {
    value: T;
    options: DropdownOption<T>[];
    onChange: (value: T) => void;
    className?: string;
    buttonClassName?: string;
    panelClassName?: string;
};

function CustomDropdown<T extends string>({
    value,
    options,
    onChange,
    className = '',
    buttonClassName = '',
    panelClassName = '',
}: CustomDropdownProps<T>) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const selectedOption = options.find(option => option.value === value) ?? options[0];

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (!dropdownRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    return (
        <div ref={dropdownRef} className={`relative ${open ? 'z-[120]' : 'z-20'} ${className}`}>
            <motion.button
                type="button"
                whileTap={{ scale: 0.985 }}
                onClick={() => setOpen(prev => !prev)}
                className={`flex w-full items-center justify-between rounded-[1.15rem] border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 outline-none transition-all duration-200 focus:border-[hsl(var(--orange))] focus:ring-2 focus:ring-[hsl(var(--orange))]/20 ${buttonClassName} ${open ? 'border-[hsl(var(--orange))] shadow-[0_14px_34px_-22px_rgba(255,136,0,0.85)]' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span>{selectedOption?.label ?? value}</span>
                <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 shrink-0 text-slate-500"
                >
                    <ChevronDown size={18} />
                </motion.span>
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className={`absolute left-0 right-0 top-[calc(100%+0.55rem)] z-10 overflow-hidden rounded-[1.15rem] border border-gray-200 bg-white shadow-[0_24px_55px_-24px_rgba(15,23,42,0.35)] ${panelClassName}`}
                        role="listbox"
                    >
                        <div className="p-2">
                            {options.map(option => {
                                const isActive = option.value === value;

                                return (
                                    <motion.button
                                        key={option.value}
                                        type="button"
                                        whileTap={{ scale: 0.985 }}
                                        onClick={() => {
                                            onChange(option.value);
                                            setOpen(false);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                                            isActive
                                                ? 'bg-[hsl(var(--orange))] text-white'
                                                : 'text-slate-700 hover:bg-orange-50'
                                        }`}
                                        role="option"
                                        aria-selected={isActive}
                                    >
                                        <span>{option.label}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const ManageTasks = () => {
    const [search, setSearch] = useState('');
    const [dueDateFilter, setDueDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'overdue' | 'this_week' | 'this_month' | 'custom'>('all');
    const [customDueStart, setCustomDueStart] = useState('');
    const [customDueEnd, setCustomDueEnd] = useState('');
    const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
    const [customDraftStart, setCustomDraftStart] = useState('');
    const [customDraftEnd, setCustomDraftEnd] = useState('');
    const [lastNonCustomDueFilter, setLastNonCustomDueFilter] = useState<'all' | 'today' | 'tomorrow' | 'overdue' | 'this_week' | 'this_month'>('today');
    const [priorityFilter, setPriorityFilter] = useState('All Priority');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    const [tasks, setTasks] = useState<Tasks[]>([]);
    const [interns, setInterns] = useState<Users[]>([]);
    const [selectedTask, setSelectedTask] = useState<Tasks | null>(null);
    const [isLoadingTasks, setIsLoadingTasks] = useState(true);

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejecting, setRejecting] = useState(false);
    const [archiving, setArchiving] = useState(false);
    const [archiveModalOpen, setArchiveModalOpen] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [priority, setPriority] = useState('');
    const [techCategory, setTechCategory] = useState<(typeof TECH_STACK_CATEGORIES)[number]>('All Category');
    const [dueDateError, setDueDateError] = useState('');
    const [internSearch, setInternSearch] = useState('');
    const [selectedInterns, setSelectedInterns] = useState<Users[]>([]);
    const [isInternSearchFocused, setIsInternSearchFocused] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [editingTask, setEditingTask] = useState<Tasks | null>(null);
    const [selectedTools, setSelectedTools] = useState<string[]>([]);
    const [toolsPage, setToolsPage] = useState(1);

    const dueDateOptions: DropdownOption<typeof dueDateFilter>[] = [
        { value: 'all', label: 'All' },
        { value: 'today', label: 'Today' },
        { value: 'tomorrow', label: 'Tomorrow' },
        { value: 'overdue', label: 'Overdue' },
        { value: 'this_week', label: 'This Week' },
        { value: 'this_month', label: 'This Month' },
        { value: 'custom', label: 'Custom Range...' },
    ];

    const priorityOptions: DropdownOption<typeof priorityFilter>[] = [
        { value: 'All Priority', label: 'All Priority' },
        { value: 'High', label: 'High' },
        { value: 'Medium', label: 'Medium' },
        { value: 'Low', label: 'Low' },
    ];

    const statusOptions: DropdownOption<typeof statusFilter>[] = [
        { value: 'All Status', label: 'All Status' },
        { value: 'For checking', label: 'For checking' },
        { value: 'For revision', label: 'For revision' },
        { value: 'Not Started', label: 'Not Started' },
        { value: 'In Progress', label: 'In Progress' },
        { value: 'Pending', label: 'Pending' },
        { value: 'Completed', label: 'Completed' },
        { value: 'Overdue', label: 'Overdue' },
        { value: 'Rejected', label: 'Rejected' },
    ];

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


    const handleArchive = () => {
        if (!selectedTask) return;
        setArchiveModalOpen(true);
    };

    const confirmArchive = async () => {
        if (!selectedTask) return;
        setArchiving(true);
        setArchiveModalOpen(false);
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

    const openCustomRangeModal = () => {
        const todayIso = new Date().toISOString().slice(0, 10);
        setCustomDraftStart(customDueStart || todayIso);
        setCustomDraftEnd(customDueEnd || customDueStart || todayIso);
        setIsCustomRangeOpen(true);
    };

    const closeCustomRangeModal = () => {
        // If user cancels before ever applying a range, revert the dropdown back to the last preset.
        if (!customDueStart) {
            setDueDateFilter(lastNonCustomDueFilter);
        }
        setIsCustomRangeOpen(false);
    };

    const applyCustomRange = () => {
        setCustomDueStart(customDraftStart);
        setCustomDueEnd(customDraftEnd || customDraftStart);
        setDueDateFilter('custom');
        setIsCustomRangeOpen(false);
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

    const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    const isSameDay = (a: Date, b: Date): boolean =>
        a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    const getWeekRange = (baseDate: Date) => {
        // Monday–Sunday (local time)
        const d = startOfDay(baseDate);
        const day = d.getDay(); // 0=Sun ... 6=Sat
        const mondayOffset = day === 0 ? -6 : 1 - day;
        const monday = new Date(d);
        monday.setDate(d.getDate() + mondayOffset);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return { start: startOfDay(monday), end: endOfDay(sunday) };
    };

    const getMonthRange = (baseDate: Date) => {
        const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start, end };
    };

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

            const now = new Date();
            const todayStart = startOfDay(now);
            const tomorrow = new Date(todayStart);
            tomorrow.setDate(todayStart.getDate() + 1);
            const tomorrowStart = startOfDay(tomorrow);
            const tomorrowEnd = endOfDay(tomorrow);

            const taskDue = parseDueDate(task.due_date);
            let matchesDueDate = true;

            if (dueDateFilter !== 'all') {
                if (!taskDue) {
                    matchesDueDate = false;
                } else if (dueDateFilter === 'today') {
                    matchesDueDate = isSameDay(taskDue, now);
                } else if (dueDateFilter === 'tomorrow') {
                    matchesDueDate = taskDue >= tomorrowStart && taskDue <= tomorrowEnd;
                } else if (dueDateFilter === 'overdue') {
                    matchesDueDate = task.status !== 'completed' && taskDue < todayStart;
                } else if (dueDateFilter === 'this_week') {
                    const { start, end } = getWeekRange(now);
                    matchesDueDate = taskDue >= start && taskDue <= end;
                } else if (dueDateFilter === 'this_month') {
                    const { start, end } = getMonthRange(now);
                    matchesDueDate = taskDue >= start && taskDue <= end;
                } else if (dueDateFilter === 'custom') {
                    // Allow selecting either a single day (start only) or a date range.
                    // If start is missing, we don't filter (keeps UX forgiving).
                    if (!customDueStart) {
                        matchesDueDate = true;
                    } else {
                        const start = startOfDay(new Date(`${customDueStart}T00:00:00`));
                        const end = customDueEnd
                            ? endOfDay(new Date(`${customDueEnd}T00:00:00`))
                            : endOfDay(new Date(`${customDueStart}T00:00:00`));
                        matchesDueDate = taskDue >= start && taskDue <= end;
                    }
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
    }, [tasks, search, priorityFilter, statusFilter, dueDateFilter, customDueStart, customDueEnd]);

    return (
        <div className="admin-page-shell">
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

                .manage-tasks-filter-section {
                    margin-bottom: 1.5rem;
                    padding: 1.25rem;
                    background-color: #e9e6e1;
                    border-radius: 8px;
                    position: relative;
                    z-index: 40;
                    overflow: visible;
                }

                .manage-tasks-filter-row,
                .manage-tasks-filter-selects,
                .manage-tasks-filter-col {
                    position: relative;
                    overflow: visible;
                }
                
                
                @media (max-width: 768px) {
                    .manage-tasks-filter-row { flex-direction: column !important; align-items: stretch !important; }
                    .manage-tasks-filter-selects { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 0.5rem !important; }
                    .manage-tasks-filter-col { min-width: 0 !important; }
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

            <div className="row row-between manage-tasks-header">
                <h1 className="manage-tasks-title">Manage Tasks</h1>
                <button className="btn btn-primary manage-tasks-create-btn" onClick={openCreateModal}>
                    + Create Task
                </button>
            </div>

            <div className="manage-tasks-search-wrap">
                <div className="input-group manage-tasks-search-group">
                    <Search size={20} className="manage-tasks-search-icon" />
                    <input type="text" className="input manage-tasks-search-input" placeholder="Search Task"
                        value={search} onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="card manage-tasks-filter-section">
                <div
                    className="row manage-tasks-filter-row flex-col md:flex-row items-stretch md:items-center"
                >
                    <div 
                        className="manage-tasks-filter-label flex justify-between items-center cursor-pointer md:cursor-default w-full md:w-auto"
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    >
                        <div className="flex items-center gap-2">
                            <Filter size={20} />
                            <span className="font-semibold">Filters:</span>
                        </div>
                        <ChevronDown size={20} className={`md:hidden transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
                    </div>

                    <div className={`manage-tasks-filter-selects w-full md:w-auto flex-col md:flex-row gap-4 md:flex ${isFiltersOpen ? 'flex mt-4 md:mt-0' : 'hidden md:mt-0'}`}>
                        <div className="manage-tasks-filter-col">
                            <CustomDropdown
                                value={dueDateFilter}
                                options={dueDateOptions}
                                onChange={(raw) => {
                                    if (raw === 'custom') {
                                        if (dueDateFilter !== 'custom') {
                                            setLastNonCustomDueFilter(dueDateFilter);
                                        }
                                        setDueDateFilter('custom');
                                        openCustomRangeModal();
                                        return;
                                    }
                                    setLastNonCustomDueFilter(raw);
                                    setDueDateFilter(raw);
                                }}
                            />
                        </div>

                        <div className="manage-tasks-filter-col">
                            <CustomDropdown
                                value={priorityFilter}
                                options={priorityOptions}
                                onChange={setPriorityFilter}
                            />
                        </div>

                        <div className="manage-tasks-filter-col">
                            <CustomDropdown
                                value={statusFilter}
                                options={statusOptions}
                                onChange={setStatusFilter}
                            />
                        </div>
                    </div>
                </div>

                {dueDateFilter === 'custom' && customDueStart && (
                    <div
                        className="manage-tasks-custom-chip"
                    >
                        <span className="manage-tasks-custom-chip-label">Custom:</span>
                        <span>
                            {customDueStart}
                            {customDueEnd && customDueEnd !== customDueStart ? ` → ${customDueEnd}` : ''}
                        </span>
                        <button
                            type="button"
                            onClick={() => openCustomRangeModal()}
                            className="manage-tasks-custom-chip-btn"
                            title="Edit custom range"
                        >
                            Edit
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setCustomDueStart('');
                                setCustomDueEnd('');
                                setDueDateFilter(lastNonCustomDueFilter);
                            }}
                            className="manage-tasks-custom-chip-btn clear"
                            title="Clear custom range"
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>

            <div className="grid-3 manage-tasks-grid">
                {isLoadingTasks && tasks.length === 0 ? (
                    <div className="col-[1/-1] text-center py-12">
                        <div className="inline-block w-10 h-10 border-4 border-[#f3f3f3] border-t-[hsl(var(--orange))] rounded-full animate-spin" />
                        <p className="text-slate-500 mt-4 text-sm">Loading tasks...</p>
                    </div>
                ) : (
                    <>
                        {filteredTasks.map((task) => {
                            const priorityStyle = getPriorityStyle(task.priority);
                            const statusStyle = getStatusStyle(task.status);
                            return (
                                <div key={task.id} className="card manage-task-card"
                                    onClick={() => handleViewDetail(task)}
                                >
                                    <div className="manage-task-card-top">
                                        <h3 className="manage-task-card-title">{task.title}</h3>
                                        <div className="inline-block px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap" style={{ border: `1px solid ${priorityStyle.borderColor}`, ...priorityStyle }}>
                                            {getPriorityLabel(task.priority)}
                                        </div>
                                    </div>
                                    <p className="manage-task-card-description">
                                        {task.description}
                                    </p>
                                    <div className="manage-task-card-meta">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Assigned to:</span>
                                            <span className="font-semibold text-black">{task.assigned_interns_count} intern{task.assigned_interns_count !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Date Created:</span>
                                            <span className="font-semibold text-black">{new Date(task.created_at).toLocaleDateString('en-US')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Due:</span>
                                            <span className="font-semibold text-black">{new Date(task.due_date).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Status:</span>
                                            <span
                                                className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                                                style={{
                                                    backgroundColor: statusStyle.backgroundColor,
                                                    color: statusStyle.color,
                                                    border: `1px solid ${statusStyle.borderColor}`,
                                                }}
                                            >
                                                {getStatusLabel(task.status)}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="btn btn-primary manage-task-card-btn">View Details</button>
                                </div>
                            );
                        })}
                        {filteredTasks.length === 0 && !isLoadingTasks && (
                            <p className="text-slate-400 col-[1/-1] text-center pt-8">No tasks found.</p>
                        )}
                    </>
                )}
            </div>

            {/* Create Task Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal create-task-modal max-w-[900px] w-full p-5 m-3 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-5 flex justify-between items-center">
                            <h2 className="text-[hsl(var(--orange))] m-0 text-2xl font-bold">Task Information</h2>
                            <button onClick={closeModal} className="bg-transparent border-none cursor-pointer p-2 flex items-center text-slate-500 rounded">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="create-task-modal-content">
                            <div>
                                <div className="mb-4">
                                    <label className="label mb-2"><b>Task Title:</b></label>
                                    <input
                                        type="text"
                                        className="input bg-white"
                                        placeholder="Enter task title"
                                        value={taskTitle}
                                        onChange={(e) => setTaskTitle(e.target.value)}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="label mb-2"><b>Task Description:</b></label>
                                    <textarea
                                        className="input bg-white min-h-[100px] resize-y"
                                        placeholder="Brief description of the task"
                                        value={taskDescription}
                                        onChange={(e) => setTaskDescription(e.target.value)}
                                    />
                                </div>
                                <div className="mb-4 relative">
                                    <label className="label mb-2"><b>Assign to Intern/s:</b></label>
                                    <div className="relative mb-3">
                                        <Search
                                            size={20}
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10"
                                        />
                                        <input
                                            ref={internSearchInputRef}
                                            type="text"
                                            className="input bg-white pl-11"
                                            placeholder="Search interns by name"
                                            value={internSearch}
                                            onChange={(e) => { setInternSearch(e.target.value); setIsInternSearchFocused(true); }}
                                            onFocus={() => setIsInternSearchFocused(true)}
                                            onBlur={() =>
                                                setTimeout(() => {
                                                    if (!document.activeElement?.closest('.intern-dropdown')) setIsInternSearchFocused(false);
                                                }, 200)
                                            }
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

                            <div className="create-task-modal-bottom">
                                <div className="mb-1">
                                    {dueDateError && (
                                        <p className="mb-1.5 text-xs text-[hsl(var(--danger))] font-medium">
                                            {dueDateError}
                                        </p>
                                    )}
                                    <label className="label mb-2"><b>Due Date:</b></label>
                                    <div className="relative">
                                        <input
                                            ref={dateInputRef}
                                            type="datetime-local"
                                            className="input bg-white pr-10"
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
                                            style={{ colorScheme: 'light' }}
                                        />
                                        <button type="button" onClick={() => dateInputRef.current?.showPicker?.()}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1 flex items-center text-muted-foreground">
                                            <Calendar size={20} />
                                        </button>
                                    </div>
                                </div>
                                <div className="mb-1">
                                    <label className="label mb-2"><b>Priority:</b></label>
                                    <CustomDropdown
                                        value={(priority || 'unselected') as 'unselected' | 'low' | 'medium' | 'high'}
                                        options={[
                                            { value: 'unselected', label: 'Select priority' },
                                            { value: 'low', label: 'Low Priority' },
                                            { value: 'medium', label: 'Medium Priority' },
                                            { value: 'high', label: 'High Priority' },
                                        ]}
                                        onChange={(value) => setPriority(value === 'unselected' ? '' : value)}
                                    />
                                </div>
                                <div>
                                    <label className="label mb-2"><b>Tech Stack Category:</b></label>
                                    <CustomDropdown
                                        value={techCategory}
                                        options={TECH_STACK_CATEGORIES.map((category) => ({
                                            value: category,
                                            label: category,
                                        }))}
                                        onChange={(value) => setTechCategory(value)}
                                    />
                                </div>
                                <div>
                                    <label className="label mb-2"><b>Tools &amp; Technologies:</b></label>
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
                                            <span className="font-semibold text-slate-900">
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
                                                        <span className="text-muted-foreground">
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
                                                            <span className="text-muted-foreground">
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

                        <div className="create-task-modal-actions">
                            <button onClick={handleClear} className="px-6 py-2.5 bg-white text-[hsl(var(--orange))] border border-[hsl(var(--border))] rounded-md cursor-pointer font-medium text-sm">
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
                                {assigning && <Loader2 size={16} className="spinner shrink-0" />}
                                {assigning ? 'Assigning...' : 'Assign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Range Modal */}
            {isCustomRangeOpen && (
                <div
                    className="modal-overlay"
                    onClick={closeCustomRangeModal}
                    style={{ zIndex: 1200 }}
                >
                    <div
                        className="modal w-[92%] max-w-[520px] p-5 pb-[1.1rem] rounded-2xl bg-white shadow-[0_30px_60px_rgba(0,0,0,0.25)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center gap-4">
                            <div>
                                <div className="font-extrabold text-[1.1rem] text-slate-900">Custom due date range</div>
                                <div className="text-[0.9rem] text-slate-500 mt-0.5">
                                    Select a specific date or date range to filter tasks.
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeCustomRangeModal}
                                aria-label="Close"
                                className="bg-[hsl(var(--orange))] border-none rounded-full w-9 h-9 cursor-pointer flex items-center justify-center text-white font-black shadow-[0_4px_10px_rgba(0,0,0,0.15)]"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5 mt-4.5">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[0.85rem] font-bold text-slate-700">Start date</label>
                                <input
                                    type="date"
                                    className="input bg-white"
                                    value={customDraftStart}
                                    onChange={(e) => {
                                        const next = e.target.value;
                                        setCustomDraftStart(next);
                                        setCustomDraftEnd((prev) => (prev && prev < next ? next : prev));
                                    }}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[0.85rem] font-bold text-slate-700">End date</label>
                                <input
                                    type="date"
                                    className="input bg-white"
                                    value={customDraftEnd}
                                    min={customDraftStart || undefined}
                                    onChange={(e) => setCustomDraftEnd(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center gap-3 mt-5">
                            <button
                                type="button"
                                onClick={() => {
                                    setCustomDraftStart('');
                                    setCustomDraftEnd('');
                                }}
                                style={{
                                    padding: '0.6rem 1rem',
                                    borderRadius: '10px',
                                    border: '1px solid #e5e7eb',
                                    backgroundColor: '#fff',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    color: '#374151',
                                }}
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={applyCustomRange}
                                disabled={!customDraftStart}
                                style={{
                                    padding: '0.6rem 1rem',
                                    borderRadius: '10px',
                                    border: 'none',
                                    backgroundColor: customDraftStart ? 'hsl(var(--orange))' : '#fca5a5',
                                    color: '#fff',
                                    cursor: customDraftStart ? 'pointer' : 'not-allowed',
                                    fontWeight: 800,
                                }}
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Detail Modal */}
            {selectedTask && (
                <div className="modal-overlay" onClick={closeViewDetail}>
                    <div className="modal task-detail-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Top-right close button */}
                        <button
                            type="button"
                            onClick={closeViewDetail}
                            aria-label="Close"
                            className="absolute top-4 right-4 w-9 h-9 rounded-full border-none bg-[hsl(var(--orange))] text-white flex items-center justify-center cursor-pointer"
                        >
                            <X size={18} />
                        </button>

                        {/* Header */}
                        <div className="mb-6 pr-12">
                            <div
                                className="text-xs text-[hsl(var(--orange))] font-bold mb-1.5"
                            >
                                Task Information
                            </div>
                            <div className="font-bold text-sm mb-3">
                                {selectedTask.title}
                            </div>

                            {/* Status / Priority and Dates row */}
                            <div className="flex flex-wrap gap-4 text-xs text-slate-900 sm:gap-12">
                                <div className="flex flex-col gap-1.5">
                                    <div>
                                        <span className="font-semibold">Status:&nbsp;</span>
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
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-semibold">Priority:&nbsp;</span>
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
                                <div className="flex flex-col gap-1.5">
                                    <div>
                                        <span className="font-semibold">Date Created:&nbsp;</span>
                                        <span>
                                            {selectedTask.created_at ? new Date(selectedTask.created_at).toLocaleString() : '—'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-semibold">Due:&nbsp;</span>
                                        <span>{new Date(selectedTask.due_date).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tech stack */}
                        <div className="mb-4 text-sm text-slate-900">
                            <div className="font-semibold mb-1">Tech Stack:</div>
                            <div className={selectedTask.tools?.length ? 'text-slate-900' : 'text-muted-foreground'}>
                                {selectedTask.tools?.length ? selectedTask.tools.join(', ') : 'Not set'}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-4 text-sm text-slate-900">
                            <div className="font-semibold mb-1">Task Description:</div>
                            <p className="m-0 leading-6">
                                {selectedTask.description || 'No description provided.'}
                            </p>
                        </div>

                        {/* Assigned list */}
                        <div className="mb-5 text-sm text-slate-900">
                            <div className="font-semibold mb-1">Assigned to Intern/s:</div>
                            {selectedTask.assigned_interns && selectedTask.assigned_interns.length > 0 ? (
                                <ul className="m-0 pl-5">
                                    {selectedTask.assigned_interns.map(intern => (
                                        <li key={intern.id}>{intern.full_name}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="m-0 text-muted-foreground">
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
                                    className="px-5 py-2.5 rounded-full border-none bg-blue-600 text-white font-semibold cursor-pointer text-[0.85rem]"
                                >
                                    Edit Task
                                </button>
                            )}

                            {(selectedTask.status === 'needs_revision' || selectedTask.status === 'rejected' || selectedTask.status === 'completed') && (
                                <button
                                    type="button"
                                    onClick={handleArchive}
                                    disabled={archiving}
                                    className="px-5 py-2.5 rounded-full border-none bg-[hsl(var(--orange))] text-white font-semibold text-[0.85rem]"
                                    style={{ cursor: archiving ? 'wait' : 'pointer', opacity: archiving ? 0.7 : 1 }}
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
                <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[1100]">
                    <div className="bg-white w-[90%] max-w-[460px] rounded-2xl p-8 shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
                        onClick={(e) => e.stopPropagation()}>
                        <h2 className="m-0 mb-1 text-xl font-extrabold text-red-600">Reject Task</h2>
                        <p className="m-0 mb-6 text-slate-600 text-[0.9rem]">{selectedTask.title}</p>

                        <label className="font-bold text-sm block mb-2">
                            Reason for rejection <span className="text-red-600">*</span>
                        </label>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Explain why this task is being rejected..."
                            className="w-full min-h-[100px] p-3 rounded-lg border border-slate-300 text-sm resize-y box-border"
                        />

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={closeRejectModal} className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white font-semibold cursor-pointer">
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={rejecting || !rejectionReason.trim()}
                                className="px-5 py-2.5 rounded-lg border-none text-white font-bold"
                                style={{ backgroundColor: rejectionReason.trim() ? '#dc2626' : '#fca5a5', cursor: rejectionReason.trim() ? 'pointer' : 'not-allowed', opacity: rejecting ? 0.7 : 1 }}
                            >
                                {rejecting ? 'Rejecting…' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
        )}

            {/* Archive confirmation modal */}
            {archiveModalOpen && selectedTask && (
                <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[1100]">
                    <div
                        className="bg-white w-[90%] max-w-[420px] rounded-2xl p-8 shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-1">
                            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-orange-100 text-[hsl(var(--orange))]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
                            </span>
                            <h2 className="m-0 text-xl font-extrabold text-slate-800">Archive Task</h2>
                        </div>
                        <p className="mt-3 mb-1 text-slate-600 text-[0.9rem] leading-relaxed">
                            Are you sure you want to archive{' '}
                            <strong className="text-slate-800">&ldquo;{selectedTask.title}&rdquo;</strong>?{' '}
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3 mt-7">
                            <button
                                type="button"
                                onClick={() => setArchiveModalOpen(false)}
                                className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold cursor-pointer text-sm hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmArchive}
                                disabled={archiving}
                                className="px-5 py-2.5 rounded-lg border-none bg-[hsl(var(--orange))] text-white font-bold text-sm cursor-pointer transition-opacity"
                                style={{ opacity: archiving ? 0.7 : 1 }}
                            >
                                {archiving ? 'Archiving…' : 'Confirm Archive'}
                            </button>
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


