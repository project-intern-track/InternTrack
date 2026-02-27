import { Filter, Search, Calendar, X, Plus, ClipboardList } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../../services/supabaseClient';
import { taskService } from '../../services/taskServices';
import type { Tasks, TaskStatus, TaskPriority } from '../../types/database.types';
import { useRealtime } from '../../hooks/useRealtime';

const ManageTasks = () => {
    const [search, setSearch] = useState('');
    const [dueDateFilter, setDueDateFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [tasks, setTasks] = useState<Tasks[]>([]);
    const [selectedTask, setSelectedTask] = useState<Tasks | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [priority, setPriority] = useState('');
    const [internSearch, setInternSearch] = useState('');
    const [selectedInterns, setSelectedInterns] = useState<string[]>([]);
    const [isInternSearchFocused, setIsInternSearchFocused] = useState(false);

    const dateInputRef = useRef<HTMLInputElement>(null);
    const internSearchInputRef = useRef<HTMLInputElement>(null);

    const fetchTask = async () => {
        try {
            const data = await taskService.getTasks();
            setTasks(data as Tasks[]);
        } catch (err) {
            console.error('Failed to fetch tasks:', err);
        }
    };

    useRealtime('tasks', fetchTask);

    useEffect(() => {
        fetchTask();
    }, []);

    const sampleInterns = [
        'John Jones',
        'Lebron James',
        'Mike Enriquez',
        'Sarah Geronimo',
        'Totoy Brown',
        'Ant Davis'
    ];

    const filteredInterns = useMemo(() => {
        if (!isInternSearchFocused) return [];

        if (!internSearch.trim()) {
            return sampleInterns.filter((intern) => !selectedInterns.includes(intern));
        }

        return sampleInterns.filter((intern) =>
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

    const handleInternRemove = (intern: string) => {
        setSelectedInterns(selectedInterns.filter((i) => i !== intern));
    };

    const handleClear = () => {
        setTaskTitle('');
        setTaskDescription('');
        setDueDate('');
        setDueTime('');
        setPriority('');
        setSelectedInterns([]);
        setInternSearch('');
    };

    const handleViewDetail = (task: Tasks) => {
        setSelectedTask(task);
    };

    const closeViewDetail = () => {
        setSelectedTask(null);
    };

    const handleAssign = async () => {
        try {
            if (!taskTitle || !selectedInterns.length || !priority || !dueDate) {
                alert('Please provide a title, due date, priority, and assign at least one intern.');
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert('Session expired. Please log in again.');
                return;
            }

            const taskData = {
                title: taskTitle,
                description: taskDescription,
                priority: priority as TaskPriority,
                status: 'todo' as TaskStatus,
                due_date: `${dueDate}T${dueTime || '23:59'}:00`,
                assigned_to: selectedInterns[0],
                created_by: user.id,
            };

            await taskService.createTask(taskData);
            await fetchTask();

            setIsModalOpen(false);
            handleClear();
            alert('Task assigned successfully.');
        } catch (err) {
            console.error('Database Error:', err);
            alert('Failed to assign task.');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        handleClear();
    };

    const parseTaskDate = (value: string): Date | null => {
        if (!value) return null;

        const iso = new Date(value);
        if (!Number.isNaN(iso.getTime())) return iso;

        try {
            const datePart = value.split(' - ')[0];
            const [month, day, year] = datePart.split('/').map(Number);
            const fallback = new Date(year, month - 1, day);
            return Number.isNaN(fallback.getTime()) ? null : fallback;
        } catch {
            return null;
        }
    };

    const toDateKey = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const isToday = (date: Date): boolean => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const availableDueDates = useMemo(() => {
        const dateSet = new Set<string>();

        tasks.forEach((task) => {
            const parsed = parseTaskDate(task.due_date);
            if (parsed) {
                dateSet.add(toDateKey(parsed));
            }
        });

        return Array.from(dateSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const searchLower = search.toLowerCase();
            const matchesSearch = search === '' ||
                task.title.toLowerCase().includes(searchLower) ||
                task.description.toLowerCase().includes(searchLower);

            const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
            const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

            let matchesDueDate = true;
            if (dueDateFilter !== 'all') {
                const parsed = parseTaskDate(task.due_date);
                if (!parsed) {
                    matchesDueDate = false;
                } else if (dueDateFilter === 'today') {
                    matchesDueDate = isToday(parsed);
                } else {
                    matchesDueDate = toDateKey(parsed) === dueDateFilter;
                }
            }

            return matchesSearch && matchesPriority && matchesStatus && matchesDueDate;
        });
    }, [tasks, search, priorityFilter, statusFilter, dueDateFilter]);

    const getPriorityStyle = (taskPriority: string) => {
        switch (taskPriority) {
            case 'low':
                return 'bg-blue-50 text-blue-700 ring-blue-200';
            case 'medium':
                return 'bg-amber-50 text-amber-700 ring-amber-200';
            case 'high':
                return 'bg-rose-50 text-rose-700 ring-rose-200';
            default:
                return 'bg-gray-50 text-gray-700 ring-gray-200';
        }
    };

    const getStatusLabel = (status: TaskStatus) => {
        switch (status) {
            case 'todo':
                return 'To Do';
            case 'in-progress':
                return 'In Progress';
            case 'review':
                return 'Review';
            case 'done':
                return 'Done';
            default:
                return status;
        }
    };

    const formatDueDate = (value: string) => {
        const parsed = parseTaskDate(value);
        if (!parsed) return value;

        return parsed.toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-orange-50/40 to-gray-50 p-6 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            >
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Manage Tasks</h1>
                    <p className="mt-1 text-sm text-gray-600">Create and monitor intern task assignments.</p>
                </div>
                <button
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff7a00] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#eb6f00]"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus size={17} />
                    Create Task
                </button>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="mb-6 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm"
            >
                <div className="mb-3 relative">
                    <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
                        placeholder="Search tasks"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600">
                        <Filter size={16} />
                        Filters
                    </div>

                    <select
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100 lg:w-[220px]"
                        value={dueDateFilter}
                        onChange={(e) => setDueDateFilter(e.target.value)}
                    >
                        <option value="all">All Due Dates</option>
                        <option value="today">Today</option>
                        {availableDueDates.map((date) => (
                            <option key={date} value={date}>{date}</option>
                        ))}
                    </select>

                    <select
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100 lg:w-[180px]"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                        <option value="all">All Priority</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>

                    <select
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100 lg:w-[180px]"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                    </select>
                </div>
            </motion.div>

            {filteredTasks.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                    <ClipboardList size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">No tasks found for the selected filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                    {filteredTasks.map((task, index) => (
                        <motion.article
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.24, delay: Math.min(index * 0.04, 0.18) }}
                            className="flex h-full cursor-pointer flex-col rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            onClick={() => handleViewDetail(task)}
                        >
                            <div className="mb-4 flex items-start justify-between gap-2">
                                <h3 className="line-clamp-2 text-base font-semibold text-gray-900">{task.title}</h3>
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getPriorityStyle(task.priority)}`}>
                                    {task.priority}
                                </span>
                            </div>

                            <p className="mb-5 line-clamp-3 flex-1 text-sm leading-6 text-gray-600">
                                {task.description || 'No description provided.'}
                            </p>

                            <div className="mb-5 space-y-1.5 text-sm">
                                <p className="flex items-center justify-between gap-2">
                                    <span className="text-gray-500">Assigned to</span>
                                    <span className="font-medium text-gray-800">{task.assigned_to}</span>
                                </p>
                                <p className="flex items-center justify-between gap-2">
                                    <span className="text-gray-500">Due</span>
                                    <span className="font-medium text-gray-800">{formatDueDate(task.due_date)}</span>
                                </p>
                                <p className="flex items-center justify-between gap-2">
                                    <span className="text-gray-500">Status</span>
                                    <span className="font-medium text-gray-800">{getStatusLabel(task.status)}</span>
                                </p>
                            </div>

                            <button className="rounded-xl bg-[#ff7a00] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#eb6f00]">
                                View Details
                            </button>
                        </motion.article>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 16, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.96 }}
                            transition={{ duration: 0.24 }}
                            className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-orange-100 bg-white p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-5 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Task Information</h2>
                                <button
                                    onClick={closeModal}
                                    className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
                                <div>
                                    <div className="mb-4">
                                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">Task Title</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
                                            placeholder="Enter task title"
                                            value={taskTitle}
                                            onChange={(e) => setTaskTitle(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">Task Description</label>
                                        <textarea
                                            className="h-32 w-full resize-y rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
                                            placeholder="Brief description of the task"
                                            value={taskDescription}
                                            onChange={(e) => setTaskDescription(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Assign to Intern/s</label>

                                    <div className="relative mb-3">
                                        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            ref={internSearchInputRef}
                                            type="text"
                                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 pl-10 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
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
                                        />

                                        {isInternSearchFocused && filteredInterns.length > 0 && (
                                            <div className="intern-dropdown absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                                                {filteredInterns.map((intern) => (
                                                    <button
                                                        key={intern}
                                                        type="button"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            handleInternSelect(intern);
                                                        }}
                                                        className="block w-full border-b border-gray-100 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                                                    >
                                                        {intern}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-h-[150px] rounded-xl border border-gray-200 bg-gray-50/60 p-3">
                                        {selectedInterns.length === 0 ? (
                                            <p className="text-sm italic text-gray-500">Selected interns will appear here.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {selectedInterns.map((intern) => (
                                                    <div
                                                        key={intern}
                                                        className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm text-gray-700"
                                                    >
                                                        <span>{intern}</span>
                                                        <button
                                                            onClick={() => handleInternRemove(intern)}
                                                            className="rounded-md p-1 text-rose-500 transition hover:bg-rose-50"
                                                        >
                                                            <X size={15} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Due Date</label>
                                    <div className="relative">
                                        <input
                                            ref={dateInputRef}
                                            type="datetime-local"
                                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
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
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                dateInputRef.current?.showPicker?.() || dateInputRef.current?.click();
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 transition hover:bg-gray-100"
                                        >
                                            <Calendar size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Priority</label>
                                    <select
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                    >
                                        <option value="">Select priority</option>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col justify-end gap-2 sm:flex-row">
                                <button
                                    onClick={handleClear}
                                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={handleAssign}
                                    className="rounded-xl bg-[#ff7a00] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#eb6f00]"
                                >
                                    Assign
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedTask && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                        onClick={closeViewDetail}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 16, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.96 }}
                            transition={{ duration: 0.24 }}
                            className="w-full max-w-xl rounded-2xl border border-orange-100 bg-white p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-4">
                                <h2 className="text-xl font-bold text-gray-900">{selectedTask.title}</h2>
                                <div className="mt-2 inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                    {getStatusLabel(selectedTask.status)}
                                </div>
                            </div>

                            <p className="mb-5 text-sm leading-6 text-gray-600">
                                {selectedTask.description || 'No description provided.'}
                            </p>

                            <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Assigned To</p>
                                    <p className="text-sm font-semibold text-gray-800">{selectedTask.assigned_to}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Due Date</p>
                                    <p className="inline-flex items-center gap-1 text-sm font-semibold text-gray-800">
                                        <Calendar size={14} />
                                        {formatDueDate(selectedTask.due_date)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={closeViewDetail}
                                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManageTasks;
