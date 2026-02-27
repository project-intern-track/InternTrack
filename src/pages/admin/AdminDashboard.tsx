import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserPlus } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
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

    useEffect(() => {
        const loadDashboardData = async () => {
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

    if (!stats) return null;

    return (
        <>

            <h1 className="dashboard-welcome" style={{
                animation: 'slideInFromTop 0.6s ease-out',
                animationFillMode: 'both'
            }}>
                Welcome back, <span className="highlight">Admin {user?.name}</span>!
            </h1>

            {/* Stats Cards */}
            <div className="stats-grid" style={{
                animation: 'slideInFromTop 0.8s ease-out 0.2s',
                animationFillMode: 'both'
            }}>
                <div className="stat-card" style={{ backgroundColor: '#F9F7F4', boxShadow: '0px 4px 4px 0px #00000040' }}>
                    <div className="stat-header">
                        <span className="stat-label" style={{ color: '#000000', fontSize: '1rem' }}>Total Interns</span>
                    </div>
                    <div className="stat-value">{stats.totalInterns}</div>
                    <div className="stat-footer">
                        <span className="stat-trend positive">
                            {/* ↑ +12% */}
                        </span>
                        <span className="stat-description">Registered Interns</span>
                    </div>
                </div>
                <div className="stat-card" style={{ backgroundColor: '#F9F7F4', boxShadow: '0px 4px 4px 0px #00000040' }}>
                    <div className="stat-header">
                        <span className="stat-label" style={{ color: '#000000', fontSize: '1rem' }}>Active Interns</span>
                    </div>
                    <div className="stat-value">{stats.activeInterns}</div>
                    <div className="stat-footer">
                        <span className="stat-description">Currently Active</span>
                    </div>
                </div>
                <div className="stat-card" style={{ backgroundColor: '#F9F7F4', boxShadow: '0px 4px 4px 0px #00000040' }}>
                    <div className="stat-header">
                        <span className="stat-label" style={{ color: '#000000', fontSize: '1rem' }}>Pending Applications</span>
                    </div>
                    <div className="stat-value">{stats.pendingApplications}</div>
                    <div className="stat-footer">
                        <span className="stat-description">Incomplete Profiles</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="dashboard-grid" style={{
                animation: 'slideInFromBottom 0.8s ease-out 0.4s',
                animationFillMode: 'both'
            }}>
                <div className="chart-card" style={{ backgroundColor: '#F9F7F4', boxShadow: '0px 4px 4px 0px #00000040' }}>
                    <div className="chart-head-container" style={{ backgroundColor: '#f6f6f6', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', marginLeft: '0.5rem' }}>
                        <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0' }}>
                            <div className="chart-title">
                                <UserPlus className="chart-icon" />
                                <span>New Registers</span>
                            </div>
                            <select className="chart-filter" aria-label="Filter time period" style={{ backgroundColor: '#eeeeee' }}>
                                <option>Last 30 Days</option>
                            </select>
                        </div>
                    </div>
                    <div className="chart-content" style={{ height: '300px', backgroundColor: '#ffffff' }}>
                        <Bar data={data} options={options} />
                    </div>
                </div>

                <div className="activity-card" style={{ backgroundColor: '#F9F7F4', boxShadow: '0px 4px 4px 0px #00000040' }}>
                    <div className="activity-header">
                        <h3>Recent Activity</h3>
                    </div>
                    <div className="activity-content">
                        {activities.length === 0 ? (
                            <div style={{ padding: '1rem', color: '#666' }}>No recent activity</div>
                        ) : (
                            activities.map((item, index) => (
                                <div key={index} className="activity-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

                                    {/* Simple Avatar Circle */}
                                    <div className="activity-avatar" style={{
                                        backgroundColor: item.color === '#ff8800' ? '#fff7ed' : '#ecfeff',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        {item.avatar ? (
                                            <img src={item.avatar} alt="u" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ color: item.color, fontWeight: 'bold' }}>
                                                {item.user === 'System' ? 'A' : item.user.charAt(0)}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <div style={{ fontSize: '0.875rem', color: '#333', fontWeight: '500' }}>
                                            <span style={{ fontWeight: '700' }}>{item.user}</span> {item.message}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#999', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <span style={{ width: '4px', height: '4px', backgroundColor: '#999', borderRadius: '50%', display: 'inline-block' }}></span>
                                            {timeAgo(item.time)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminDashboard;