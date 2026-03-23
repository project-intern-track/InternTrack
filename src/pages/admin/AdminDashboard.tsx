import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserPlus } from 'lucide-react';
import PageLoader from '../../components/PageLoader';
import { Bar } from 'react-chartjs-2';
import { userService } from '../../services/userServices';
import { announcementService } from '../../services/announcementService';
import DropdownSelect from '../../components/DropdownSelect';

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

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                // Parallel fetch for faster loading
                const [statsData, recentInterns, announcements] = await Promise.all([
                    userService.getDashboardStats(),
                    userService.getRecentInterns(5),
                    announcementService.getAnnouncements(),
                ]);

                setStats(statsData);

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
        };

        loadDashboardData();
    }, []);

    // Process chart data from stats.recentRegisters
    const processChartData = () => {
        const labels: string[] = [];
        const values: number[] = [];

        //
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

    if (!stats) return <PageLoader message="Loading dashboard..." />;

    return (
        <div className="admin-page-shell w-full space-y-6">
            <h1 className="dashboard-welcome animate-in fade-in duration-700">
                Welcome back, <span className="highlight">Admin {user?.name}</span>!
            </h1>

            {/* Stats Cards */}
            <div className="stats-grid manage-users-stats-grid animate-in fade-in duration-700">
                <div className="stat-card bg-gray-50 dark:bg-slate-900/60 shadow-md">
                    <div className="stat-header">
                        <span className="stat-label text-base text-black dark:text-white">Total Interns</span>
                    </div>
                    <div className="stat-value">{stats.totalInterns}</div>
                    <div className="stat-footer">
                        <span className="stat-trend positive">
                            {/* ↑ +12% */}
                        </span>
                        <span className="stat-description">Registered Interns</span>
                    </div>
                </div>
                <div className="stat-card bg-gray-50 dark:bg-slate-900/60 shadow-md">
                    <div className="stat-header">
                        <span className="stat-label text-base text-black dark:text-white">Active Interns</span>
                    </div>
                    <div className="stat-value">{stats.activeInterns}</div>
                    <div className="stat-footer">
                        <span className="stat-description">Currently Active</span>
                    </div>
                </div>
                <div className="stat-card bg-gray-50 dark:bg-slate-900/60 shadow-md">
                    <div className="stat-header">
                        <span className="stat-label text-base text-black dark:text-white">Pending Applications</span>
                    </div>
                    <div className="stat-value">{stats.pendingApplications}</div>
                    <div className="stat-footer">
                        <span className="stat-description">Incomplete Profiles</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="dashboard-grid animate-in fade-in duration-700">
                <div className="chart-card bg-gray-50 dark:bg-slate-900/60 shadow-md">
                    <div className="chart-head-container bg-gray-100 dark:bg-slate-800 rounded-xl p-4 mb-4 ml-2">
                        <div className="chart-header mb-0">
                            <div className="chart-title">
                                <UserPlus className="chart-icon" />
                                <span>New Registers</span>
                            </div>
                            <div className="min-w-[180px]">
                                <DropdownSelect
                                    value="last-30-days"
                                    onChange={() => {}}
                                    options={[{ value: 'last-30-days', label: 'Last 30 Days' }]}
                                    buttonClassName="chart-filter bg-gray-200 dark:bg-slate-700"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="chart-content h-[300px] bg-white dark:bg-slate-900 rounded-lg">
                        <Bar data={data} options={options} />
                    </div>
                </div>

                <div className="activity-card bg-gray-50 dark:bg-slate-900/60 shadow-md">
                    <div className="activity-header">
                        <h3>Recent Activity</h3>
                    </div>
                    <div className="activity-content">
                        {activities.length === 0 ? (
                            <div className="p-4 text-gray-500 dark:text-gray-400">No recent activity</div>
                        ) : (
                            activities.map((item, index) => (
                                <div key={index} className="activity-item">

                                    {/* Simple Avatar Circle */}
                                    <div className={`activity-avatar w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.color === '#ff8800' ? 'bg-orange-50' : 'bg-cyan-50'}`}>
                                        {item.avatar ? (
                                            <img src={item.avatar} alt="u" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span className="font-bold" style={{ color: item.color }}>
                                                {item.user === 'System' ? 'A' : item.user.charAt(0)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 flex flex-col gap-1">
                                        <div className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                                            <span className="font-bold">{item.user}</span> {item.message}
                                        </div>
                                        <div className="text-xs text-gray-400 flex items-center gap-1">
                                            <span className="w-1 h-1 bg-gray-400 rounded-full inline-block"></span>
                                            {timeAgo(item.time)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
