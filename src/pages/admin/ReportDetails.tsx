import { useNavigate, useParams } from 'react-router-dom';
import { FileText, ArrowLeft, Calendar, CheckCircle, Clock, UserCheck, BarChart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

const ReportDetails = () => {
    const { internId } = useParams<{ internId: string }>();
    const navigate = useNavigate();
    const [selectedTab, setSelectedTab] = useState('weekly');

    const [profile, setProfile] = useState<any>(null);
    const [weekly, setWeekly] = useState<any>(null);
    const [monthly, setMonthly] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                const [profRes, weekRes, monthRes] = await Promise.all([
                    apiClient.get(`/reports/interns/${internId}`),
                    apiClient.get(`/reports/interns/${internId}/weekly`),
                    apiClient.get(`/reports/interns/${internId}/monthly`)
                ]);
                setProfile(profRes.data.data);
                setWeekly(weekRes.data.data);
                setMonthly(monthRes.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (internId) fetchAll();
    }, [internId]);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading report details...</div>;

    if (!profile) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Report not found</h2>
                <button
                    onClick={() => navigate('/admin/reports')}
                    style={{
                        marginTop: '1rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#ff8800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    Back to Reports
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <style>{`
                @media (max-width: 768px) {
                    .header-content {
                        flex-direction: column !important;
                        align-items: center !important;
                        gap: 0 !important;
                    }
                    .profile-section {
                        margin-top: 1rem !important;
                        margin-right: 0 !important;
                        width: 100% !important;
                    }
                    .report-title {
                        font-size: 1.5rem !important;
                    }
                    .info-grid {
                        gap: 1rem !important;
                        justify-content: center !important;
                        text-align: center !important;
                    }
                    .tab-buttons {
                        gap: 0.5rem !important;
                    }
                    .tab-button {
                        flex: 1 1 100% !important;
                        padding: 0.5rem 1rem !important;
                        font-size: 0.8rem !important;
                        justify-content: center !important;
                        text-align: center !important;
                    }
                    .weekly-stats {
                        flex-direction: column !important;
                    }
                    .activity-item {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 0.5rem !important;
                    }
                    .activity-description {
                        text-align: left !important;
                        order: 2 !important;
                    }
                    .activity-hours {
                        order: 1 !important;
                    }
                    .monthly-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .project-card {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 0.75rem !important;
                    }
                    .supervisor-header {
                        flex-direction: column !important;
                        gap: 0.5rem !important;
                        text-align: left !important;
                    }
                }
                @media (min-width: 769px) and (max-width: 1024px) {
                    .monthly-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                    .tab-button {
                        flex: 1 1 auto !important;
                        padding: 0.75rem 1.5rem !important;
                        font-size: 0.9rem !important;
                        justify-content: center !important;
                        text-align: center !important;
                    }
                }
            `}</style>
            {/* Header Container */}
            <div style={{
                background: '#F9F7F4',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid #e5e5e5',
                marginBottom: '2rem'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    marginBottom: '1rem'
                }}>
                    <button
                        onClick={() => navigate('/admin/reports')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        <ArrowLeft size={16} />
                        Back to Reports
                    </button>
                </div>

                {/* Intern Information */}
                <div className="header-content" style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'flex-start',
                    gap: '2rem',
                    flexDirection: 'row'
                }}>
                    <div style={{ minWidth: 0 }}>
                        <h1 className="report-title" style={{
                            margin: '0 0 0.5rem 0',
                            color: '#2b2a2a',
                            fontSize: '2rem'
                        }}>
                            <span style={{ color: '#ff8800' }}>{profile.name}</span>'s Report
                        </h1>
                        <div className="info-grid" style={{
                            display: 'flex',
                            gap: '2rem',
                            flexWrap: 'wrap'
                        }}>
                            {profile.ojtId && (
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '1rem', color: '#666', fontWeight: '500', marginBottom: '0.25rem' }}>OJT ID</div>
                                    <div style={{ fontSize: '1.2rem', color: '#2b2a2a', fontWeight: '600' }}>
                                        {profile.ojtId}
                                    </div>
                                </div>
                            )}
                            {profile.department && (
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '1rem', color: '#666', fontWeight: '500', marginBottom: '0.25rem' }}>Department</div>
                                    <div style={{ fontSize: '1.2rem', color: '#2b2a2a', fontWeight: '600' }}>
                                        {profile.department}
                                    </div>
                                </div>
                            )}
                            {profile.supervisor && (
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '1rem', color: '#666', fontWeight: '500', marginBottom: '0.25rem' }}>Supervisor</div>
                                    <div style={{ fontSize: '1.2rem', color: '#2b2a2a', fontWeight: '600' }}>
                                        {profile.supervisor}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Profile Section */}
                    <div className="profile-section" style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        flexDirection: 'column', 
                        marginTop: '0',
                        marginRight: '0'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: '#ff8800',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '0.75rem',
                            fontSize: '2rem',
                            color: 'white',
                            fontWeight: 'bold'
                        }}>
                            {profile.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div style={{ fontSize: '1.1rem', color: '#2b2a2a', fontWeight: '600', marginBottom: '0.25rem', textAlign: 'center' }}>
                            {profile.name}
                        </div>
                        <div style={{ fontSize: '1rem', color: '#666', marginBottom: '0.5rem', textAlign: 'center' }}>
                            {profile.role}
                        </div>
                        <span style={{
                            backgroundColor: profile.status === 'Active' ? '#dcfce7' : '#dbeafe',
                            color: profile.status === 'Active' ? '#166534' : '#1e40af',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            display: 'inline-block'
                        }}>
                            {profile.status}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Report Tabs Container */}
            <div style={{
                background: '#F9F7F4',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid #e5e5e5',
                marginBottom: '2rem'
            }}>
                {/* Tab Buttons */}
                <div className="tab-buttons" style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={() => setSelectedTab('weekly')}
                        className="tab-button"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: selectedTab === 'weekly' ? '#ff8800' : '#f3f4f6',
                            color: selectedTab === 'weekly' ? 'white' : '#2b2a2a',
                            border: selectedTab === 'weekly' ? '1px solid #ff8800' : '1px solid #d1d5db',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            flex: 'auto',
                            justifyContent: 'center',
                            textAlign: 'center'
                        }}
                    >
                        <Calendar size={16} />
                        Weekly Summary
                    </button>
                    <button
                        onClick={() => setSelectedTab('monthly')}
                        className="tab-button"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: selectedTab === 'monthly' ? '#ff8800' : '#f3f4f6',
                            color: selectedTab === 'monthly' ? 'white' : '#2b2a2a',
                            border: selectedTab === 'monthly' ? '1px solid #ff8800' : '1px solid #d1d5db',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            flex: 'auto',
                            justifyContent: 'center',
                            textAlign: 'center'
                        }}
                    >
                        <FileText className="text-[#0052cc]" size={20} />
                        Monthly Summary
                    </button>
                    <button
                        onClick={() => setSelectedTab('full')}
                        className="tab-button full"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: selectedTab === 'full' ? '#ff8800' : '#f3f4f6',
                            color: selectedTab === 'full' ? 'white' : '#2b2a2a',
                            border: selectedTab === 'full' ? '1px solid #ff8800' : '1px solid #d1d5db',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            flex: 'auto',
                            justifyContent: 'center',
                            textAlign: 'center'
                        }}
                    >
                        <BarChart size={16} />
                        Full Report
                    </button>
                </div>

                {/* Tab Content */}
                <div style={{
                    background: 'white',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    border: '1px solid #e5e5e5'
                }}>
                    {selectedTab === 'weekly' && weekly && (
                        <div>
                            <h3 style={{ margin: '0 0 1rem 0', color: '#2b2a2a', fontSize: '1.2rem' }}>
                                {weekly.week_label}
                            </h3>
                            <div className="weekly-stats" style={{
                                display: 'flex',
                                gap: '1rem',
                                marginBottom: '1rem',
                                flexDirection: 'row'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.1rem' }}>Total Hours</div>
                                    <div style={{ fontSize: '1.1rem', color: '#2b2a2a', fontWeight: '600' }}>
                                        {weekly.total_hours} hours
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.1rem' }}>Total Tasks</div>
                                    <div style={{ fontSize: '1.1rem', color: '#2b2a2a', fontWeight: '600' }}>
                                        {weekly.total_tasks} tasks
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', color: '#2b2a2a', fontSize: '1rem', fontWeight: '600' }}>
                                    Daily Activities
                                </h4>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem'
                                }}>
                                    {weekly.daily_activities.length === 0 ? (
                                        <div style={{ color: '#666', fontSize: '0.9rem', fontStyle: 'italic', padding: '1rem', background: '#f9f7f4', borderRadius: '6px' }}>No activities logged this week.</div>
                                    ) : (
                                        weekly.daily_activities.map((activity: any, idx: number) => (
                                            <div key={idx} className="activity-item" style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.75rem',
                                                background: '#f9f7f4',
                                                borderRadius: '6px',
                                                border: '1px solid #e5e5e5',
                                                flexDirection: 'row',
                                                gap: '0'
                                            }}>
                                                <div style={{ fontSize: '0.9rem', color: '#2b2a2a', fontWeight: '500' }}>{activity.day}</div>
                                                <div className="activity-description" style={{ 
                                                    fontSize: '0.85rem', 
                                                    color: '#666', 
                                                    flex: 1, 
                                                    textAlign: 'center'
                                                }}>
                                                    {activity.description}
                                                </div>
                                                <div className="activity-hours" style={{ 
                                                    fontSize: '0.85rem', 
                                                    color: '#666', 
                                                    fontWeight: '500'
                                                }}>{activity.hours}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', color: '#2b2a2a', fontSize: '1rem', fontWeight: '600' }}>
                                    Key Achievements
                                </h4>
                                {weekly.achievements && weekly.achievements.length > 0 ? (
                                    <ul style={{ margin: '0', paddingLeft: '1.5rem', color: '#666', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                        {weekly.achievements.map((ach: string, idx: number) => (
                                            <li key={idx} style={{ marginBottom: '0.5rem' }}>{ach}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p style={{ margin: '0', color: '#666', fontSize: '0.9rem', fontStyle: 'italic' }}>No completed tasks this week.</p>
                                )}
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', color: '#2b2a2a', fontSize: '1rem', fontWeight: '600' }}>
                                    Challenges
                                </h4>
                                <p style={{ margin: '0', color: '#666', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                    {weekly.challenges || 'No challenges reported.'}
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {selectedTab === 'monthly' && monthly && (
                        <div>
                            <h3 style={{ margin: '0 0 1rem 0', color: '#2b2a2a', fontSize: '1.5rem' }}>
                                {monthly.month_year}
                            </h3>
                            <div className="monthly-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1rem',
                                marginBottom: '1rem'
                            }}>
                                <div style={{
                                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                    background: '#9DB8F133', borderRadius: '8px', padding: '1.5rem', border: '1px solid #9DB8F133'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <Clock size={24} color="#1C2DE9" style={{ marginRight: '0.5rem' }} />
                                        <span style={{ fontSize: '1.2rem', color: '#000000', fontWeight: '500' }}>Total Hours</span>
                                    </div>
                                    <div style={{ fontSize: '1.8rem', color: '#000000', fontWeight: 'bold' }}>{monthly.total_hours}</div>
                                </div>
                                <div style={{
                                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                    background: '#C0E8BC33', borderRadius: '8px', padding: '1.5rem', border: '1px solid #C0E8BC33'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <CheckCircle size={24} color="#4ACE1E" style={{ marginRight: '0.5rem' }} />
                                        <span style={{ fontSize: '1.2rem', color: '#000000', fontWeight: '500' }}>Task Completed</span>
                                    </div>
                                    <div style={{ fontSize: '1.8rem', color: '#000000', fontWeight: 'bold' }}>{monthly.tasks_completed}</div>
                                </div>
                                <div style={{
                                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                    background: '#D6A7EA33', borderRadius: '8px', padding: '1.5rem', border: '1px solid #D6A7EA33'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <UserCheck size={24} color="#BF27D0" style={{ marginRight: '0.5rem' }} />
                                        <span style={{ fontSize: '1.2rem', color: '#000000', fontWeight: '500' }}>Attendance</span>
                                    </div>
                                    <div style={{ fontSize: '1.8rem', color: '#000000', fontWeight: 'bold' }}>{monthly.attendance_percentage}%</div>
                                </div>
                                <div style={{
                                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                    background: '#FF880033', borderRadius: '8px', padding: '1.5rem', border: '1px solid #FF880033'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <FileText size={24} color="#ff8800" style={{ marginRight: '0.5rem' }} />
                                        <span style={{ fontSize: '1.2rem', color: '#000000', fontWeight: '500' }}>Projects</span>
                                    </div>
                                    <div style={{ fontSize: '1.8rem', color: '#000000', fontWeight: 'bold' }}>{monthly.projects_count}</div>
                                </div>
                            </div>
                            <div style={{ marginTop: '2rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', color: '#2b2a2a', fontSize: '1.2rem', fontWeight: '600' }}>Monthly Overview</h4>
                                <p style={{ margin: '0', color: '#666', fontSize: '0.9rem', lineHeight: '1.5' }}>{monthly.overview}</p>
                            </div>

                            <hr style={{ border: 'none', borderTop: '2px solid #e5e5e5', margin: '2rem 0' }} />

                            <div style={{ marginTop: '2rem' }}>
                                <h4 style={{ margin: '0 0 1.5rem 0', color: '#2b2a2a', fontSize: '1.5rem', fontWeight: '600' }}>Skills Developed</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {monthly.skills && monthly.skills.length > 0 ? monthly.skills.map((skill: any, idx: number) => (
                                        <div key={idx}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '1rem', color: '#2b2a2a', fontWeight: '500' }}>{skill.skill_name}</span>
                                                <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>{skill.proficiency}</span>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e5e5', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: skill.proficiency, height: '100%', backgroundColor: '#ff8800', borderRadius: '4px' }} />
                                            </div>
                                        </div>
                                    )) : <p style={{ color: '#666', fontStyle: 'italic', fontSize: '0.9rem' }}>No skills reported this month.</p>}
                                </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '2px solid #e5e5e5', margin: '2rem 0' }} />

                            <div style={{ marginTop: '2rem' }}>
                                <h4 style={{ margin: '0 0 1.5rem 0', color: '#2b2a2a', fontSize: '1.5rem', fontWeight: '600' }}>Projects</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {monthly.projects && monthly.projects.length > 0 ? monthly.projects.map((proj: any, idx: number) => (
                                        <div key={idx} className="project-card" style={{ 
                                            background: '#64AACA12', 
                                            borderRadius: '8px', 
                                            padding: '1rem', 
                                            border: '1px solid #e5e5e5', 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            flexDirection: 'row',
                                            gap: '0'
                                        }}>
                                            <div>
                                                <h5 style={{ margin: '0 0 0.5rem 0', color: '#2b2a2a', fontSize: '1rem', fontWeight: '600' }}>{proj.title}</h5>
                                                <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem', lineHeight: '1.4' }}>{proj.description}</p>
                                                <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>Role: {proj.role}</div>
                                            </div>
                                            <span style={{ backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.8rem', fontWeight: '500', padding: '0.25rem 0.75rem', borderRadius: '9999px', display: 'inline-block' }}>{proj.status}</span>
                                        </div>
                                    )) : <p style={{ color: '#666', fontStyle: 'italic', fontSize: '0.9rem' }}>No completed projects to display.</p>}
                                </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '2px solid #e5e5e5', margin: '2rem 0' }} />
                            
                            <div style={{ marginTop: '2rem' }}>
                                <h4 style={{ margin: '0 0 1.5rem 0', color: '#2b2a2a', fontSize: '1.5rem', fontWeight: '600' }}>Supervisor Feedback</h4>
                                {monthly.supervisor_feedback ? (
                                    <div style={{ background: '#64AACA12', borderRadius: '8px', padding: '1.5rem', border: '1px solid #e5e5e5' }}>
                                        <div className="supervisor-header" style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center', 
                                            marginBottom: '1rem',
                                            flexDirection: 'row',
                                            gap: '0',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '1rem', color: '#2b2a2a', fontWeight: '500' }}>Supervisor: {monthly.supervisor_feedback.supervisor_name}</div>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <span key={i} style={{ color: '#ff8800', fontSize: '1.5rem' }}>
                                                        {i < monthly.supervisor_feedback.rating ? '★' : '☆'}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <p style={{ margin: '0', color: '#2b2a2a', fontSize: '0.9rem', lineHeight: '1.5', fontStyle: 'italic', textAlign: 'center' }}>
                                            "{monthly.supervisor_feedback.comment}"
                                        </p>
                                    </div>
                                ) : (
                                    <p style={{ color: '#666', fontStyle: 'italic', fontSize: '0.9rem' }}>No supervisor feedback available yet.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {selectedTab === 'full' && (
                        <div>
                            <h3 style={{ margin: '0 0 1rem 0', color: '#2b2a2a', fontSize: '1.2rem' }}>
                                Full Report
                            </h3>
                            <p style={{ margin: '0', color: '#666', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                Comprehensive report covering all aspects of {profile.name}'s OJT experience.
                                Including detailed metrics, achievements, and areas for improvement under the supervision of {profile.supervisor}.
                                <br/><br/>
                                <em>Full historical reporting export is ready for generating. For the most granular insights, check the Weekly and Monthly Breakdown tabs.</em>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportDetails;
