import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

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

        </div>
    );
};

export default ReportDetails;
