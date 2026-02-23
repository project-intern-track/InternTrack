import { useState, useMemo } from 'react';
import { FileText, Plus, Clock, Calendar } from 'lucide-react';

/** backend ready */
export interface TimeLogEntry {
    id: string;
    date: string;
    time_in: string;
    time_out: string;
    duration_hours: number;
    activity?: string;
    status?: 'pending' | 'approved' | 'rejected';
}

const formatDateLong = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const formatTimeDisplay = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
};

const formatTimeRange = (timeIn: string, timeOut: string) =>
    `${formatTimeDisplay(timeIn)} - ${formatTimeDisplay(timeOut)}`;

const getWeekBounds = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { monday, sunday };
};

const DailyLogs = () => {
    const [date, setDate] = useState('');
    const [timeIn, setTimeIn] = useState('');
    const [timeOut, setTimeOut] = useState('');

    // Mock data
    const [logs, setLogs] = useState<TimeLogEntry[]>(() => {
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const d2 = new Date(today);
        d2.setDate(today.getDate() - 2);
        const d3 = new Date(today);
        d3.setDate(today.getDate() - 4);
        return [
            { id: '1', date: todayStr, time_in: '08:00', time_out: '17:00', duration_hours: 8 },
            { id: '2', date: d2.toISOString().slice(0, 10), time_in: '08:05', time_out: '16:10', duration_hours: 7 },
            { id: '3', date: d3.toISOString().slice(0, 10), time_in: '08:03', time_out: '17:02', duration_hours: 8 },
        ];
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    const { monday, sunday } = getWeekBounds();

    const stats = useMemo(() => {
        const todayHours = logs
            .filter((l) => l.date === todayStr)
            .reduce((s, l) => s + l.duration_hours, 0);
        const weekHours = logs
            .filter((l) => {
                const d = new Date(l.date + 'T12:00:00');
                return d >= monday && d <= sunday;
            })
            .reduce((s, l) => s + l.duration_hours, 0);
        return {
            todayHours: Math.round(todayHours * 10) / 10,
            weekHours: Math.round(weekHours * 10) / 10,
            totalEntries: logs.length,
        };
    }, [logs, todayStr, monday, sunday]);

    const computedDuration = useMemo(
        () => (timeIn && timeOut ? computeDuration(timeIn, timeOut) : 0),
        [timeIn, timeOut]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        //edit for backend
        const duration = computeDuration(timeIn, timeOut);
        const newLog: TimeLogEntry = {
            id: `temp-${Date.now()}`,
            date,
            time_in: timeIn,
            time_out: timeOut,
            duration_hours: duration,
        };
        setLogs((prev) => [newLog, ...prev]);
        setDate('');
        setTimeIn('');
        setTimeOut('');
    };

    function computeDuration(inTime: string, outTime: string): number {
        if (!inTime || !outTime) return 0;
        const [inH, inM] = inTime.split(':').map(Number);
        const [outH, outM] = outTime.split(':').map(Number);
        return Math.round((outH * 60 + outM - inH * 60 - inM) / 60 * 10) / 10;
    }

    return (
        <>
            <style>{`
                .timelog-header h1 { color: hsl(var(--orange)); margin: 0 0 1.5rem 0; font-size: 1.75rem; font-weight: 700; }
                .timelog-stat-icon { width: 40px; height: 40px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; margin-bottom: 0.75rem; }
                .timelog-stat-icon.blue { background: hsl(217 91% 60% / 0.15); color: hsl(217 91% 50%); }
                .timelog-stat-icon.orange { background: hsl(var(--orange) / 0.15); color: hsl(var(--orange)); }
                .timelog-stat-icon.green { background: hsl(var(--success) / 0.15); color: hsl(var(--success)); }
                .timelog-main-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; }
                .timelog-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
                .timelog-total-hours-box { background: hsl(var(--orange)); color: hsl(var(--orange-foreground)); border-radius: var(--radius-md); padding: 1rem 1.25rem; margin-bottom: 1rem; text-align: center; }
                .timelog-total-hours-label { font-size: 0.875rem; font-weight: 500; opacity: 0.9; }
                .timelog-total-hours-value { font-size: 1.5rem; font-weight: 700; }
                .timelog-entry-item { background: #ffffff; border: 1px solid hsl(var(--border)); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 0.75rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                .timelog-entry-item:last-child { margin-bottom: 0; }
                .timelog-entry-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; margin-bottom: 0.375rem; }
                .timelog-entry-row:last-child { margin-bottom: 0; }
                .timelog-entry-date { color: hsl(var(--foreground)); font-weight: 500; }
                .timelog-entry-time { color: hsl(var(--muted-foreground)); }
                .timelog-entry-badge { display: inline-flex; align-items: center; padding: 0.25rem 0.625rem; background: hsl(var(--orange) / 0.15); color: hsl(var(--orange)); border-radius: var(--radius-sm); font-size: 0.8125rem; font-weight: 600; margin-top: 0.5rem; }
                @media (max-width: 768px) {
                    .timelog-main-grid { grid-template-columns: 1fr; }
                    .timelog-header h1 { font-size: 1.5rem; }
                }
                @media (max-width: 480px) {
                    .timelog-form-row { grid-template-columns: 1fr; }
                }
            `}</style>
            <div>
                <div className="timelog-header">
                    <h1>Time Log</h1>
                </div>

                <div className="stats-grid">
                    <div className="stat-card" style={{ background: '#efeae4' }}>
                        <div className="timelog-stat-icon blue">
                            <Clock size={22} />
                        </div>
                        <div className="stat-card-title">Today&apos;s Hours</div>
                        <div className="stat-card-value">{stats.todayHours} hrs</div>
                    </div>
                    <div className="stat-card" style={{ background: '#efeae4' }}>
                        <div className="timelog-stat-icon orange">
                            <Calendar size={22} />
                        </div>
                        <div className="stat-card-title">This Week</div>
                        <div className="stat-card-value">{stats.weekHours} hrs</div>
                    </div>
                    <div className="stat-card" style={{ background: '#efeae4' }}>
                        <div className="timelog-stat-icon green">
                            <FileText size={22} />
                        </div>
                        <div className="stat-card-title">Total Entries</div>
                        <div className="stat-card-value">{stats.totalEntries} logs</div>
                    </div>
                </div>

                <div className="timelog-main-grid">
                    <div className="card" style={{ background: '#efeae4' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Log Time Entry</h3>
                        <form onSubmit={handleSubmit} className="stack">
                            <div className="stack stack-sm">
                                <label className="label" htmlFor="timelog-date">Date</label>
                                <input
                                    id="timelog-date"
                                    name="date"
                                    type="date"
                                    className="input"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="timelog-form-row">
                                <div className="stack stack-sm">
                                    <label className="label" htmlFor="timelog-time-in">Time In</label>
                                    <input
                                        id="timelog-time-in"
                                        name="time_in"
                                        type="time"
                                        className="input"
                                        value={timeIn}
                                        onChange={(e) => setTimeIn(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="stack stack-sm">
                                    <label className="label" htmlFor="timelog-time-out">Time Out</label>
                                    <input
                                        id="timelog-time-out"
                                        name="time_out"
                                        type="time"
                                        className="input"
                                        value={timeOut}
                                        onChange={(e) => setTimeOut(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="timelog-total-hours-box">
                                <div className="timelog-total-hours-label">Total Hours</div>
                                <div className="timelog-total-hours-value">{computedDuration} hrs</div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg">
                                <Plus size={18} />
                                Add Time Entry
                            </button>
                        </form>
                    </div>

                    <div className="card" style={{ background: '#efeae4' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Recent Entries</h3>
                        {logs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'hsl(var(--muted-foreground))', fontSize: '0.9375rem' }}>
                                No entries yet. Add your first time entry.
                            </div>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} className="timelog-entry-item">
                                    <div className="timelog-entry-row">
                                        <Calendar size={16} style={{ flexShrink: 0, color: 'hsl(var(--muted-foreground))' }} />
                                        <span className="timelog-entry-date">{formatDateLong(log.date)}</span>
                                    </div>
                                    <div className="timelog-entry-row">
                                        <Clock size={16} style={{ flexShrink: 0, color: 'hsl(var(--muted-foreground))' }} />
                                        <span className="timelog-entry-time">{formatTimeRange(log.time_in, log.time_out)}</span>
                                    </div>
                                    <span className="timelog-entry-badge">{log.duration_hours} hrs</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default DailyLogs;
