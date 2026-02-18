import { useAuth } from '../../context/AuthContext';
import { UserPlus } from 'lucide-react';

const AdminDashboard = () => {
    const { user } = useAuth();

    // Sample data for the chart
    const chartData = [
        { period: 'Jan 1-5', value: 24 },
        { period: 'Jan 6-12', value: 28 },
        { period: 'Jan 13-19', value: 30 },
        { period: 'Jan 20-26', value: 38 },
        { period: 'Jan 27-30', value: 20 },
    ];

    const maxValue = Math.max(...chartData.map(d => d.value));

    return (
        <div className="admin-dashboard">
            <h1 className="dashboard-welcome">
                Welcome back, <span className="highlight">Admin {user?.name}</span>!
            </h1>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Total Interns</span>
                    </div>
                    <div className="stat-value">124</div>
                    <div className="stat-footer">
                        <span className="stat-trend positive">
                            ↑ +12%
                        </span>
                        <span className="stat-description">vs last month</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-label">Active Interns</span>
                    </div>
                    <div className="stat-value">94</div>
                    <div className="stat-footer">
                        <span className="stat-description">Currently Active Interns</span>
                    </div>
                </div>

                <div className="stat-card">
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
                <div className="chart-card">
                    <div className="chart-header">
                        <div className="chart-title">
                            <UserPlus className="chart-icon" fill="black"/>
                            <span>New Registers</span>
                        </div>
                        <select className="chart-filter" aria-label="Filter time period">
                            <option>Last 30 Days</option>
                            <option>Last 60 Days</option>
                            <option>Last 90 Days</option>
                        </select>
                    </div>
                    <div className="chart-content">
                        <div className="chart-legend">
                            <span className="chart-legend-dot"></span>
                            January Signup Trends
                        </div>
                        <div className="bar-chart">
                            {chartData.map((item, index) => (
                                <div key={index} className="bar-container">
                                    <div 
                                        className="bar"
                                        style={{ height: `${(item.value / maxValue) * 100}%` }}
                                    >
                                        <span className="bar-value">{item.value}</span>
                                    </div>
                                    <span className="bar-label">{item.period}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="activity-card">
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
