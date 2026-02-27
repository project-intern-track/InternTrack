import { Search, Download, FileText, Users, CheckCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

interface InternCardProps {
    name: string;
    email: string;
    role: string;
    hours: string;
    attendance: string;
    status: string;
    lastUpdate: string;
}

const InternCard = ({ name, email, role, hours, attendance, status, lastUpdate }: InternCardProps) => {
    const statusClass = status === 'Completed'
        ? 'bg-blue-50 text-blue-700 ring-blue-200'
        : 'bg-emerald-50 text-emerald-700 ring-emerald-200';

    return (
        <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="mb-4 border-b border-gray-100 pb-3">
                <div className="mb-1.5 flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-gray-900">{name}</h3>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass}`}>
                        {status}
                    </span>
                </div>
                <p className="text-sm text-gray-500">{email}</p>
            </div>

            <div className="mb-4 space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500">Role</span>
                    <span className="font-medium text-gray-800">{role}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500">Hours</span>
                    <span className="font-medium text-gray-800">{hours}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500">Attendance</span>
                    <span className="font-medium text-gray-800">{attendance}</span>
                </div>
            </div>

            <p className="border-t border-gray-100 pt-3 text-xs text-gray-400">Last update: {lastUpdate}</p>
        </div>
    );
};

const Reports = () => {
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const interns = [
        {
            name: 'Kevin Lim',
            email: 'kevinlim@gmail.com',
            role: 'Fullstack Developer',
            hours: '400h',
            attendance: '75%',
            status: 'Active',
            lastUpdate: '2 hours ago'
        },
        {
            name: 'Alex John Ramirez',
            email: 'alexjohnramirez@email.com',
            role: 'Frontend Developer',
            hours: '300h',
            attendance: '45%',
            status: 'Active',
            lastUpdate: '5 hours ago'
        },
        {
            name: 'Bianca Louise Santos',
            email: 'bianca.santos@email.com',
            role: 'UI/UX Designer',
            hours: '450h',
            attendance: '65%',
            status: 'Active',
            lastUpdate: '1 hour ago'
        },
        {
            name: 'Jewel Gonzales',
            email: 'jewelgonzales@email.com',
            role: 'Data Analyst',
            hours: '486h',
            attendance: '96%',
            status: 'Active',
            lastUpdate: '7 hours ago'
        },
        {
            name: 'Alex Wilson',
            email: 'alex.w@email.com',
            role: 'Mobile Dev',
            hours: '450h',
            attendance: '94%',
            status: 'Active',
            lastUpdate: '6 hours ago'
        },
        {
            name: 'Lisa Brown',
            email: 'lisabrown@email.com',
            role: 'QA Tester',
            hours: '300h',
            attendance: '100%',
            status: 'Completed',
            lastUpdate: '1 week ago'
        }
    ];

    const processedInterns = useMemo(() => {
        return interns.map((intern) => ({
            ...intern,
            status: intern.attendance === '100%' ? 'Completed' : intern.status
        }));
    }, []);

    const filteredInterns = useMemo(() => {
        return processedInterns.filter((intern) => {
            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'active' && intern.status === 'Active') ||
                (filterStatus === 'completed' && intern.status === 'Completed');

            const matchesSearch = searchTerm === '' ||
                intern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                intern.email.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesStatus && matchesSearch;
        });
    }, [processedInterns, filterStatus, searchTerm]);

    const handleExportAll = () => {
        if (filteredInterns.length === 0) return;

        const headers = ['Name', 'Email', 'Role', 'Hours', 'Attendance', 'Status', 'Last Update'];
        const rows = filteredInterns.map((intern) => [
            intern.name,
            intern.email,
            intern.role,
            intern.hours,
            intern.attendance,
            intern.status,
            intern.lastUpdate,
        ]);

        const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `admin_reports_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const completedCount = filteredInterns.filter((intern) => intern.status === 'Completed').length;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-orange-50/40 to-gray-50 p-6 md:p-8">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Reports</h1>
                <p className="mt-1 text-sm text-gray-600">Weekly and monthly intern performance summaries.</p>
            </motion.div>

            <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                    { label: 'Visible Records', value: filteredInterns.length, icon: Users },
                    { label: 'Completed', value: completedCount, icon: CheckCircle },
                    { label: 'Report Type', value: 'Weekly/Monthly', icon: FileText },
                ].map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
                    >
                        <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-[#ff7a00]">
                            <item.icon size={18} />
                        </div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">{item.label}</p>
                        <h3 className="text-2xl font-black tracking-tight text-gray-900">{item.value}</h3>
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
                            type="text"
                            placeholder="Search by name or email"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100"
                        />
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#ff7a00] focus:ring-4 focus:ring-orange-100 sm:w-[180px]"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                    </select>

                    <button
                        onClick={handleExportAll}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff7a00] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#eb6f00] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={filteredInterns.length === 0}
                    >
                        <Download size={16} />
                        Export All
                    </button>
                </div>
            </motion.div>

            {filteredInterns.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500 shadow-sm">
                    No report entries match your current filters.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                    {filteredInterns.map((intern, index) => (
                        <motion.div
                            key={`${intern.email}-${index}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.16) }}
                        >
                            <InternCard {...intern} />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Reports;
