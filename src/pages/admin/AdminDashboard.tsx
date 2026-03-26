import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, ClipboardList, UserCheck, UserPlus, Users } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import { Bar } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';
import DropdownSelect, { type DropdownSelectOption } from '../../components/DropdownSelect';
import { userService } from '../../services/userServices';
import { announcementService } from '../../services/announcementService';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    type LegendItem,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

type DashboardStats = {
    totalInterns: number;
    activeInterns: number;
    pendingApplications: number;
    recentRegisters: string[];
};

type ActivityItem = {
    type: 'application' | 'announcement';
    user: string;
    avatar?: string | null;
    time: string;
    message: string;
    color: string;
};

type ChartRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

const chartRangeOptions: DropdownSelectOption<ChartRange>[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
];

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [chartRange, setChartRange] = useState<ChartRange>('weekly');

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const [statsData, recentInterns, announcements] = await Promise.all([
                    userService.getDashboardStats(),
                    userService.getRecentInterns(5),
                    announcementService.getAnnouncements(),
                ]);

                setStats(statsData);

                const activityFeed: ActivityItem[] = [
                    ...(recentInterns?.map((intern) => ({
                        type: 'application' as const,
                        user: intern.full_name,
                        avatar: intern.avatar_url,
                        time: intern.created_at,
                        message: 'submitted an application.',
                        color: '#2EC0E5',
                    })) ?? []),
                    ...(announcements?.map((announcement) => ({
                        type: 'announcement' as const,
                        user: 'System',
                        time: announcement.created_at,
                        message: `New Announcement: ${announcement.title}`,
                        color: '#ff8800',
                    })) ?? []),
                ]
                    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                    .slice(0, 5);

                setActivities(activityFeed);
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            }
        };

        loadDashboardData();
    }, []);

    const chartData = useMemo(() => {
        const labels: string[] = [];
        const values: number[] = [];

        if (!stats) return { labels, values };

        const registers = stats.recentRegisters.map((registerDate) => new Date(registerDate));
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (chartRange === 'daily') {
            for (let i = 6; i >= 0; i -= 1) {
                const dayStart = new Date(today);
                dayStart.setHours(0, 0, 0, 0);
                dayStart.setDate(dayStart.getDate() - i);

                const dayEnd = new Date(dayStart);
                dayEnd.setHours(23, 59, 59, 999);

                labels.push(dayStart.toLocaleDateString('en-US', { weekday: 'short' }));
                values.push(registers.filter((register) => register >= dayStart && register <= dayEnd).length);
            }
        } else if (chartRange === 'weekly') {
            for (let i = 5; i >= 0; i -= 1) {
                const end = new Date(today);
                end.setDate(end.getDate() - (i * 7));

                const start = new Date(end);
                start.setDate(start.getDate() - 6);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);

                labels.push(
                    `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${end.getDate()}`
                );
                values.push(registers.filter((register) => register >= start && register <= end).length);
            }
        } else if (chartRange === 'monthly') {
            for (let i = 5; i >= 0; i -= 1) {
                const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 0, 0, 0, 0);
                const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);

                labels.push(monthStart.toLocaleDateString('en-US', { month: 'short' }));
                values.push(registers.filter((register) => register >= monthStart && register <= monthEnd).length);
            }
        } else {
            for (let i = 4; i >= 0; i -= 1) {
                const year = today.getFullYear() - i;
                const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
                const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

                labels.push(String(year));
                values.push(registers.filter((register) => register >= yearStart && register <= yearEnd).length);
            }
        }

        return { labels, values };
    }, [chartRange, stats]);

    const data = {
        labels: chartData.labels,
        datasets: [
            {
                label: 'Signup Trends',
                data: chartData.values,
                backgroundColor: '#ff8800',
                borderColor: '#ff8800',
                borderWidth: 1,
                barPercentage: 0.7,
                categoryPercentage: 0.8,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: { top: 10, bottom: 10, left: 10, right: 10 },
        },
        plugins: {
            legend: {
                display: true,
                position: 'top' as const,
                align: 'center' as const,
                labels: {
                    usePointStyle: true,
                    pointStyle: 'rect',
                    padding: 20,
                    font: { size: 14 },
                    boxWidth: 8,
                    boxHeight: 8,
                    generateLabels: (): LegendItem[] => [
                        {
                            text: 'Signup Trends',
                            fillStyle: '#ff8800',
                            strokeStyle: '#ff8800',
                            lineWidth: 1,
                            pointStyle: 'rect' as const,
                            hidden: false,
                            index: 0,
                        },
                    ],
                },
            },
            tooltip: {
                backgroundColor: '#1f2937',
                titleColor: '#f9fafb',
                bodyColor: '#f9fafb',
                borderColor: '#374151',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                border: { display: false, dash: [3, 3] },
                ticks: { stepSize: 1, color: '#6b7280', font: { size: 12 } },
                grid: { color: '#e5e7eb', lineWidth: 1, drawTicks: false, drawOnChartArea: true },
            },
            x: {
                border: { display: true, dash: [3, 3], color: '#b3b3ba' },
                offset: true,
                ticks: { color: '#6b7280', font: { size: 12 } },
                grid: { color: '#e5e7eb', lineWidth: 1, drawTicks: false, drawOnChartArea: true },
            },
        },
    };

    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;

        if (interval > 1) return `${Math.floor(interval)} years ago`;
        interval = seconds / 2592000;
        if (interval > 1) return `${Math.floor(interval)} months ago`;
        interval = seconds / 86400;
        if (interval > 1) return `${Math.floor(interval)} days ago`;
        interval = seconds / 3600;
        if (interval > 1) return `${Math.floor(interval)} hours ago`;
        interval = seconds / 60;
        if (interval > 1) return `${Math.floor(interval)} minutes ago`;
        return `${Math.floor(seconds)} seconds ago`;
    };

    const metricCards = [
        {
            label: 'Total Interns',
            value: stats?.totalInterns ?? 0,
            description: 'Registered interns',
            icon: Users,
            iconWrapClass: 'bg-blue-100 dark:bg-blue-500/20',
            iconClass: 'text-blue-600 dark:text-blue-300',
        },
        {
            label: 'Active Interns',
            value: stats?.activeInterns ?? 0,
            description: 'Currently active',
            icon: UserCheck,
            iconWrapClass: 'bg-green-100 dark:bg-green-500/20',
            iconClass: 'text-green-600 dark:text-green-300',
        },
        {
            label: 'Pending Applications',
            value: stats?.pendingApplications ?? 0,
            description: 'Incomplete profiles',
            icon: ClipboardList,
            iconWrapClass: 'bg-orange-100 dark:bg-orange-500/20',
            iconClass: 'text-primary dark:text-orange-300',
        },
    ];

    if (!stats) return <PageLoader message="Loading dashboard..." />;

    return (
        <div className="admin-page-shell w-full space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col gap-2"
            >
                <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                    Welcome back, <span className="text-primary">{user?.name ?? 'Admin'}</span>
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Admin dashboard overview
                </p>
            </motion.div>

            <div className="grid grid-cols-3 gap-4">
                {metricCards.map((card, index) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.06 * index, duration: 0.35 }}
                        className="rounded-[2rem] border border-gray-200 bg-white p-3 shadow-sm dark:border-white/5 dark:bg-slate-900/50 md:p-6"
                    >
                        <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-2xl md:mb-4 md:h-12 md:w-12 ${card.iconWrapClass}`}>
                            <card.icon className={card.iconClass} size={20} />
                        </div>
                        <p className="text-[0.55rem] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 md:text-xs">
                            {card.label}
                        </p>
                        <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white md:mt-2 md:text-4xl">
                            {card.value}
                        </p>
                        <p className="mt-1 hidden text-xs font-medium text-gray-500 dark:text-gray-400 md:block">
                            {card.description}
                        </p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.12 }}
                    className="rounded-[2.5rem] border border-gray-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-slate-900/50 md:p-8 lg:col-span-2"
                >
                    <div className="mb-6 flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-500/20">
                                <UserPlus className="text-primary dark:text-orange-300" size={20} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="truncate text-xl font-black text-gray-900 dark:text-white">New Registers</h2>
                                <p className="truncate text-sm text-gray-500 dark:text-gray-400">Recent signup trends</p>
                            </div>
                        </div>
                        <div className="min-w-0 w-full self-stretch sm:w-[180px] sm:self-start md:self-auto">
                            <DropdownSelect
                                value={chartRange}
                                onChange={setChartRange}
                                options={chartRangeOptions}
                                className="min-w-0 max-w-full"
                                buttonClassName="w-full min-w-0 max-w-full bg-gray-50 dark:bg-slate-950/40"
                            />
                        </div>
                    </div>
                    <div className="h-[300px] rounded-[1.75rem] border border-gray-100 bg-gray-50/70 p-3 dark:border-white/5 dark:bg-slate-950/40 md:p-4">
                        <Bar data={data} options={options} />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.18 }}
                    className="rounded-[2.5rem] border border-gray-200 bg-white shadow-sm dark:border-white/5 dark:bg-slate-900/50"
                >
                    <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5 dark:border-white/5 md:px-6">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-500/20">
                            <BarChart className="text-blue-600 dark:text-blue-300" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white">Recent Activity</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {activities.length} item{activities.length !== 1 ? 's' : ''} recorded
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 p-5 md:p-6">
                        {activities.length === 0 ? (
                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 dark:border-white/5 dark:bg-white/5 dark:text-gray-400">
                                No recent activity
                            </div>
                        ) : (
                            activities.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-3 rounded-[1.5rem] border border-gray-100 bg-gray-50/80 p-4 dark:border-white/5 dark:bg-white/5"
                                >
                                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.color === '#ff8800' ? 'bg-orange-100 dark:bg-orange-500/20' : 'bg-cyan-100 dark:bg-cyan-500/20'}`}>
                                        {item.avatar ? (
                                            <img src={item.avatar} alt="u" className="h-full w-full rounded-2xl object-cover" />
                                        ) : (
                                            <span className="text-sm font-bold" style={{ color: item.color }}>
                                                {item.user === 'System' ? 'A' : item.user.charAt(0)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            <span className="font-bold text-gray-900 dark:text-white">{item.user}</span> {item.message}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                            {timeAgo(item.time)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;
