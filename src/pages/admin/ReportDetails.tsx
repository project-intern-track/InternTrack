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

    if (loading) {
        return (
            <div className="admin-page-shell w-full">
                <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-2xl p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    Loading report details...
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="admin-page-shell w-full">
                <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-2xl p-8 text-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Report not found</h2>
                <button
                    onClick={() => navigate('/admin/reports')}
                    className="btn btn-primary mt-4"
                >
                    Back to Reports
                </button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page-shell report-details-shell w-full space-y-6">
            <div className="report-details-card bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-2xl p-5 md:p-6 mb-6">
                <div className="mb-4">
                    <button
                        onClick={() => navigate('/admin/reports')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-slate-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                    >
                        <ArrowLeft size={16} />
                        Back to Reports
                    </button>
                </div>

                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 flex-1 space-y-4">
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white m-0">
                            <span className="text-primary">{profile.name}</span>&apos;s Report
                        </h1>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {profile.ojtId && (
                                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                                    <div className="text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1">OJT ID</div>
                                    <div className="break-words text-base font-semibold text-gray-900 dark:text-white">
                                        {profile.ojtId}
                                    </div>
                                </div>
                            )}
                            {profile.department && (
                                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                                    <div className="text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1">Department</div>
                                    <div className="break-words text-base font-semibold text-gray-900 dark:text-white">
                                        {profile.department}
                                    </div>
                                </div>
                            )}
                            {profile.supervisor && (
                                <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                                    <div className="text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1">Supervisor</div>
                                    <div className="break-words text-base font-semibold text-gray-900 dark:text-white">
                                        {profile.supervisor}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mx-auto flex w-full flex-col items-center rounded-2xl border border-gray-200 bg-gray-50/80 p-5 text-center dark:border-white/10 dark:bg-white/5 xl:mx-0 xl:w-[220px] xl:flex-shrink-0">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center text-2xl font-bold shadow-md mb-3">
                            {profile.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div className="text-base font-semibold text-gray-900 dark:text-white text-center mb-1">
                            {profile.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center mb-2">
                            {profile.role}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${profile.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                            {profile.status}
                        </span>
                    </div>
                </div>
            </div>

            <div className="report-details-card bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-2xl p-5 md:p-6">
                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <button
                        onClick={() => setSelectedTab('weekly')}
                        className={`inline-flex w-full items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${selectedTab === 'weekly' ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                    >
                        <Calendar size={16} />
                        Weekly Summary
                    </button>
                    <button
                        onClick={() => setSelectedTab('monthly')}
                        className={`inline-flex w-full items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${selectedTab === 'monthly' ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                    >
                        <FileText size={16} />
                        Monthly Summary
                    </button>
                    <button
                        onClick={() => setSelectedTab('full')}
                        className={`inline-flex w-full items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${selectedTab === 'full' ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                    >
                        <BarChart size={16} />
                        Full Report
                    </button>
                </div>

                <div className="bg-gray-50 dark:bg-slate-900/40 border border-gray-200 dark:border-white/5 rounded-xl p-4 md:p-5">
                    {selectedTab === 'weekly' && weekly && (
                        <div className="space-y-6">
                            <h3 className="m-0 text-lg font-bold text-gray-900 dark:text-white">
                                {weekly.week_label}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="rounded-lg border border-blue-100 bg-blue-50/80 dark:bg-blue-500/10 dark:border-blue-500/30 p-4">
                                    <div className="text-xs uppercase font-bold tracking-wide text-blue-700 dark:text-blue-300">Total Hours</div>
                                    <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                        {weekly.total_hours} hours
                                    </div>
                                </div>
                                <div className="rounded-lg border border-emerald-100 bg-emerald-50/80 dark:bg-emerald-500/10 dark:border-emerald-500/30 p-4">
                                    <div className="text-xs uppercase font-bold tracking-wide text-emerald-700 dark:text-emerald-300">Total Tasks</div>
                                    <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                        {weekly.total_tasks} tasks
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="m-0 mb-3 text-base font-semibold text-gray-900 dark:text-white">
                                    Daily Activities
                                </h4>
                                <div className="space-y-2.5">
                                    {weekly.daily_activities.length === 0 ? (
                                        <div className="text-sm italic text-gray-500 dark:text-gray-400 p-4 rounded-lg bg-gray-100 dark:bg-slate-800">No activities logged this week.</div>
                                    ) : (
                                        weekly.daily_activities.map((activity: any, idx: number) => (
                                            <div key={idx} className="grid grid-cols-1 gap-2 p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800/70 lg:grid-cols-[130px_minmax(0,1fr)_110px] lg:gap-4 lg:items-center">
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{activity.day}</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                                    {activity.description}
                                                </div>
                                                <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 lg:text-right">{activity.hours}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="m-0 mb-3 text-base font-semibold text-gray-900 dark:text-white">
                                    Key Achievements
                                </h4>
                                {weekly.achievements && weekly.achievements.length > 0 ? (
                                    <ul className="pl-5 text-sm text-gray-600 dark:text-gray-300 leading-6 space-y-1">
                                        {weekly.achievements.map((ach: string, idx: number) => (
                                            <li key={idx}>{ach}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="m-0 text-sm italic text-gray-500 dark:text-gray-400">No completed tasks this week.</p>
                                )}
                            </div>

                            <div>
                                <h4 className="m-0 mb-3 text-base font-semibold text-gray-900 dark:text-white">
                                    Challenges
                                </h4>
                                <p className="m-0 text-sm text-gray-600 dark:text-gray-300 leading-6">
                                    {weekly.challenges || 'No challenges reported.'}
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {selectedTab === 'monthly' && monthly && (
                        <div className="space-y-8">
                            <h3 className="m-0 text-xl font-bold text-gray-900 dark:text-white">
                                {monthly.month_year}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                <div className="rounded-xl p-4 border border-blue-200/60 bg-blue-50/70 dark:bg-blue-500/10 dark:border-blue-500/30">
                                    <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-300 font-semibold text-sm"><Clock size={18} /> Total Hours</div>
                                    <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{monthly.total_hours}</div>
                                </div>
                                <div className="rounded-xl p-4 border border-emerald-200/60 bg-emerald-50/70 dark:bg-emerald-500/10 dark:border-emerald-500/30">
                                    <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-300 font-semibold text-sm"><CheckCircle size={18} /> Task Completed</div>
                                    <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{monthly.tasks_completed}</div>
                                </div>
                                <div className="rounded-xl p-4 border border-violet-200/60 bg-violet-50/70 dark:bg-violet-500/10 dark:border-violet-500/30">
                                    <div className="flex items-center gap-2 mb-2 text-violet-700 dark:text-violet-300 font-semibold text-sm"><UserCheck size={18} /> Attendance</div>
                                    <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{monthly.attendance_percentage}%</div>
                                </div>
                                <div className="rounded-xl p-4 border border-orange-200/60 bg-orange-50/70 dark:bg-orange-500/10 dark:border-orange-500/30">
                                    <div className="flex items-center gap-2 mb-2 text-orange-700 dark:text-orange-300 font-semibold text-sm"><FileText size={18} /> Projects</div>
                                    <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{monthly.projects_count}</div>
                                </div>
                            </div>

                            <div>
                                <h4 className="m-0 mb-3 text-lg font-semibold text-gray-900 dark:text-white">Monthly Overview</h4>
                                <p className="m-0 text-sm text-gray-600 dark:text-gray-300 leading-6">{monthly.overview}</p>
                            </div>

                            <hr className="border-0 border-t border-gray-200 dark:border-white/10" />

                            <div>
                                <h4 className="m-0 mb-5 text-lg font-semibold text-gray-900 dark:text-white">Skills Developed</h4>
                                <div className="space-y-4">
                                    {monthly.skills && monthly.skills.length > 0 ? monthly.skills.map((skill: any, idx: number) => (
                                        <div key={idx}>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{skill.skill_name}</span>
                                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{skill.proficiency}</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded overflow-hidden">
                                                <div style={{ width: skill.proficiency, height: '100%', background: 'linear-gradient(90deg,#ff8800,#e67a00)', borderRadius: '4px' }} />
                                            </div>
                                        </div>
                                    )) : <p className="text-sm italic text-gray-500 dark:text-gray-400">No skills reported this month.</p>}
                                </div>
                            </div>

                            <hr className="border-0 border-t border-gray-200 dark:border-white/10" />

                            <div>
                                <h4 className="m-0 mb-5 text-lg font-semibold text-gray-900 dark:text-white">Projects</h4>
                                <div className="space-y-3">
                                    {monthly.projects && monthly.projects.length > 0 ? monthly.projects.map((proj: any, idx: number) => (
                                        <div key={idx} className="bg-cyan-50/40 dark:bg-cyan-500/10 rounded-lg p-4 border border-gray-200 dark:border-white/10 flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-center">
                                            <div className="min-w-0">
                                                <h5 className="m-0 mb-1.5 text-base font-semibold text-gray-900 dark:text-white">{proj.title}</h5>
                                                <p className="m-0 mb-2 text-sm text-gray-600 dark:text-gray-300 leading-6">{proj.description}</p>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Role: {proj.role}</div>
                                            </div>
                                            <span className="inline-flex self-start bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full lg:self-auto">{proj.status}</span>
                                        </div>
                                    )) : <p className="text-sm italic text-gray-500 dark:text-gray-400">No completed projects to display.</p>}
                                </div>
                            </div>

                            <hr className="border-0 border-t border-gray-200 dark:border-white/10" />

                            <div>
                                <h4 className="m-0 mb-5 text-lg font-semibold text-gray-900 dark:text-white">Supervisor Feedback</h4>
                                {monthly.supervisor_feedback ? (
                                    <div className="bg-cyan-50/40 dark:bg-cyan-500/10 rounded-lg p-5 border border-gray-200 dark:border-white/10">
                                        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">Supervisor: {monthly.supervisor_feedback.supervisor_name}</div>
                                            <div className="flex gap-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <span key={i} className="text-orange-500 text-xl">
                                                        {i < monthly.supervisor_feedback.rating ? '★' : '☆'}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="m-0 text-sm text-gray-700 dark:text-gray-200 leading-6 italic lg:text-center">
                                            "{monthly.supervisor_feedback.comment}"
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm italic text-gray-500 dark:text-gray-400">No supervisor feedback available yet.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {selectedTab === 'full' && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="m-0 text-xl font-bold text-gray-900 dark:text-white">
                                    Full Report Overview
                                </h3>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-6">
                                    A combined summary of {profile.name}&apos;s weekly progress, monthly performance, completed work, and supervisor feedback.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-xl p-4 border border-blue-200/60 bg-blue-50/70 dark:bg-blue-500/10 dark:border-blue-500/30">
                                    <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-300 font-semibold text-sm"><Clock size={18} /> Monthly Hours</div>
                                    <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{monthly?.total_hours ?? 0}</div>
                                </div>
                                <div className="rounded-xl p-4 border border-emerald-200/60 bg-emerald-50/70 dark:bg-emerald-500/10 dark:border-emerald-500/30">
                                    <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-300 font-semibold text-sm"><CheckCircle size={18} /> Tasks Completed</div>
                                    <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{monthly?.tasks_completed ?? weekly?.total_tasks ?? 0}</div>
                                </div>
                                <div className="rounded-xl p-4 border border-violet-200/60 bg-violet-50/70 dark:bg-violet-500/10 dark:border-violet-500/30">
                                    <div className="flex items-center gap-2 mb-2 text-violet-700 dark:text-violet-300 font-semibold text-sm"><UserCheck size={18} /> Attendance</div>
                                    <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{monthly?.attendance_percentage ?? 0}%</div>
                                </div>
                                <div className="rounded-xl p-4 border border-orange-200/60 bg-orange-50/70 dark:bg-orange-500/10 dark:border-orange-500/30">
                                    <div className="flex items-center gap-2 mb-2 text-orange-700 dark:text-orange-300 font-semibold text-sm"><FileText size={18} /> Projects</div>
                                    <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{monthly?.projects_count ?? 0}</div>
                                </div>
                            </div>

                            {weekly && (
                                <>
                                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-slate-800/40">
                                        <h4 className="m-0 mb-3 text-lg font-semibold text-gray-900 dark:text-white">Weekly Summary</h4>
                                        <p className="m-0 text-sm font-semibold text-gray-700 dark:text-gray-200">{weekly.week_label}</p>
                                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="rounded-lg border border-blue-100 bg-blue-50/80 p-4 dark:border-blue-500/30 dark:bg-blue-500/10">
                                                <div className="text-xs uppercase font-bold tracking-wide text-blue-700 dark:text-blue-300">Week Hours</div>
                                                <div className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{weekly.total_hours} hours</div>
                                            </div>
                                            <div className="rounded-lg border border-emerald-100 bg-emerald-50/80 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                                                <div className="text-xs uppercase font-bold tracking-wide text-emerald-700 dark:text-emerald-300">Week Tasks</div>
                                                <div className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{weekly.total_tasks} tasks</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="m-0 mb-3 text-lg font-semibold text-gray-900 dark:text-white">Daily Activities</h4>
                                        <div className="space-y-2.5">
                                            {weekly.daily_activities.length === 0 ? (
                                                <div className="text-sm italic text-gray-500 dark:text-gray-400 p-4 rounded-lg bg-gray-100 dark:bg-slate-800">No activities logged this week.</div>
                                            ) : (
                                                weekly.daily_activities.map((activity: any, idx: number) => (
                                                    <div key={idx} className="grid grid-cols-1 gap-2 p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800/70 lg:grid-cols-[130px_minmax(0,1fr)_110px] lg:gap-4 lg:items-center">
                                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{activity.day}</div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-300">{activity.description}</div>
                                                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 lg:text-right">{activity.hours}</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-slate-800/40">
                                            <h4 className="m-0 mb-3 text-base font-semibold text-gray-900 dark:text-white">Key Achievements</h4>
                                            {weekly.achievements && weekly.achievements.length > 0 ? (
                                                <ul className="pl-5 text-sm text-gray-600 dark:text-gray-300 leading-6 space-y-1">
                                                    {weekly.achievements.map((ach: string, idx: number) => (
                                                        <li key={idx}>{ach}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="m-0 text-sm italic text-gray-500 dark:text-gray-400">No completed tasks this week.</p>
                                            )}
                                        </div>
                                        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-slate-800/40">
                                            <h4 className="m-0 mb-3 text-base font-semibold text-gray-900 dark:text-white">Challenges</h4>
                                            <p className="m-0 text-sm text-gray-600 dark:text-gray-300 leading-6">
                                                {weekly.challenges || 'No challenges reported.'}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {monthly && (
                                <>
                                    <div>
                                        <h4 className="m-0 mb-3 text-lg font-semibold text-gray-900 dark:text-white">Monthly Overview</h4>
                                        <p className="m-0 text-sm text-gray-600 dark:text-gray-300 leading-6">{monthly.overview}</p>
                                    </div>

                                    <div>
                                        <h4 className="m-0 mb-5 text-lg font-semibold text-gray-900 dark:text-white">Skills Developed</h4>
                                        <div className="space-y-4">
                                            {monthly.skills && monthly.skills.length > 0 ? monthly.skills.map((skill: any, idx: number) => (
                                                <div key={idx}>
                                                    <div className="flex justify-between mb-2 gap-3">
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{skill.skill_name}</span>
                                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{skill.proficiency}</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded overflow-hidden">
                                                        <div style={{ width: skill.proficiency, height: '100%', background: 'linear-gradient(90deg,#ff8800,#e67a00)', borderRadius: '4px' }} />
                                                    </div>
                                                </div>
                                            )) : <p className="text-sm italic text-gray-500 dark:text-gray-400">No skills reported this month.</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="m-0 mb-5 text-lg font-semibold text-gray-900 dark:text-white">Projects</h4>
                                        <div className="space-y-3">
                                            {monthly.projects && monthly.projects.length > 0 ? monthly.projects.map((proj: any, idx: number) => (
                                                <div key={idx} className="bg-cyan-50/40 dark:bg-cyan-500/10 rounded-lg p-4 border border-gray-200 dark:border-white/10 flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-center">
                                                    <div className="min-w-0">
                                                        <h5 className="m-0 mb-1.5 text-base font-semibold text-gray-900 dark:text-white">{proj.title}</h5>
                                                        <p className="m-0 mb-2 text-sm text-gray-600 dark:text-gray-300 leading-6">{proj.description}</p>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Role: {proj.role}</div>
                                                    </div>
                                                    <span className="inline-flex self-start bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full lg:self-auto">{proj.status}</span>
                                                </div>
                                            )) : <p className="text-sm italic text-gray-500 dark:text-gray-400">No completed projects to display.</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="m-0 mb-5 text-lg font-semibold text-gray-900 dark:text-white">Supervisor Feedback</h4>
                                        {monthly.supervisor_feedback ? (
                                            <div className="bg-cyan-50/40 dark:bg-cyan-500/10 rounded-lg p-5 border border-gray-200 dark:border-white/10">
                                                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">Supervisor: {monthly.supervisor_feedback.supervisor_name}</div>
                                                    <div className="flex gap-1">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <span key={i} className="text-orange-500 text-xl">
                                                                {i < monthly.supervisor_feedback.rating ? '★' : '☆'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="m-0 text-sm text-gray-700 dark:text-gray-200 leading-6 italic lg:text-center">
                                                    "{monthly.supervisor_feedback.comment}"
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-sm italic text-gray-500 dark:text-gray-400">No supervisor feedback available yet.</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportDetails;
