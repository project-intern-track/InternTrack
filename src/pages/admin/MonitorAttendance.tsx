import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { UserCheck, Search, Filter, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface AttendanceRecord {
    id: string;
    date: string;
    time_in: string | null;
    time_out: string | null;
    rendered_hours: number | null;
    credited_hours: number | null;
    status: string;
    user: {
        full_name: string;
    };
}

interface AttendanceStats {
    completed: number;
    incomplete: number;
    noLog: number;
    avgHoursPerDay?: number;
}

const MonitorAttendance = ({ stats }: { stats?: AttendanceStats }) => {
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [loading, setLoading] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollPositionRef = useRef<number>(0);

    useEffect(() => {
        setLoading(true);

        setTimeout(() => {
            const sampleData: AttendanceRecord[] = [
                {
                    id: '1',
                    date: '2026-02-09',
                    time_in: null,
                    time_out: null,
                    rendered_hours: null,
                    credited_hours: null,
                    status: 'no_log',
                    user: { full_name: 'Yuan Crispino' },
                },
                {
                    id: '2',
                    date: '2026-02-14',
                    time_in: '2026-02-09T08:00:00',
                    time_out: '2026-02-09T18:00:00',
                    rendered_hours: 9,
                    credited_hours: 8,
                    status: 'completed',
                    user: { full_name: 'Maria Letuzawa' },
                },
                {
                    id: '3',
                    date: '2026-02-09',
                    time_in: '2026-02-09T08:00:00',
                    time_out: '2026-02-09T18:00:00',
                    rendered_hours: 9,
                    credited_hours: 8,
                    status: 'completed',
                    user: { full_name: 'John Jones' },
                },
                {
                    id: '4',
                    date: '2026-02-09',
                    time_in: '2026-02-09T08:00:00',
                    time_out: '2026-02-09T18:00:00',
                    rendered_hours: 9,
                    credited_hours: 8,
                    status: 'completed',
                    user: { full_name: 'Sarah Geronimo' },
                },
                {
                    id: '5',
                    date: '2026-02-09',
                    time_in: '2026-02-09T08:00:00',
                    time_out: '2026-02-09T18:00:00',
                    rendered_hours: 9,
                    credited_hours: 8,
                    status: 'completed',
                    user: { full_name: 'Michael Jordan' },
                },
                {
                    id: '6',
                    date: '2026-02-09',
                    time_in: '2026-02-09T08:00:00',
                    time_out: '2026-02-09T18:00:00',
                    rendered_hours: 9,
                    credited_hours: 8,
                    status: 'completed',
                    user: { full_name: 'Alex Honnold' },
                },
                {
                    id: '7',
                    date: '2026-02-09',
                    time_in: '2026-02-09T08:00:00',
                    time_out: '2026-02-09T18:00:00',
                    rendered_hours: 9,
                    credited_hours: 8,
                    status: 'completed',
                    user: { full_name: 'Lebron James' },
                },
                {
                    id: '8',
                    date: '2026-02-09',
                    time_in: '2026-02-09T08:00:00',
                    time_out: '2026-02-09T18:00:00',
                    rendered_hours: 9,
                    credited_hours: 8,
                    status: 'completed',
                    user: { full_name: 'Kween Yasmin' },
                },
                {
                    id: '9',
                    date: '2026-02-09',
                    time_in: '2026-02-09T08:00:00',
                    time_out: '2026-02-09T18:00:00',
                    rendered_hours: 9,
                    credited_hours: 8,
                    status: 'completed',
                    user: { full_name: 'Diwata Pares' },
                },
                {
                    id: '10',
                    date: '2026-02-09',
                    time_in: '2026-02-09T08:00:00',
                    time_out: '2026-02-09T18:00:00',
                    rendered_hours: 9,
                    credited_hours: 8,
                    status: 'completed',
                    user: { full_name: 'Mang Oka' },
                },
                {
                    id: '11',
                    date: '2026-02-09',
                    time_in: '2026-02-09T08:00:00',
                    time_out: '2026-02-09T18:00:00',
                    rendered_hours: 9,
                    credited_hours: 8,
                    status: 'completed',
                    user: { full_name: 'Bronny James' },
                },
                {
                    id: '1',
                    date: '2026-02-09',
                    time_in: '2026-02-09T08:00:00',
                    time_out: '2026-02-09T18:00:00',
                    rendered_hours: 9,
                    credited_hours: 8,
                    status: 'completed',
                    user: { full_name: 'Poison 13' },
                },
                {
                    id: '12',
                    date: '2026-02-09',
                    time_in: '2026-02-09T08:00:00',
                    time_out: '2026-02-09T18:00:00',
                    rendered_hours: 9,
                    credited_hours: 8,
                    status: 'completed',
                    user: { full_name: 'Lanzeta Round3' },
                },
                {
                    id: '13',
                    date: '2026-02-09',
                    time_in: '2026-02-09T08:00:00',
                    time_out: '2026-02-09T18:00:00',
                    rendered_hours: 9,
                    credited_hours: 8,
                    status: 'completed',
                    user: { full_name: 'Dwayne Wade' },
                },
            ];

            setAttendanceRecords(sampleData);
            setLoading(false);
        }, 500);
    }, []);

    const uniqueDates = Array.from(new Set(attendanceRecords.map((r) => r.date)))
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const seenKeys = new Set<string>();
    const uniqueRecords = attendanceRecords.filter((record) => {
        const key = `${record.id}-${record.date}`;
        if (seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
    });

    const filteredRecords = uniqueRecords.filter((record) => {
        const searchTermLower = searchTerm.trim().toLowerCase();
        const matchesSearch = searchTermLower === '' || record.user.full_name.toLowerCase().includes(searchTermLower);
        const matchesStatus = statusFilter === 'all' || record.status.toLowerCase() === statusFilter.toLowerCase();
        const matchesDate = dateFilter === 'all' || record.date.trim() === dateFilter.trim();
        return matchesSearch && matchesStatus && matchesDate;
    });

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            scrollPositionRef.current = container.scrollTop;
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    useLayoutEffect(() => {
        const container = scrollContainerRef.current;
        if (container && scrollPositionRef.current > 0 && filteredRecords.length > 0) {
            container.scrollTop = scrollPositionRef.current;
        }
    }, [filteredRecords]);

    const completedRecords = attendanceRecords.filter((r) => r.status === 'completed');
    const totalCreditedHours = completedRecords.reduce((sum, r) => sum + (r.credited_hours || 0), 0);
    const uniqueDatesCount = uniqueDates.length;
    const avgHoursPerDay = uniqueDatesCount > 0 ? totalCreditedHours / uniqueDatesCount : 0;

    const calculatedStats: AttendanceStats = {
        completed: stats?.completed ?? completedRecords.length,
        incomplete: stats?.incomplete ?? attendanceRecords.filter((r) => r.status === 'incomplete').length,
        noLog: stats?.noLog ?? attendanceRecords.filter((r) => r.status === 'no_log').length,
        avgHoursPerDay: stats?.avgHoursPerDay ?? Math.round(avgHoursPerDay * 10) / 10,
    };

    const formatTime = (timeString: string | null) => {
        if (!timeString) return '-';
        const date = new Date(timeString);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, '0');
        return `${displayHours}:${displayMinutes} ${ampm}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    };

    const formatHours = (hours: number | null) => {
        if (hours === null) return '-';
        return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    };

    const getStatusClasses = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
            case 'incomplete':
                return 'bg-amber-50 text-amber-700 ring-amber-200';
            case 'no_log':
                return 'bg-rose-50 text-rose-700 ring-rose-200';
            default:
                return 'bg-gray-50 text-gray-700 ring-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        if (status === 'no_log') return 'No Log';
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-orange-50/40 to-gray-50 p-6 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Monitor Attendance</h1>
                <p className="mt-1 text-sm text-gray-600">Track daily logs and monitor completion status across interns.</p>
            </motion.div>

            <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: 'Completed', value: calculatedStats.completed },
                    { label: 'Incomplete', value: calculatedStats.incomplete },
                    { label: 'No Log', value: calculatedStats.noLog },
                    { label: 'Avg Hours / Day', value: calculatedStats.avgHoursPerDay?.toFixed(1) || '0.0' },
                ].map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
                    >
                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">{item.label}</p>
                        <h3 className="text-4xl font-black tracking-tight text-gray-900">{item.value}</h3>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="mb-6 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm"
            >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
                            type="text"
                            placeholder="Search by name"
                            value={searchTerm}
                            onChange={(e) => {
                                if (scrollContainerRef.current) {
                                    scrollPositionRef.current = scrollContainerRef.current.scrollTop;
                                }
                                setSearchTerm(e.target.value);
                            }}
                        />
                    </div>

                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600">
                        <Filter size={16} />
                        Filters
                    </div>

                    <div className="relative min-w-[180px]">
                        <select
                            className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-8 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
                            value={dateFilter}
                            onChange={(e) => {
                                if (scrollContainerRef.current) {
                                    scrollPositionRef.current = scrollContainerRef.current.scrollTop;
                                }
                                setDateFilter(e.target.value);
                            }}
                        >
                            <option value="all">All Date</option>
                            {uniqueDates.map((date) => (
                                <option key={date} value={date}>{formatDate(date)}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>

                    <div className="relative min-w-[180px]">
                        <select
                            className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-8 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
                            value={statusFilter}
                            onChange={(e) => {
                                if (scrollContainerRef.current) {
                                    scrollPositionRef.current = scrollContainerRef.current.scrollTop;
                                }
                                setStatusFilter(e.target.value);
                            }}
                        >
                            <option value="all">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="incomplete">Incomplete</option>
                            <option value="no_log">No Log</option>
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>
            </motion.div>

            {loading ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500 shadow-sm">
                    Loading attendance records...
                </div>
            ) : filteredRecords.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                    <UserCheck size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">No attendance records found.</p>
                </div>
            ) : (
                <>
                    <div className="hidden overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm md:block">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1020px] border-collapse">
                                <thead>
                                    <tr className="bg-[#ff7a00] text-left text-xs font-semibold uppercase tracking-wide text-white">
                                        <th className="px-4 py-3.5">Name</th>
                                        <th className="px-4 py-3.5">Date</th>
                                        <th className="px-4 py-3.5">Time In</th>
                                        <th className="px-4 py-3.5">Time Out</th>
                                        <th className="px-4 py-3.5">Rendered Hours</th>
                                        <th className="px-4 py-3.5">Credited Hours</th>
                                        <th className="px-4 py-3.5">Status</th>
                                    </tr>
                                </thead>
                            </table>
                        </div>

                        <div ref={scrollContainerRef} className="max-h-[55vh] overflow-auto">
                            <table className="w-full min-w-[1020px] border-collapse">
                                <tbody>
                                    {filteredRecords.map((record, index) => (
                                        <motion.tr
                                            key={`${record.id}-${record.date}-${index}`}
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.15) }}
                                            className="border-b border-gray-100 text-sm text-gray-700 hover:bg-orange-50/35"
                                        >
                                            <td className="px-4 py-3.5 font-medium text-gray-900">{record.user.full_name}</td>
                                            <td className="px-4 py-3.5">{formatDate(record.date)}</td>
                                            <td className="px-4 py-3.5">{formatTime(record.time_in)}</td>
                                            <td className="px-4 py-3.5">{formatTime(record.time_out)}</td>
                                            <td className="px-4 py-3.5">{formatHours(record.rendered_hours)}</td>
                                            <td className="px-4 py-3.5">{formatHours(record.credited_hours)}</td>
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusClasses(record.status)}`}>
                                                    {getStatusLabel(record.status)}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-3 md:hidden">
                        {filteredRecords.map((record, index) => (
                            <motion.div
                                key={`${record.id}-${record.date}-${index}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.14) }}
                                className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm"
                            >
                                <div className="mb-3 flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                                    <p className="font-semibold text-gray-900">{record.user.full_name}</p>
                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusClasses(record.status)}`}>
                                        {getStatusLabel(record.status)}
                                    </span>
                                </div>

                                <div className="space-y-1.5 text-sm text-gray-600">
                                    <p><span className="font-medium text-gray-700">Date:</span> {formatDate(record.date)}</p>
                                    <p><span className="font-medium text-gray-700">Time In:</span> {formatTime(record.time_in)}</p>
                                    <p><span className="font-medium text-gray-700">Time Out:</span> {formatTime(record.time_out)}</p>
                                    <p><span className="font-medium text-gray-700">Rendered Hours:</span> {formatHours(record.rendered_hours)}</p>
                                    <p><span className="font-medium text-gray-700">Credited Hours:</span> {formatHours(record.credited_hours)}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </>
            )}

            {!loading && filteredRecords.length > 0 && (
                <p className="mt-4 text-right text-xs text-gray-500">
                    Showing {filteredRecords.length} of {attendanceRecords.length} records
                </p>
            )}
        </div>
    );
};

export default MonitorAttendance;
