import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, UserCheck } from 'lucide-react';
import { Calendar, FileText, BarChart } from 'lucide-react';
import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Download } from 'lucide-react';

interface ReportDetailsProps {
    name: string;
    email: string;
    role: string;
    hours: string;
    attendance: string;
    status: string;
    lastUpdate: string;
}

const mockReportData: { [key: string]: ReportDetailsProps & { ojtId: string; department: string; supervisor: string } } = {
    'kevin-lim': {
        name: 'Kevin Lim',
        email: 'kevinlim@gmail.com',
        role: 'Fullstack Developer',
        hours: '400h',
        attendance: '75%',
        status: 'Active',
        lastUpdate: '2 hours ago',
        ojtId: '1234',
        department: 'Information Technology',
        supervisor: 'Mae Santos'
    },
    'alex-john-ramirez': {
        name: 'Alex John Ramirez',
        email: 'alexjohnramirez@email.com',
        role: 'Frontend Developer',
        hours: '300h',
        attendance: '45%',
        status: 'Active',
        lastUpdate: '5 hours ago',
        ojtId: '1235',
        department: 'Information Technology',
        supervisor: 'Mae Santos'
    },
    'bianca-louise-santos': {
        name: 'Bianca Louise Santos',
        email: 'bianca.santos@email.com',
        role: 'UI/UX Designer',
        hours: '450h',
        attendance: '65%',
        status: 'Active',
        lastUpdate: '1 hour ago',
        ojtId: '1236',
        department: 'Design Department',
        supervisor: 'Mae Santos'
    },
    'jewel-gonzales': {
        name: 'Jewel Gonzales',
        email: 'jewelgonzales@email.com',
        role: 'Data Analyst',
        hours: '486h',
        attendance: '96%',
        status: 'Active',
        lastUpdate: '7 hours ago',
        ojtId: '1237',
        department: 'Data Science',
        supervisor: 'Mae Santos'
    },
    'alex-wilson': {
        name: 'Alex Wilson',
        email: 'alex.w@email.com',
        role: 'Mobile Dev',
        hours: '450h',
        attendance: '94%',
        status: 'Active',
        lastUpdate: '6 hours ago',
        ojtId: '1238',
        department: 'Information Technology',
        supervisor: 'Mae Santos'
    },
    'lisa-brown': {
        name: 'Lisa Brown',
        email: 'lisabrown@email.com',
        role: 'QA Tester',
        hours: '300h',
        attendance: '100%',
        status: 'Completed',
        lastUpdate: '1 week ago',
        ojtId: '1239',
        department: 'Quality Assurance',
        supervisor: 'Mae Santos'
    }
};

