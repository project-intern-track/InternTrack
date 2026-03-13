import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Clock, Calendar, FileText, LogIn, LogOut, AlertCircle, RefreshCw, Trash, Lock, X } from 'lucide-react';
import { attendanceService } from '../../services/attendanceServices';
import type { Attendance } from '../../types/database.types';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_HOURS = 8;
const MANILA_TZ = 'Asia/Manila';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns YYYY-MM-DD in Philippine Standard Time (UTC+8). */
function getTodayStr(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: MANILA_TZ }); // en-CA → YYYY-MM-DD
}

function formatTimeFull(hhmm: string | null | undefined): string {
    if (!hhmm) return '—';
    const [h, m] = hhmm.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

function formatDateLong(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function pad2(n: number) { return String(n).padStart(2, '0'); }

function formatElapsed(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

type SessionState = 'idle' | 'clocked_in' | 'clocked_out' | 'expired';

const DailyLogs = () => {
    // OJT ID gate — backend validates; we only require non-empty here
    const [ojtIdInput, setOjtIdInput] = useState('');

    // Session state
    const [logs, setLogs] = useState<Attendance[]>([]);
    const [todayRecord, setTodayRecord] = useState<Attendance | null>(null);
    const [sessionState, setSessionState] = useState<SessionState>('idle');
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [cappedBanner, setCappedBanner] = useState(false);
    
    // Modal state
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 4;

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const dayCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Fetch all logs + today's record ───────────────────────────────────
    const refresh = useCallback(async () => {
        setError(null);
        try {
            const [all, today] = await Promise.all([
                attendanceService.getAttendance(),
                attendanceService.getToday(),
            ]);
            setLogs(all);
            setTodayRecord(today);

            if (!today) {
                setSessionState('idle');
            } else if (today.time_in && !today.time_out) {
                if (today.date !== getTodayStr()) {
                    setSessionState('expired');
                    setElapsed(MAX_HOURS * 3600);
                } else {
                    setSessionState('clocked_in');
                    const nowManila = new Date();
                    const todayManila = getTodayStr();
                    const clockInDate = new Date(`${todayManila}T${today.time_in}:00+08:00`);
                    const diffSec = Math.floor((nowManila.getTime() - clockInDate.getTime()) / 1000);
                    setElapsed(Math.min(diffSec, MAX_HOURS * 3600));
                }
            } else {
                setSessionState('clocked_out');
            }
        } catch (err: any) {
            setError(err.message ?? 'Failed to load attendance data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    // ── Live stopwatch ─────────────────────────────────────────────────────
    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (sessionState === 'clocked_in') {
            timerRef.current = setInterval(() => {
                setElapsed(prev => {
                    const next = prev + 1;
                    if (next >= MAX_HOURS * 3600) {
                        clearInterval(timerRef.current!);
                        handleAutoClockOut();
                        return MAX_HOURS * 3600;
                    }
                    return next;
                });
            }, 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionState]);

    // ── Midnight watcher ───────────────────────────────────────────────────
    useEffect(() => {
        if (dayCheckRef.current) clearInterval(dayCheckRef.current);
        if (sessionState === 'clocked_in') {
            const recordDate = todayRecord?.date;
            dayCheckRef.current = setInterval(() => {
                if (recordDate && getTodayStr() !== recordDate) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setSessionState('expired');
                    setElapsed(MAX_HOURS * 3600);
                    setNotice('Your session crossed midnight. Click "Force Clock-Out" to save it capped at 8 hours.');
                }
            }, 30_000);
        }
        return () => { if (dayCheckRef.current) clearInterval(dayCheckRef.current); };
    }, [sessionState, todayRecord?.date]);

    // ── Auto clock-out at cap ──────────────────────────────────────────────
    const handleAutoClockOut = async () => {
        try {
            const result = await attendanceService.clockOut();
            setTodayRecord(result.data);
            setSessionState('clocked_out');
            setCappedBanner(true);
            setElapsed(MAX_HOURS * 3600);
            setLogs(prev => prev.map(l => l.id === result.data.id ? result.data : l));
        } catch { /* best-effort */ }
    };

    // ── Clock In ──────────────────────────────────────────────────────────
    const handleClockIn = async () => {
        if (!ojtIdInput.trim()) {
            setError('Please enter your OJT ID before clocking in.');
            return;
        }
        setActing(true);
        setError(null);
        setNotice(null);
        try {
            const rec = await attendanceService.clockIn(ojtIdInput.trim());
            setTodayRecord(rec);
            setSessionState('clocked_in');
            setElapsed(0);
            setLogs(prev => [rec, ...prev.filter(l => l.id !== rec.id)]);
        } catch (err: any) {
            const msg = err.response?.data?.message ?? err.message ?? 'Clock-in failed.';
            setError(msg);
        } finally {
            setActing(false);
        }
    };

    // ── Clock Out ─────────────────────────────────────────────────────────
    const handleClockOut = async () => {
        setActing(true);
        setError(null);
        setNotice(null);
        try {
            const result = await attendanceService.clockOut();
            setTodayRecord(result.data);
            setSessionState('clocked_out');
            if (timerRef.current) clearInterval(timerRef.current);
            if (result.capped) setCappedBanner(true);
            if (result.cross_midnight) {
                setNotice('Session crossed midnight — hours capped at 8 and saved to yesterday\'s record.');
            }
            setLogs(prev => prev.map(l => l.id === result.data.id ? result.data : l));
        } catch (err: any) {
            setError(err.response?.data?.message ?? err.message ?? 'Clock-out failed.');
        } finally {
            setActing(false);
        }
    };

    // ── Delete entry ──────────────────────────────────────────────────────
    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await attendanceService.deleteAttendance(deleteId);
            setLogs(prev => prev.filter(l => l.id !== deleteId));
            if (todayRecord?.id === deleteId) {
                setTodayRecord(null);
                setSessionState('idle');
                setElapsed(0);
            }
        } catch (err: any) {
            setError(err.message ?? 'Failed to delete record.');
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    const cancelDelete = () => {
        setDeleteId(null);
    };

    // ── Derived stats ──────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const todayStr = getTodayStr();
        const todayHours = logs.filter(l => l.date === todayStr).reduce((s, l) => s + (l.total_hours || 0), 0);
        const { monday, sunday } = (() => {
            const now = new Date();
            const day = now.getDay();
            const mono = new Date(now);
            mono.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
            mono.setHours(0, 0, 0, 0);
            const sun = new Date(mono);
            sun.setDate(mono.getDate() + 6);
            sun.setHours(23, 59, 59, 999);
            return { monday: mono, sunday: sun };
        })();
        const weekHours = logs.filter(l => {
            const d = new Date(l.date + 'T12:00:00');
            return d >= monday && d <= sunday;
        }).reduce((s, l) => s + (l.total_hours || 0), 0);
        return {
            todayHours: Math.round(todayHours * 10) / 10,
            weekHours: Math.round(weekHours * 10) / 10,
            totalEntries: logs.length,
        };
    }, [logs]);

    const totalPages = Math.max(1, Math.ceil(logs.length / ITEMS_PER_PAGE));
    
    // Auto-correct out-of-bounds page
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const paginatedLogs = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return logs.slice(start, start + ITEMS_PER_PAGE);
    }, [logs, currentPage]);

    const progressPct = Math.min((elapsed / (MAX_HOURS * 3600)) * 100, 100);
    const isClockedIn  = sessionState === 'clocked_in';
    const isClockedOut = sessionState === 'clocked_out';
    const isExpired    = sessionState === 'expired';
    const isIdle       = sessionState === 'idle';
    const ojtIdOk      = ojtIdInput.trim().length > 0;

    // Readable reason why Clock In might be blocked (shown to user)
    const clockInBlockReason: string | null =
        !ojtIdOk    ? 'Enter your OJT ID first' :
        isClockedIn ? 'You are already clocked in' :
        isClockedOut? 'Session already completed for today' :
        isExpired   ? 'Expired session — use Force Clock-Out first' :
        loading     ? 'Loading your attendance data…' :
        null;

    // ──────────────────────────────────────────────────────────────────────
    return (
        <>
            <style>{`
                @keyframes tl-pulse { 0%,100%{opacity:1}50%{opacity:.55} }
                @keyframes tl-fadein { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none} }
                @keyframes tl-spin { to{transform:rotate(360deg)} }
                .tl-page {}
                .tl-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; }
                .tl-header h1 { margin:0; font-size:1.75rem; font-weight:800; color:hsl(var(--orange)); }
                /* Stat cards */
                .tl-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:1.5rem; }
                .tl-stat { background:#fff; border:1px solid hsl(var(--border)); border-radius:1.25rem; padding:1.25rem 1.5rem; animation:tl-fadein .35s ease both; }
                .tl-stat-icon { width:44px;height:44px;border-radius:.875rem;display:flex;align-items:center;justify-content:center;margin-bottom:.875rem; }
                .tl-stat-label { font-size:.75rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:hsl(var(--muted-foreground));margin-bottom:.25rem; }
                .tl-stat-value { font-size:1.875rem;font-weight:900;color:hsl(var(--foreground));line-height:1; }
                .tl-stat-unit { font-size:.9rem;font-weight:600;color:hsl(var(--muted-foreground));margin-left:.25rem; }
                /* Grid */
                .tl-grid { display:grid; grid-template-columns:1fr 1.4fr; gap:1.25rem; }
                /* Session card */
                .tl-session { background:#fff; border:1px solid hsl(var(--border)); border-radius:1.25rem; padding:1.5rem; display:flex;flex-direction:column;gap:1rem; }
                .tl-session-title { font-size:1.0625rem;font-weight:700;color:hsl(var(--foreground)); margin:0; }
                /* OJT ID field */
                .tl-ojt-wrap { position:relative; }
                .tl-ojt-icon { position:absolute;left:.875rem;top:50%;transform:translateY(-50%);color:hsl(var(--muted-foreground));pointer-events:none; }
                .tl-ojt-input { width:100%;box-sizing:border-box;padding:.6875rem .875rem .6875rem 2.5rem;border:1.5px solid hsl(var(--border));border-radius:.875rem;font-size:.9375rem;font-weight:500;outline:none;transition:border-color .15s,box-shadow .15s;background:#fff;color:hsl(var(--foreground)); }
                .tl-ojt-input:focus { border-color:hsl(var(--orange));box-shadow:0 0 0 3px hsl(var(--orange)/.15); }
                .tl-ojt-input.tl-ojt-locked { background:hsl(var(--muted)/.4);color:hsl(var(--muted-foreground));cursor:not-allowed; }
                .tl-ojt-hint { font-size:.75rem;color:hsl(var(--muted-foreground));margin-top:.25rem;padding-left:.25rem; }
                /* Clock ring */
                .tl-clock-ring-wrap { position:relative;width:144px;height:144px;margin:0 auto; }
                .tl-clock-ring-bg { fill:none;stroke:hsl(var(--border)); }
                .tl-clock-ring-fg { fill:none;stroke:hsl(var(--orange));stroke-linecap:round;transition:stroke-dashoffset .8s cubic-bezier(.4,0,.2,1); }
                .tl-ring-expired .tl-clock-ring-fg { stroke:#ef4444; }
                .tl-ring-done .tl-clock-ring-fg { stroke:#22c55e; }
                .tl-clock-center { position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center; }
                .tl-clock-time { font-size:1.375rem;font-weight:800;letter-spacing:-.03em;color:hsl(var(--foreground)); }
                .tl-clock-label { font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:hsl(var(--muted-foreground));margin-top:.15rem; }
                .tl-clock-pulse { animation:tl-pulse 1.6s ease-in-out infinite; }
                /* Status badge */
                .tl-status-badge { display:inline-flex;align-items:center;gap:.375rem;padding:.3125rem .75rem;border-radius:100px;font-size:.8125rem;font-weight:700; }
                .tl-status-idle { background:hsl(var(--muted));color:hsl(var(--muted-foreground)); }
                .tl-status-in { background:hsl(var(--orange)/.12);color:hsl(var(--orange)); }
                .tl-status-out { background:#dcfce7;color:#166534; }
                .tl-status-exp { background:#fee2e2;color:#991b1b; }
                .tl-status-dot { width:7px;height:7px;border-radius:50%; }
                .tl-status-dot-idle { background:hsl(var(--muted-foreground)); }
                .tl-status-dot-in { background:hsl(var(--orange));animation:tl-pulse 1.2s ease-in-out infinite; }
                .tl-status-dot-out { background:#22c55e; }
                .tl-status-dot-exp { background:#ef4444; }
                /* Time row */
                .tl-time-row { display:flex;justify-content:space-between; }
                .tl-time-cell { display:flex;flex-direction:column;align-items:center;gap:.25rem; }
                .tl-time-val { font-size:1rem;font-weight:700;color:hsl(var(--foreground)); }
                .tl-time-lbl { font-size:.6875rem;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:hsl(var(--muted-foreground)); }
                /* Buttons */
                .tl-btn-row { display:grid;grid-template-columns:1fr 1fr;gap:.75rem; }
                .tl-btn { width:100%;padding:.75rem;border-radius:.875rem;border:none;font-size:.9375rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:.5rem;transition:all .18s ease; }
                .tl-btn:disabled { opacity:.45;cursor:not-allowed;transform:none!important; }
                .tl-btn-in { background:hsl(var(--orange));color:#fff; }
                .tl-btn-in:not(:disabled):hover { filter:brightness(.9);transform:translateY(-1px); }
                .tl-btn-out { background:#fff;color:hsl(var(--orange));border:2px solid hsl(var(--orange)); }
                .tl-btn-out:not(:disabled):hover { background:hsl(var(--orange)/.08);transform:translateY(-1px); }
                .tl-btn-exp { background:#ef4444;color:#fff; }
                .tl-btn-exp:not(:disabled):hover { background:#dc2626;transform:translateY(-1px); }
                /* Spinner icon */
                .tl-spinning { animation:tl-spin 1s linear infinite; }
                /* Alert */
                .tl-alert { border-radius:.875rem;padding:.75rem 1rem;font-size:.875rem;display:flex;align-items:flex-start;gap:.5rem;line-height:1.4; }
                .tl-alert-err { background:#fee2e2;color:#991b1b; }
                .tl-alert-notice { background:#fef3c7;color:#92400e; }
                /* Entries */
                .tl-entries { background:#fff;border:1px solid hsl(var(--border));border-radius:1.25rem;padding:1.5rem; display: flex; flex-direction: column; }
                .tl-entries-list { flex: 1; display: flex; flex-direction: column; min-height: 320px; }
                .tl-entries-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem; flex-shrink: 0; }
                .tl-entries-title { font-size:1.0625rem;font-weight:700;color:hsl(var(--foreground));margin:0; }
                .tl-refresh-btn { background:none;border:none;cursor:pointer;color:hsl(var(--orange));display:flex;align-items:center;gap:.25rem;font-size:.8125rem;font-weight:700;padding:.25rem .5rem;border-radius:.5rem; }
                .tl-refresh-btn:hover { background:hsl(var(--orange)/.1); }
                .tl-entry { animation:tl-fadein .3s ease both;border-bottom:1px solid hsl(var(--border));padding:.875rem 0;display:flex;align-items:flex-start;justify-content:space-between;gap:.5rem; }
                .tl-entry:last-child { border-bottom:none; }
                .tl-entry-date { font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:hsl(var(--muted-foreground));margin-bottom:.25rem;display:flex;align-items:center;gap:.375rem; }
                .tl-entry-times { font-size:.9375rem;font-weight:700;color:hsl(var(--foreground));margin-bottom:.375rem; }
                .tl-entry-badge { display:inline-flex;align-items:center;padding:.2rem .625rem;background:hsl(var(--orange)/.12);color:hsl(var(--orange));border-radius:100px;font-size:.75rem;font-weight:700; }
                .tl-entry-late { background:#fef3c7;color:#92400e; }
                .tl-del-btn { background:none;border:none;cursor:pointer;color:#9ca3af;padding:.25rem;border-radius:.5rem;flex-shrink:0;transition:all .15s; }
                .tl-del-btn:hover { color:#ef4444;background:#fee2e2; }
                .tl-empty { text-align:center;padding:2.5rem 1rem;color:hsl(var(--muted-foreground));font-size:.9375rem; }
                .tl-divider { width:1px;background:hsl(var(--border)); }
                /* Pagination */
                .tl-pagination { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 1rem; border-top: 1px solid hsl(var(--border)); }
                .tl-pag-info { font-size: .8125rem; color: hsl(var(--muted-foreground)); font-weight: 500; }
                .tl-pag-controls { display: flex; gap: .5rem; }
                .tl-pag-btn { background: #fff; border: 1px solid hsl(var(--border)); border-radius: .5rem; padding: .375rem .75rem; font-size: .8125rem; font-weight: 600; color: hsl(var(--foreground)); cursor: pointer; transition: all .15s; }
                .tl-pag-btn:hover:not(:disabled) { background: hsl(var(--muted)); }
                .tl-pag-btn:disabled { opacity: .5; cursor: not-allowed; }
                /* Modal */
                .tl-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 1rem; animation: tl-fadein 0.2s ease both; backdrop-filter: blur(2px); }
                .tl-modal { background: #fff; width: 100%; max-width: 400px; border-radius: 1.25rem; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1); display: flex; flex-direction: column; gap: 1.25rem; position: relative; }
                .tl-modal-close { position: absolute; right: 1rem; top: 1rem; background: none; border: none; color: hsl(var(--muted-foreground)); cursor: pointer; padding: 0.25rem; border-radius: 0.5rem; transition: background 0.15s; }
                .tl-modal-close:hover { background: hsl(var(--muted)); color: hsl(var(--foreground)); }
                .tl-modal-header { display: flex; align-items: center; gap: 0.75rem; color: #ef4444; }
                .tl-modal-icon { background: #fee2e2; padding: 0.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
                .tl-modal-title { font-size: 1.125rem; font-weight: 700; color: hsl(var(--foreground)); margin: 0; }
                .tl-modal-body { font-size: 0.9375rem; color: hsl(var(--muted-foreground)); line-height: 1.5; margin: 0; }
                .tl-modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
                .tl-modal-btn { padding: 0.625rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.15s; border: none; }
                .tl-modal-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .tl-modal-cancel { background: #f3f4f6; color: #4b5563; }
                .tl-modal-cancel:hover:not(:disabled) { background: #e5e7eb; }
                .tl-modal-confirm { background: #ef4444; color: #fff; display: flex; align-items: center; gap: 0.375rem; }
                .tl-modal-confirm:hover:not(:disabled) { background: #dc2626; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3); }
                @media(max-width:900px){ .tl-grid{grid-template-columns:1fr;} }
                @media(max-width:600px){ .tl-stats{grid-template-columns:1fr 1fr;} }
            `}</style>

            <div className="tl-page">
                {/* Header */}
                <div className="tl-header">
                    <h1>Time Log</h1>
                </div>

                {/* Stat Cards */}
                <div className="tl-stats">
                    {[
                        { label: "Today's Hours", value: loading ? '…' : `${stats.todayHours}`, unit: 'hrs', icon: <Clock size={22} />, bg: '#e0eaff', color: '#3b6ef6', delay: 0 },
                        { label: 'This Week', value: loading ? '…' : `${stats.weekHours}`, unit: 'hrs', icon: <Calendar size={22} />, bg: 'hsl(var(--orange)/.12)', color: 'hsl(var(--orange))', delay: .05 },
                        { label: 'Total Entries', value: loading ? '…' : `${stats.totalEntries}`, unit: 'logs', icon: <FileText size={22} />, bg: '#dcfce7', color: '#16a34a', delay: .1 },
                    ].map(s => (
                        <div key={s.label} className="tl-stat" style={{ animationDelay: `${s.delay}s` }}>
                            <div className="tl-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                            <div className="tl-stat-label">{s.label}</div>
                            <div className="tl-stat-value">{s.value}<span className="tl-stat-unit">{s.unit}</span></div>
                        </div>
                    ))}
                </div>

                {/* Main grid */}
                <div className="tl-grid">

                    {/* ── Session Panel ── */}
                    <div className="tl-session">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <p className="tl-session-title">Log Time Entry</p>
                            {isIdle      && <span className="tl-status-badge tl-status-idle"><span className="tl-status-dot tl-status-dot-idle"/>Not Clocked In</span>}
                            {isClockedIn && <span className="tl-status-badge tl-status-in"><span className="tl-status-dot tl-status-dot-in"/>Active</span>}
                            {isClockedOut&& <span className="tl-status-badge tl-status-out"><span className="tl-status-dot tl-status-dot-out"/>Completed</span>}
                            {isExpired   && <span className="tl-status-badge tl-status-exp"><span className="tl-status-dot tl-status-dot-exp"/>Expired</span>}
                        </div>

                        {/* OJT ID field */}
                        <div>
                            <div className="tl-ojt-wrap">
                                <Lock size={16} className="tl-ojt-icon" />
                                <input
                                    id="ojt-id-input"
                                    type="text"
                                    className={`tl-ojt-input${(isClockedIn || isClockedOut || isExpired) ? ' tl-ojt-locked' : ''}`}
                                    placeholder="Enter OJT ID"
                                    value={ojtIdInput}
                                    onChange={e => { setOjtIdInput(e.target.value); setError(null); }}
                                    maxLength={20}
                                    autoComplete="off"
                                    disabled={isClockedIn || isClockedOut || isExpired}
                                    title={
                                        isClockedIn  ? 'OJT ID is locked while you are clocked in' :
                                        isClockedOut ? 'Session already completed for today' :
                                        isExpired    ? 'Complete the expired session first' :
                                        undefined
                                    }
                                />
                            </div>
                            <p className="tl-ojt-hint">
                                {isClockedIn
                                    ? 'OJT ID is locked while your session is active.'
                                    : isClockedOut
                                    ? 'Session complete for today. You may check your entry below.'
                                    : 'Enter your OJT ID to clock in and out.'}
                            </p>
                        </div>

                        {/* Ring clock */}
                        {(() => {
                            const R = 60;
                            const circ = 2 * Math.PI * R;
                            const offset = circ - (progressPct / 100) * circ;
                            const ringClass = isExpired ? 'tl-ring-expired' : isClockedOut ? 'tl-ring-done' : '';
                            return (
                                <div className="tl-clock-ring-wrap">
                                    <svg viewBox="0 0 144 144" width="144" height="144" className={ringClass}>
                                        <circle className="tl-clock-ring-bg" cx="72" cy="72" r={R} strokeWidth="10"/>
                                        <circle className="tl-clock-ring-fg" cx="72" cy="72" r={R} strokeWidth="10"
                                            strokeDasharray={circ} strokeDashoffset={offset}
                                            transform="rotate(-90 72 72)"/>
                                    </svg>
                                    <div className="tl-clock-center">
                                        <span className={`tl-clock-time${isClockedIn ? ' tl-clock-pulse' : ''}`}>
                                            {isClockedIn || isExpired
                                                ? formatElapsed(elapsed)
                                                : isClockedOut
                                                    ? `${todayRecord?.total_hours ?? 0}h`
                                                    : '00:00:00'}
                                        </span>
                                        <span className="tl-clock-label">
                                            {isClockedIn ? 'Elapsed' : isClockedOut ? 'Total' : isExpired ? 'Expired' : 'Ready'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Today's time-in / time-out / hours */}
                        {todayRecord && (
                            <div className="tl-time-row">
                                <div className="tl-time-cell">
                                    <span className="tl-time-lbl">Time In</span>
                                    <span className="tl-time-val">{formatTimeFull(todayRecord.time_in)}</span>
                                </div>
                                <div className="tl-divider"/>
                                <div className="tl-time-cell">
                                    <span className="tl-time-lbl">Time Out</span>
                                    <span className="tl-time-val">{formatTimeFull(todayRecord.time_out)}</span>
                                </div>
                                <div className="tl-divider"/>
                                <div className="tl-time-cell">
                                    <span className="tl-time-lbl">Hours</span>
                                    <span className="tl-time-val">{todayRecord.total_hours ?? 0}h</span>
                                </div>
                            </div>
                        )}

                        {/* Banners */}
                        {cappedBanner && (
                            <div className="tl-alert tl-alert-notice">
                                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }}/>
                                Reached 8-hour daily maximum — hours capped automatically.
                            </div>
                        )}
                        {isExpired && (
                            <div className="tl-alert tl-alert-err">
                                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }}/>
                                Session from previous day is invalid. Enter your OJT ID and click <strong>Force Clock-Out</strong>.
                            </div>
                        )}
                        {notice && (
                            <div className="tl-alert tl-alert-notice">
                                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }}/>{notice}
                            </div>
                        )}
                        {error && (
                            <div className="tl-alert tl-alert-err">
                                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }}/>{error}
                            </div>
                        )}

                        {/* Clock In / Out buttons */}
                        <div className="tl-btn-row">
                            {/* Clock In — only active when session is idle (not yet timed in today) */}
                            {/* Clock In */}
                            <button
                                className="tl-btn tl-btn-in"
                                onClick={handleClockIn}
                                disabled={acting || !ojtIdOk || !isIdle}
                                title={clockInBlockReason ?? 'Clock in for today'}
                            >
                                {acting && isIdle
                                    ? <RefreshCw size={17} className="tl-spinning"/>
                                    : <LogIn size={17}/>}
                                Clock In
                            </button>

                            {/* Clock Out */}
                            <button
                                className={`tl-btn ${isExpired ? 'tl-btn-exp' : 'tl-btn-out'}`}
                                onClick={handleClockOut}
                                disabled={acting || isIdle || isClockedOut || (isClockedIn && elapsed < MAX_HOURS * 3600)}
                                title={
                                    isIdle       ? 'You have not clocked in yet' :
                                    isClockedOut ? 'Already completed today' :
                                    isExpired    ? 'Force clock-out (session from previous day)' :
                                    (isClockedIn && elapsed < MAX_HOURS * 3600) ? `Must complete 8 hours (Elapsed: ${formatElapsed(elapsed)})` :
                                    'Clock out now'
                                }
                            >
                                {acting && (isClockedIn || isExpired)
                                    ? <RefreshCw size={17} className="tl-spinning"/>
                                    : isExpired ? <AlertCircle size={17}/> : <LogOut size={17}/>}
                                {isExpired ? 'Force Clock-Out' : 'Clock Out'}
                            </button>
                        </div>

                        <p style={{ margin: 0, fontSize: '.75rem', color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
                            Today only · Max <strong>{MAX_HOURS} hours</strong> · Philippine Standard Time
                        </p>
                    </div>

                    {/* ── Recent Entries ── */}
                    <div className="tl-entries">
                        <div className="tl-entries-header">
                            <p className="tl-entries-title">Recent Entries</p>
                            <button className="tl-refresh-btn" onClick={refresh} title="Refresh">
                                <RefreshCw size={13}/> Refresh
                            </button>
                        </div>

                        {loading ? (
                            <div className="tl-empty">Loading…</div>
                        ) : logs.length === 0 ? (
                            <div className="tl-empty">No entries yet. Enter your OJT ID and clock in to start.</div>
                        ) : (
                            <>
                                <div className="tl-entries-list">
                                    {paginatedLogs.map((log, i) => {
                                        const isToday = log.date === getTodayStr();
                                        return (
                                            <div key={log.id} className="tl-entry" style={{ animationDelay: `${i * 0.04}s` }}>
                                                <div style={{ flex: 1 }}>
                                                    <div className="tl-entry-date">
                                                        <Calendar size={12}/>
                                                        {isToday ? 'Today — ' : ''}{formatDateLong(log.date)}
                                                    </div>
                                                    <div className="tl-entry-times">
                                                        {formatTimeFull(log.time_in)}
                                                        {' → '}
                                                        {log.time_out
                                                            ? formatTimeFull(log.time_out)
                                                            : isToday 
                                                                ? <span style={{ color: 'hsl(var(--orange))' }}>In progress…</span>
                                                                : <span style={{ color: '#ef4444' }}>Missing Clock-Out</span>}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                        <span className="tl-entry-badge">{log.total_hours} hrs</span>
                                                        {log.status && log.status !== 'present' && (
                                                            <span className="tl-entry-badge tl-entry-late" style={{ textTransform: 'capitalize' }}>
                                                                {log.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button className="tl-del-btn" onClick={() => handleDeleteClick(log.id)} title="Delete">
                                                    <Trash size={15}/>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                                {totalPages > 1 && (
                                    <div className="tl-pagination">
                                        <div className="tl-pag-info">
                                            Page {currentPage} of {totalPages}
                                        </div>
                                        <div className="tl-pag-controls">
                                            <button 
                                                className="tl-pag-btn" 
                                                disabled={currentPage === 1} 
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            >
                                                Prev
                                            </button>
                                            <button 
                                                className="tl-pag-btn" 
                                                disabled={currentPage >= totalPages} 
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
        </div>

            {/* Custom Modal */}
            {deleteId && (
                <div className="tl-modal-overlay" onClick={cancelDelete}>
                    <div className="tl-modal" onClick={e => e.stopPropagation()}>
                        <button className="tl-modal-close" onClick={cancelDelete} disabled={isDeleting}>
                            <X size={18} />
                        </button>
                        <div className="tl-modal-header">
                            <div className="tl-modal-icon">
                                <Trash size={24} />
                            </div>
                            <h3 className="tl-modal-title">Delete Record</h3>
                        </div>
                        <p className="tl-modal-body">
                            Are you sure you want to delete this attendance record? This action cannot be undone.
                        </p>
                        <div className="tl-modal-footer">
                            <button className="tl-modal-btn tl-modal-cancel" onClick={cancelDelete} disabled={isDeleting}>
                                Cancel
                            </button>
                            <button className="tl-modal-btn tl-modal-confirm" onClick={confirmDelete} disabled={isDeleting}>
                                {isDeleting ? <RefreshCw size={16} className="tl-spinning" /> : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DailyLogs;
