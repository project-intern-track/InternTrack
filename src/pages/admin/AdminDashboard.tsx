import { useAuth } from '../../context/AuthContext';
import { UserPlus } from 'lucide-react';
import { Bar } from 'react-chartjs-2';

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

    // Sample data for the chart
    type ChartPeriodData = {
        period: string;
        value: number;
    };

    const chartData: ChartPeriodData[] = [
        { period: 'Jan 1-5', value: 24 },
        { period: 'Jan 6-12', value: 28 },
        { period: 'Jan 13-19', value: 30 },
        { period: 'Jan 20-26', value: 38 },
        { period: 'Jan 27-30', value: 20 },
    ];

    const data = {
        labels: chartData.map(d => d.period),
        datasets: [
            {
                label: 'January Signup Trends',
                data: chartData.map(d => d.value),
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
                            text: 'January Signup Trends',
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
                ticks: { stepSize: 8, color: '#6b7280', font: { size: 12 } },
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

    return (
        <div className="admin-dashboard" style={{ backgroundColor: '#ffffff' }}>
            <style>{`
                .admin-dashboard {
                    background-color: #ffffff !important;
                }
                .dashboard-main {
                    background-color: #ffffff !important;
                }
                .dashboard-container {
                    background-color: #ffffff !important;
                }
                @keyframes slideInFromTop {
                    from {
                        opacity: 0;
                        transform: translateY(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes slideInFromBottom {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
            <h1 className="dashboard-welcome">
                Welcome back, <span className="highlight">Admin {user?.name}</span>!
            </h1>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card" style={{ backgroundColor: '#F9F7F4', boxShadow: '0px 4px 4px 0px #00000040' }}>
                    <div className="stat-header">
                        <span className="stat-label">Total Interns</span>
                    </div>
                    <div className="stat-value">124</div>
                    <div className="stat-footer">
                        <span className="stat-trend positive">↑ +12%</span>
                        <span className="stat-description">vs last month</span>
                    </div>
                </div>
                <div className="stat-card" style={{ backgroundColor: '#F9F7F4', boxShadow: '0px 4px 4px 0px #00000040' }}>
                    <div className="stat-header">
                        <span className="stat-label">Active Interns</span>
                    </div>
                    <div className="stat-value">94</div>
                    <div className="stat-footer">
                        <span className="stat-description">Currently Active Interns</span>
                    </div>
                </div>
                <div className="stat-card" style={{ backgroundColor: '#F9F7F4', boxShadow: '0px 4px 4px 0px #00000040' }}>
                    <div className="stat-header">
                        <span className="stat-label">Pending Applications</span>
                    </div>
                    <div className="stat-value">34</div>
                    <div className="stat-footer">
                        <span className="stat-description">Overall Registered Interns</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="dashboard-grid">
                <div className="chart-card" style={{ backgroundColor: '#F9F7F4', boxShadow: '0px 4px 4px 0px #00000040' }}>
                    <div className="chart-header">
                        <div className="chart-title">
                            <UserPlus className="chart-icon" fill="black" />
                            <span>New Registers</span>
                        </div>
                        <select className="chart-filter" aria-label="Filter time period" style={{ backgroundColor: '#eeeeee' }}>
                            <option>Last 30 Days</option>
                            <option>Last 60 Days</option>
                            <option>Last 90 Days</option>
                        </select>
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
                        <div className="activity-item">
                            <div className="activity-avatar"></div>
                        </div>
                        <div className="activity-item">
                            <div className="activity-avatar"></div>
                        </div>
                        <div className="activity-item">
                            <div className="activity-avatar"></div>
                        </div>
                        <div className="activity-item">
                            <div className="activity-avatar"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