const ReportDetails = () => {
    const { internId } = useParams<{ internId: string }>();
    const navigate = useNavigate();
    const [selectedTab, setSelectedTab] = useState('weekly');

    const reportData = mockReportData[internId || ''];

    if (!reportData) {
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
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '5rem'
                }}>
                    <div>
                        <h1 style={{
                            margin: '0 0 0.5rem 0',
                            color: '#2b2a2a',
                            fontSize: '2rem'
                        }}>
                            <span style={{ color: '#ff8800' }}>{reportData.name}</span>'s Report
                        </h1>
                        <div style={{
                            display: 'flex',
                            gap: '2rem',
                            flexWrap: 'wrap'
                        }}>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '1rem', color: '#666', fontWeight: '500', marginBottom: '0.25rem' }}>OJT ID</div>
                                <div style={{ fontSize: '1.2rem', color: '#2b2a2a', fontWeight: '600' }}>
                                    {reportData.ojtId}
                                </div>
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '1rem', color: '#666', fontWeight: '500', marginBottom: '0.25rem' }}>Department</div>
                                <div style={{ fontSize: '1.2rem', color: '#2b2a2a', fontWeight: '600' }}>
                                    {reportData.department}
                                </div>
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '1rem', color: '#666', fontWeight: '500', marginBottom: '0.25rem' }}>Supervisor</div>
                                <div style={{ fontSize: '1.2rem', color: '#2b2a2a', fontWeight: '600' }}>
                                    {reportData.supervisor}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profile Section */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', marginTop: '0', marginRight: '5rem' }}>
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
                            {reportData.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div style={{ fontSize: '1.1rem', color: '#2b2a2a', fontWeight: '600', marginBottom: '0.25rem', textAlign: 'center' }}>
                            {reportData.name}
                        </div>
                        <div style={{ fontSize: '1rem', color: '#666', marginBottom: '0.5rem', textAlign: 'center' }}>
                            {reportData.role}
                        </div>
                        <span style={{
                            backgroundColor: reportData.status === 'Active' ? '#dcfce7' : '#dbeafe',
                            color: reportData.status === 'Active' ? '#166534' : '#1e40af',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            display: 'inline-block'
                        }}>
                            {reportData.status}
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
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <button
                        onClick={() => setSelectedTab('weekly')}
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
                            fontWeight: '500'
                        }}
                    >
                        <Calendar size={16} />
                        Weekly Summary
                    </button>
                    <button
                        onClick={() => setSelectedTab('monthly')}
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
                            fontWeight: '500'
                        }}
                    >
                        <FileText size={16} />
                        Monthly Summary
                    </button>
                    <button
                        onClick={() => setSelectedTab('full')}
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
                            fontWeight: '500'
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
                    {selectedTab === 'weekly' && (
                        <div>
                            <h3 style={{ margin: '0 0 1rem 0', color: '#2b2a2a', fontSize: '1.2rem' }}>
                                Week 5: February 2 - 6, 2026
                            </h3>
                            <div style={{
                                display: 'flex',
                                gap: '2rem',
                                marginBottom: '1rem'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.1rem' }}>Total Hours</div>
                                    <div style={{ fontSize: '1.1rem', color: '#2b2a2a', fontWeight: '600' }}>
                                        38 hours
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.1rem' }}>Total Tasks</div>
                                    <div style={{ fontSize: '1.1rem', color: '#2b2a2a', fontWeight: '600' }}>
                                        15 tasks
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
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.75rem',
                                        background: '#f9f7f4',
                                        borderRadius: '6px',
                                        border: '1px solid #e5e5e5'
                                    }}>
                                        <div style={{ fontSize: '0.9rem', color: '#2b2a2a', fontWeight: '500' }}>Monday</div>
                                        <div style={{ fontSize: '0.85rem', color: '#666', flex: 1, textAlign: 'center' }}>
                                            Code review and bug fixes for user dashboard
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>7h</div>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.75rem',
                                        background: '#f9f7f4',
                                        borderRadius: '6px',
                                        border: '1px solid #e5e5e5'
                                    }}>
                                        <div style={{ fontSize: '0.9rem', color: '#2b2a2a', fontWeight: '500' }}>Tuesday</div>
                                        <div style={{ fontSize: '0.85rem', color: '#666', flex: 1, textAlign: 'center' }}>
                                            Feature development for mobile app
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>8h</div>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.75rem',
                                        background: '#f9f7f4',
                                        borderRadius: '6px',
                                        border: '1px solid #e5e5e5'
                                    }}>
                                        <div style={{ fontSize: '0.9rem', color: '#2b2a2a', fontWeight: '500' }}>Wednesday</div>
                                        <div style={{ fontSize: '0.85rem', color: '#666', flex: 1, textAlign: 'center' }}>
                                            Database optimization and testing
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>7h</div>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.75rem',
                                        background: '#f9f7f4',
                                        borderRadius: '6px',
                                        border: '1px solid #e5e5e5'
                                    }}>
                                        <div style={{ fontSize: '0.9rem', color: '#2b2a2a', fontWeight: '500' }}>Thursday</div>
                                        <div style={{ fontSize: '0.85rem', color: '#666', flex: 1, textAlign: 'center' }}>
                                            UI/UX improvements and documentation
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>8h</div>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '0.75rem',
                                        background: '#f9f7f4',
                                        borderRadius: '6px',
                                        border: '1px solid #e5e5e5'
                                    }}>
                                        <div style={{ fontSize: '0.9rem', color: '#2b2a2a', fontWeight: '500' }}>Friday</div>
                                        <div style={{ fontSize: '0.85rem', color: '#666', flex: 1, textAlign: 'center' }}>
                                            Team meeting and project planning
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>8h</div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', color: '#2b2a2a', fontSize: '1rem', fontWeight: '600' }}>
                                    Key Achievements
                                </h4>
                                <ul style={{ margin: '0', paddingLeft: '1.5rem', color: '#666', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                    <li style={{ marginBottom: '0.5rem' }}>Successfully deployed authentication system</li>
                                    <li style={{ marginBottom: '0.5rem' }}>Improved database query performance by 40%</li>
                                    <li style={{ marginBottom: '0.5rem' }}>Completed unit tests for new features</li>
                                </ul>
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', color: '#2b2a2a', fontSize: '1rem', fontWeight: '600' }}>
                                    Challenges
                                </h4>
                                <p style={{ margin: '0', color: '#666', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                    Learning to optimize complex database queries
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {selectedTab === 'monthly' && (
                        <div>
                            <h3 style={{ margin: '0 0 1rem 0', color: '#2b2a2a', fontSize: '1.5rem' }}>
                                January 2026
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1rem',
                                marginBottom: '1rem'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    background: '#9DB8F133',
                                    borderRadius: '8px',
                                    padding: '1.5rem',
                                    border: '1px solid #9DB8F133'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <Clock size={24} color="#1C2DE9" style={{ marginRight: '0.5rem' }} />
                                        <span style={{ fontSize: '1.2rem', color: '#000000', fontWeight: '500' }}>Total Hours</span>
                                    </div>
                                    <div style={{ fontSize: '1.8rem', color: '#000000', fontWeight: 'bold' }}>160</div>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    background: '#C0E8BC33',
                                    borderRadius: '8px',
                                    padding: '1.5rem',
                                    border: '1px solid #C0E8BC33'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <CheckCircle size={24} color="#4ACE1E" style={{ marginRight: '0.5rem' }} />
                                        <span style={{ fontSize: '1.2rem', color: '#000000', fontWeight: '500' }}>Task Completed</span>
                                    </div>
                                    <div style={{ fontSize: '1.8rem', color: '#000000', fontWeight: 'bold' }}>48</div>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    background: '#D6A7EA33',
                                    borderRadius: '8px',
                                    padding: '1.5rem',
                                    border: '1px solid #D6A7EA33'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <UserCheck size={24} color="#BF27D0" style={{ marginRight: '0.5rem' }} />
                                        <span style={{ fontSize: '1.2rem', color: '#000000', fontWeight: '500' }}>Attendance</span>
                                    </div>
                                    <div style={{ fontSize: '1.8rem', color: '#000000', fontWeight: 'bold' }}>92%</div>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    background: '#FF880033',
                                    borderRadius: '8px',
                                    padding: '1.5rem',
                                    border: '1px solid #FF880033'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <BookOpen size={24} color="#ff8800" style={{ marginRight: '0.5rem' }} />
                                        <span style={{ fontSize: '1.2rem', color: '#000000', fontWeight: '500' }}>Projects</span>
                                    </div>
                                    <div style={{ fontSize: '1.8rem', color: '#000000', fontWeight: 'bold' }}>3</div>
                                </div>
                            </div>
                            <div style={{ marginTop: '2rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', color: '#2b2a2a', fontSize: '1.2rem', fontWeight: '600' }}>
                                    Monthly Overview
                                </h4>
                                <p style={{ margin: '0', color: '#666', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                    Completed major project milestones including authentication system implementation and database optimization. Strong progress in full-stack development skills.
                                </p>
                            </div>

                            <hr style={{
                                border: 'none',
                                borderTop: '2px solid #e5e5e5',
                                margin: '2rem 0'
                            }} />

                            <div style={{ marginTop: '2rem' }}>
                                <h4 style={{ margin: '0 0 1.5rem 0', color: '#2b2a2a', fontSize: '1.5rem', fontWeight: '600' }}>
                                    Skills Developed
                                </h4>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1.5rem'
                                }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '1rem', color: '#2b2a2a', fontWeight: '500' }}>React and Typescript</span>
                                            <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>85%</span>
                                        </div>
                                        <div style={{
                                            width: '100%',
                                            height: '8px',
                                            backgroundColor: '#e5e5e5',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: '85%',
                                                height: '100%',
                                                backgroundColor: '#ff8800',
                                                borderRadius: '4px'
                                            }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '1rem', color: '#2b2a2a', fontWeight: '500' }}>Node.js</span>
                                            <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>70%</span>
                                        </div>
                                        <div style={{
                                            width: '100%',
                                            height: '8px',
                                            backgroundColor: '#e5e5e5',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: '70%',
                                                height: '100%',
                                                backgroundColor: '#ff8800',
                                                borderRadius: '4px'
                                            }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '1rem', color: '#2b2a2a', fontWeight: '500' }}>Database Management</span>
                                            <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>85%</span>
                                        </div>
                                        <div style={{
                                            width: '100%',
                                            height: '8px',
                                            backgroundColor: '#e5e5e5',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: '85%',
                                                height: '100%',
                                                backgroundColor: '#ff8800',
                                                borderRadius: '4px'
                                            }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '1rem', color: '#2b2a2a', fontWeight: '500' }}>API Integration</span>
                                            <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>65%</span>
                                        </div>
                                        <div style={{
                                            width: '100%',
                                            height: '8px',
                                            backgroundColor: '#e5e5e5',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: '65%',
                                                height: '100%',
                                                backgroundColor: '#ff8800',
                                                borderRadius: '4px'
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr style={{
                                border: 'none',
                                borderTop: '2px solid #e5e5e5',
                                margin: '2rem 0'
                            }} />

                            <div style={{ marginTop: '2rem' }}>
                                <h4 style={{ margin: '0 0 1.5rem 0', color: '#2b2a2a', fontSize: '1.5rem', fontWeight: '600' }}>
                                    Projects
                                </h4>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem'
                                }}>
                                    <div style={{
                                        background: '#64AACA12',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        border: '1px solid #e5e5e5',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <h5 style={{ margin: '0 0 0.5rem 0', color: '#2b2a2a', fontSize: '1rem', fontWeight: '600' }}>
                                                User Authentication System
                                            </h5>
                                            <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                                Designed and implemented secure authentication with JWT tokens
                                            </p>
                                            <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
                                                Role: Lead Developer
                                            </div>
                                        </div>
                                        <span style={{
                                            backgroundColor: '#dcfce7',
                                            color: '#166534',
                                            fontSize: '0.8rem',
                                            fontWeight: '500',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '9999px',
                                            display: 'inline-block'
                                        }}>
                                            Completed
                                        </span>
                                    </div>
                                    <div style={{
                                        background: '#64AACA12',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        border: '1px solid #e5e5e5',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <h5 style={{ margin: '0 0 0.5rem 0', color: '#2b2a2a', fontSize: '1rem', fontWeight: '600' }}>
                                                Dashboard Analytics
                                            </h5>
                                            <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                                Building interactive data visualization components
                                            </p>
                                            <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
                                                Role: Frontend Developer
                                            </div>
                                        </div>
                                        <span style={{
                                            backgroundColor: '#dcfce7',
                                            color: '#166534',
                                            fontSize: '0.8rem',
                                            fontWeight: '500',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '9999px',
                                            display: 'inline-block'
                                        }}>
                                            Completed
                                        </span>
                                    </div>
                                    <div style={{
                                        background: '#64AACA12',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        border: '1px solid #e5e5e5',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <h5 style={{ margin: '0 0 0.5rem 0', color: '#2b2a2a', fontSize: '1rem', fontWeight: '600' }}>
                                                API Optimization
                                            </h5>
                                            <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                                Improved API response time by 40%
                                            </p>
                                            <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: '500' }}>
                                                Role: Backend Developer
                                            </div>
                                        </div>
                                        <span style={{
                                            backgroundColor: '#dcfce7',
                                            color: '#166534',
                                            fontSize: '0.8rem',
                                            fontWeight: '500',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '9999px',
                                            display: 'inline-block'
                                        }}>
                                            Completed
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <hr style={{
                                border: 'none',
                                borderTop: '2px solid #e5e5e5',
                                margin: '2rem 0'
                            }} />
                            <div style={{ marginTop: '2rem' }}>
                                <h4 style={{ margin: '0 0 1.5rem 0', color: '#2b2a2a', fontSize: '1.5rem', fontWeight: '600' }}>
                                    Supervisor Feedback
                                </h4>
                                <div style={{
                                    background: '#64AACA12',
                                    borderRadius: '8px',
                                    padding: '1.5rem',
                                    border: '1px solid #e5e5e5'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '1rem'
                                    }}>
                                        <div style={{ fontSize: '1rem', color: '#2b2a2a', fontWeight: '500' }}>
                                            Supervisor: Mae Santos
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <span style={{ color: '#ff8800', fontSize: '1.5rem' }}>★</span>
                                            <span style={{ color: '#ff8800', fontSize: '1.5rem' }}>★</span>
                                            <span style={{ color: '#ff8800', fontSize: '1.5rem' }}>★</span>
                                            <span style={{ color: '#ff8800', fontSize: '1.5rem' }}>★</span>
                                            <span style={{ color: '#ff8800', fontSize: '1.5rem' }}>☆</span>
                                        </div>
                                    </div>
                                    <p style={{
                                        margin: '0',
                                        color: '#2b2a2a',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.5',
                                        fontStyle: 'italic',
                                        textAlign: 'center'
                                    }}>
                                        "Excellent progress and strong technical skills. Shows great initiative in problem-solving and team collaboration. Keep up the outstanding work."
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedTab === 'full' && (
                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1rem'
                            }}>
                                <div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#2b2a2a', fontSize: '1.5rem', fontWeight: '600' }}>
                                        Internship Report
                                    </h3>
                                    <p style={{ margin: '0', color: '#666', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                        Complete report ready for printing or download
                                    </p>
                                </div>
                                <button style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#ff8800',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: '500'
                                }}>
                                    <Download size={16} />
                                    Download Report
                                </button>
                            </div>
                            <div style={{
                                backgroundColor: '#ffffff',
                                padding: '2rem',
                                borderRadius: '12px',
                                marginTop: '1rem'
                            }}>
                                <div style={{
                                    textAlign: 'center',
                                    marginBottom: '2rem'
                                }}>
                                    <h2 style={{ margin: '0 0 0.5rem 0', color: '#2b2a2a', fontSize: '2rem', fontWeight: '700' }}>
                                        INTERNSHIP REPORT
                                    </h2>
                                    <p style={{ margin: '0', color: '#666', fontSize: '1rem' }}>
                                        February 12, 2026
                                    </p>
                                </div>
                                <hr style={{
                                    border: 'none',
                                    borderTop: '1px solid #e0e0e0',
                                    margin: '0 0 2rem 0'
                                }} />
                                
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ margin: '0 0 1rem 0', color: '#2b2a2a', fontSize: '1.3rem', fontWeight: '600' }}>
                                        INTERN INFORMATION
                                    </h3>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '2rem',
                                        paddingLeft: '1rem'
                                    }}>
                                        <div>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                                                    Name
                                                </p>
                                                <p style={{ margin: '0', color: '#2b2a2a', fontSize: '1rem', fontWeight: '500' }}>
                                                    Kevin Lim
                                                </p>
                                            </div>
                                            <div>
                                                <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                                                    Program
                                                </p>
                                                <p style={{ margin: '0', color: '#2b2a2a', fontSize: '1rem', fontWeight: '500' }}>
                                                    BS Information Technology
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                                                    Student ID
                                                </p>
                                                <p style={{ margin: '0', color: '#2b2a2a', fontSize: '1rem', fontWeight: '500' }}>
                                                    2026-12345
                                                </p>
                                            </div>
                                            <div>
                                                <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                                                    University
                                                </p>
                                                <p style={{ margin: '0', color: '#2b2a2a', fontSize: '1rem', fontWeight: '500' }}>
                                                    University of the Philippines Manila
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <hr style={{
                                    border: 'none',
                                    borderTop: '1px solid #e0e0e0',
                                    margin: '2rem 0'
                                }} />

                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ margin: '0 0 1rem 0', color: '#2b2a2a', fontSize: '1.3rem', fontWeight: '600' }}>
                                        INTERNSHIP DETAILS
                                    </h3>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '2rem',
                                        paddingLeft: '1rem'
                                    }}>
                                        <div>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                                                    Company
                                                </p>
                                                <p style={{ margin: '0', color: '#2b2a2a', fontSize: '1rem', fontWeight: '500' }}>
                                                    CertiCode
                                                </p>
                                            </div>
                                            <div>
                                                <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                                                    Position
                                                </p>
                                                <p style={{ margin: '0', color: '#2b2a2a', fontSize: '1rem', fontWeight: '500' }}>
                                                    Fullstack Developer
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                                                    Department
                                                </p>
                                                <p style={{ margin: '0', color: '#2b2a2a', fontSize: '1rem', fontWeight: '500' }}>
                                                    Software Department
                                                </p>
                                            </div>
                                            <div>
                                                <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                                                    Internship Duration
                                                </p>
                                                <p style={{ margin: '0', color: '#2b2a2a', fontSize: '1rem', fontWeight: '500' }}>
                                                    Nov 28, 2025 to Feb 28, 2026
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <hr style={{
                                    border: 'none',
                                    borderTop: '1px solid #e0e0e0',
                                    margin: '2rem 0'
                                }} />

                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ margin: '0 0 1rem 0', color: '#2b2a2a', fontSize: '1.3rem', fontWeight: '600' }}>
                                        SUPERVISOR EVALUATION
                                    </h3>
                                    <div style={{ paddingLeft: '1rem' }}>
                                        <p style={{ margin: '0 0 1rem 0', color: '#2b2a2a', fontSize: '1rem', lineHeight: '1.6' }}>
                                            John has demonstrated exceptional performance during his internship. He quickly adapted to our development environment and began contributing to projects within the first week. His technical skills in React, TypeScript, and Node.js are impressive for someone at his experience level.
                                        </p>
                                        <p style={{ margin: '0 0 1rem 0', color: '#2b2a2a', fontSize: '1rem', lineHeight: '1.6' }}>
                                            He shows great initiative in problem-solving and is always willing to help team members. His attention to detail and commitment to code quality have been consistently outstanding.
                                        </p>
                                    </div>
                                </div>

                                <hr style={{
                                    border: 'none',
                                    borderTop: '1px solid #e0e0e0',
                                    margin: '2rem 0'
                                }} />

                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ margin: '0 0 1rem 0', color: '#2b2a2a', fontSize: '1.3rem', fontWeight: '600' }}>
                                        SUMMARY
                                    </h3>
                                    <div style={{ paddingLeft: '1rem' }}>
                                        <p style={{ margin: '0 0 1rem 0', color: '#2b2a2a', fontSize: '1rem', lineHeight: '1.6' }}>
                                            The internship has been highly successful, with John exceeding expectations in all areas. He has successfully completed 5 major projects and contributed to 3 ongoing initiatives. His growth from a junior developer to a competent full-stack developer has been remarkable.
                                        </p>
                                        <p style={{ margin: '0', color: '#2b2a2a', fontSize: '1rem', lineHeight: '1.6' }}>
                                            We recommend John for future employment opportunities and believe he has a bright future in software development.
                                        </p>
                                    </div>
                                </div>

                                <hr style={{
                                    border: 'none',
                                    borderTop: '1px solid #e0e0e0',
                                    margin: '2rem 0'
                                }} />

                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ margin: '0 0 1rem 0', color: '#2b2a2a', fontSize: '1.3rem', fontWeight: '600' }}>
                                        SKILLS DEVELOPED
                                    </h3>
                                    <div style={{ paddingLeft: '1rem' }}>
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '0.75rem'
                                        }}>
                                            <div style={{
                                                backgroundColor: '#e3f2fd',
                                                color: '#1976d2',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '20px',
                                                fontSize: '0.9rem',
                                                fontWeight: '500',
                                                border: '1px solid #bbdefb'
                                            }}>
                                                HTML
                                            </div>
                                            <div style={{
                                                backgroundColor: '#f3e5f5',
                                                color: '#7b1fa2',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '20px',
                                                fontSize: '0.9rem',
                                                fontWeight: '500',
                                                border: '1px solid #e1bee7'
                                            }}>
                                                CSS
                                            </div>
                                            <div style={{
                                                backgroundColor: '#fff3e0',
                                                color: '#f57c00',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '20px',
                                                fontSize: '0.9rem',
                                                fontWeight: '500',
                                                border: '1px solid #ffe0b2'
                                            }}>
                                                JavaScript
                                            </div>
                                            <div style={{
                                                backgroundColor: '#e8f5e8',
                                                color: '#388e3c',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '20px',
                                                fontSize: '0.9rem',
                                                fontWeight: '500',
                                                border: '1px solid #c8e6c9'
                                            }}>
                                                React
                                            </div>
                                            <div style={{
                                                backgroundColor: '#fce4ec',
                                                color: '#c2185b',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '20px',
                                                fontSize: '0.9rem',
                                                fontWeight: '500',
                                                border: '1px solid #f8bbd9'
                                            }}>
                                                Nodejs
                                            </div>
                                            <div style={{
                                                backgroundColor: '#e0f2f1',
                                                color: '#00796b',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '20px',
                                                fontSize: '0.9rem',
                                                fontWeight: '500',
                                                border: '1px solid #b2dfdb'
                                            }}>
                                                Teamwork
                                            </div>
                                            <div style={{
                                                backgroundColor: '#f1f8e9',
                                                color: '#689f38',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '20px',
                                                fontSize: '0.9rem',
                                                fontWeight: '500',
                                                border: '1px solid #dcedc8'
                                            }}>
                                                Communication
                                            </div>
                                            <div style={{
                                                backgroundColor: '#fff8e1',
                                                color: '#f9a825',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '20px',
                                                fontSize: '0.9rem',
                                                fontWeight: '500',
                                                border: '1px solid #ffecb3'
                                            }}>
                                                Problem Solving
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <hr style={{
                                    border: 'none',
                                    borderTop: '1px solid #e0e0e0',
                                    margin: '3rem 0 2rem 0'
                                }} />

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '2rem',
                                    marginTop: '3rem'
                                }}>
                                    <div>
                                        <div style={{
                                            borderBottom: '1px solid #ccc',
                                            height: '40px',
                                            marginBottom: '0.5rem'
                                        }}></div>
                                        <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                                            Intern Signature
                                        </p>
                                        <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                                            Date: _______________
                                        </p>
                                    </div>
                                    <div>
                                        <div style={{
                                            borderBottom: '1px solid #ccc',
                                            height: '40px',
                                            marginBottom: '0.5rem'
                                        }}></div>
                                        <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                                            CEO/Founder
                                        </p>
                                        <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                                            Date: _______________
                                        </p>
                                    </div>
                                    <div>
                                        <div style={{
                                            borderBottom: '1px solid #ccc',
                                            height: '40px',
                                            marginBottom: '0.5rem'
                                        }}></div>
                                        <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                                            Supervisor
                                        </p>
                                        <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                                            Date: _______________
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportDetails;
