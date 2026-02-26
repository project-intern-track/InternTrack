import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Users, AlertCircle } from 'lucide-react';
import { useRealtime } from '../../hooks/useRealtime';
import { Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
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
    type LegendItem
} from 'chart.js';

// import { number } from 'zod'; Remove Comment If import needed

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const AdminDashboard = () => {
    const { user } = useAuth();

    // Let the system know the value being fetch can be null/0
    const [stats, setStats] = useState<{
        totalInterns: number,
        activeInterns: number,
        pendingApplications: number,
        recentRegisters: string []
    } | null>(null);
    const [activities, setActivities] = useState<any[]>([]);

    const loadDashboardData = useCallback(async () => {
        try {
            // 1. Fetch Stats
            const statsData = await userService.getDashboardStats();
            setStats(statsData);

            // 2. Fetch Recent Activities (Interns + Announcements)
            const recentInterns = await userService.getRecentInterns(5);
            const announcements = await announcementService.getAnnouncements();

            // Merge and sort activities
            const activityFeed = [
                ...(recentInterns?.map(i => ({
                    type: 'application',
                    user: i.full_name,
                    avatar: i.avatar_url,
                    time: i.created_at,
                    message: `submitted an application.`, // removed name dupe
                    color: '#2EC0E5' // Blue for applications
                })) || []),
                ...(announcements?.map(a => ({
                    type: 'announcement',
                    user: 'System',
                    time: a.created_at,
                    message: `New Announcement: ${a.title}`,
                    color: '#ff8800' // Orange for announcements
                })) || [])
            ].sort((a, b) => new Date(b.time!).getTime() - new Date(a.time!).getTime())
                .slice(0, 5); // Take top 5

            setActivities(activityFeed);

        } catch (error) {
            console.error("Error loading dashboard data:", error);
        }
    }, []);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    // Re-fetch whenever users or announcements change in real-time
    useRealtime(['users', 'announcements'], loadDashboardData);

    // Process chart data from stats.recentRegisters
    const processChartData = () => {
        const labels: string[] = [];
        const values: number[] = [];

        if (!stats) return { labels, values }

        // Create 5 buckets of 7 days backwards from today
        for (let i = 4; i >= 0; i--) {
            const end = new Date();
            end.setDate(end.getDate() - (i * 7));
            const start = new Date(end);
            start.setDate(start.getDate() - 6);

            const label = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${end.getDate()}`;
            labels.push(label);

            // Count registers in this range
            const count = stats.recentRegisters.filter(r => {
                const rd = new Date(r);
                return rd >= start && rd <= end;
            }).length;
            values.push(count);
        }

        return { labels, values };
    };

    const { labels, values } = processChartData();

    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Signup Trends',
                data: values,
                backgroundColor: '#ff8800',
                borderColor: '#ff8800',
                borderWidth: 1,
                barPercentage: 0.7,
                categoryPercentage: 0.8
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: { top: 10, bottom: 10, left: 10, right: 10 }
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
                    generateLabels: function (): LegendItem[] {
                        return [{
                            text: 'Signup Trends',
                            fillStyle: '#2EC0E5',
                            strokeStyle: '#2EC0E5',
                            lineWidth: 1,
                            pointStyle: 'rect' as const,
                            hidden: false,
                            index: 0
                        }];
                    }
                }
            },
            tooltip: {
                backgroundColor: '#1f2937',
                titleColor: '#f9fafb',
                bodyColor: '#f9fafb',
                borderColor: '#374151',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12
            }
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
        }
    };

    // calculate time ago
    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    if (!stats) return null;

    return (
        <div className="p-6 md:p-8 bg-gray-50 min-h-screen font-sans">
            {/* Welcome Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    Welcome back, <span className="text-[#ff7a00]">Admin {user?.name}</span>!
                </h2>
                <p className="text-gray-500 mt-2 font-medium">Here's an overview of your internship program.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Interns Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className="bg-white p-6 rounded-2xl relative min-h-[160px] shadow-sm border border-gray-100 cursor-pointer"
                >
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center absolute top-6 right-6">
                        <Users className="text-2xl" />
                    </div>
                    <p className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-3">Total Interns</p>
                    <div className="flex items-end gap-2">
                        <h1 className="text-5xl font-black text-gray-900 leading-none tracking-tight">{stats.totalInterns}</h1>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-blue-600 font-bold text-xs mt-5 bg-blue-50 px-2.5 py-1.5 rounded-md border border-blue-100">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        REGISTERED
                    </span>
                </motion.div>

                {/* Active Interns Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className="bg-white p-6 rounded-2xl relative min-h-[160px] shadow-sm border border-gray-100 cursor-pointer"
                >
                    <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center absolute top-6 right-6">
                        <UserPlus className="text-2xl" />
                    </div>
                    <p className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-3">Active Interns</p>
                    <div className="flex items-end gap-2">
                        <h1 className="text-5xl font-black text-gray-900 leading-none tracking-tight">{stats.activeInterns}</h1>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-green-600 font-bold text-xs mt-5 bg-green-50 px-2.5 py-1.5 rounded-md border border-green-100">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        CURRENTLY ACTIVE
                    </span>
                </motion.div>

                {/* Pending Applications Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className="bg-white p-6 rounded-2xl relative min-h-[160px] shadow-sm border border-gray-100 cursor-pointer"
                >
                    <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center absolute top-6 right-6">
                        <AlertCircle className="text-2xl" />
                    </div>
                    <p className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-3">Pending Applications</p>
                    <div className="flex items-end gap-2">
                        <h1 className="text-5xl font-black text-gray-900 leading-none tracking-tight">{stats.pendingApplications}</h1>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-orange-600 font-bold text-xs mt-5 bg-orange-50 px-2.5 py-1.5 rounded-md border border-orange-100">
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                        INCOMPLETE PROFILES
                    </span>
                </motion.div>
            </div>

            {/* Charts and Activity Section */}
            <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
                    className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <UserPlus className="text-[#ff7a00]" />
                                <span className="font-semibold text-gray-900">New Registers</span>
                            </div>
                            <select className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]" aria-label="Filter time period">
                                <option>Last 30 Days</option>
                            </select>
                        </div>
                    </div>
                    <div className="h-80 bg-white rounded-lg">
                        <Bar data={data} options={options} />
                    </div>
                </motion.div>

                {/* Activity Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                    <h3 className="text-lg font-bold text-gray-900 mb-6 tracking-tight">Recent Activity</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {activities.length === 0 ? (
                            <div className="py-8 flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                    <span className="text-gray-400 text-xl">📭</span>
                                </div>
                                <p className="text-gray-500 font-medium text-sm">No recent activity</p>
                            </div>
                        ) : (
                            activities.map((item, index) => (
                                <motion.div 
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1, ease: "easeOut" }}
                                    className="flex items-start gap-3 pb-4 border-b border-gray-100 last:pb-0 last:border-b-0"
                                >
                                    {/* Avatar */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${item.color === '#ff8800' ? 'bg-orange-50' : 'bg-blue-50'}`}>
                                        {item.avatar ? (
                                            <img src={item.avatar} alt={item.user} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span className="font-bold text-sm" style={{ color: item.color }}>
                                                {item.user === 'System' ? 'A' : item.user.charAt(0)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Activity Details */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900">
                                            <span className="font-bold">{item.user}</span> <span className="text-gray-600">{item.message}</span>
                                        </p>
                                        <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-gray-400 inline-block"></span>
                                            {timeAgo(item.time)}
                                        </p>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;