import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Clock, Calendar, FileText, LogIn, LogOut, AlertCircle, RefreshCw, Trash, Lock, X } from 'lucide-react';
import { attendanceService } from '../../services/attendanceServices';
import type { Attendance } from '../../types/database.types';
import ModalPortal from '../../components/ModalPortal';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_HOURS = 8;
const MANILA_TZ = 'Asia/Manila';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns YYYY-MM-DD in Philippine Standard Time (UTC+8). */
function getTodayStr(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: MANILA_TZ }); // en-CA → YYYY-MM-DD
}

function formatTimeFull(timeStr: string | null | undefined): string {
    if (!timeStr) return '—';
    const parts = timeStr.split(':').map(Number);
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    const s = parts[2] !== undefined ? parts[2] : null;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return s !== null 
        ? `${h12}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} ${period}`
        : `${h12}:${m.toString().padStart(2, '0')} ${period}`;
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
                    const timeInStr = today.time_in.split(':').length === 2 ? `${today.time_in}:00` : today.time_in;
                    const clockInDate = new Date(`${todayManila}T${timeInStr}+08:00`);
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
                setElapsed(prev => Math.min(prev + 1, MAX_HOURS * 3600));
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
                    setNotice('Your session crossed midnight and has been invalidated. Please acknowledge it below.');
                }
            }, 30_000);
        }
        return () => { if (dayCheckRef.current) clearInterval(dayCheckRef.current); };
    }, [sessionState, todayRecord?.date]);

    // ── Auto clock-out removed ──────────────────────────────────────────────

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
                setNotice('Your session crossed midnight and was automatically invalidated.');
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
        isExpired   ? 'Expired session — click Acknowledge below' :
        loading     ? 'Loading your attendance data…' :
        null;

    // ──────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                    Time Log
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Track your daily OJT attendance
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {[
                    { label: "Today's Hours", mobileLabel: 'Today', value: loading ? '...' : `${stats.todayHours}`, unit: 'hrs', icon: <Clock size={20} />, iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
                    { label: 'This Week', mobileLabel: 'Week', value: loading ? '...' : `${stats.weekHours}`, unit: 'hrs', icon: <Calendar size={20} />, iconBg: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-[#FF8800]' },
                    { label: 'Total Entries', mobileLabel: 'Entries', value: loading ? '...' : `${stats.totalEntries}`, unit: 'logs', icon: <FileText size={20} />, iconBg: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
                ].map((s) => (
                    <div key={s.label} className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-3 sm:p-5">
                        <div className={`flex w-8 h-8 sm:w-10 sm:h-10 rounded-xl items-center justify-center mb-2 sm:mb-3 ${s.iconBg} ${s.iconColor}`}>
                            {s.icon}
                        </div>
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] sm:tracking-widest text-gray-400 dark:text-gray-500 mb-1">
                            <span className="sm:hidden">{s.mobileLabel}</span>
                            <span className="hidden sm:inline">{s.label}</span>
                        </p>
                        <p className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white leading-none">
                            {s.value}<span className="text-[11px] sm:text-base font-semibold text-gray-400 ml-1">{s.unit}</span>
                        </p>
                    </div>
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Session Panel */}
                <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-5 flex flex-col gap-4">
                    {/* Panel header + status */}
                    <div className="flex items-center justify-between">
                        <p className="font-bold text-gray-900 dark:text-white">Log Time Entry</p>
                        {isIdle       && <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500">
                            <span className="w-2 h-2 rounded-full bg-gray-400 inline-block"/>Not Clocked In</span>}
                        {isClockedIn  && <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-[#FF8800]">
                            <span className="w-2 h-2 rounded-full bg-[#FF8800] inline-block animate-pulse"/>Active</span>}
                        {isClockedOut && <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            <span className="w-2 h-2 rounded-full bg-green-500 inline-block"/>Completed</span>}
                        {isExpired    && <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"/>Expired</span>}
                    </div>

                    {/* OJT ID field */}
                    <div>
                        <div className="relative">
                            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                id="ojt-id-input"
                                type="text"
                                className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all
                                    ${(isClockedIn || isClockedOut || isExpired)
                                        ? 'bg-gray-50 dark:bg-white/5 text-gray-400 cursor-not-allowed border-gray-200 dark:border-white/5'
                                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-white/10 focus:border-[#FF8800] focus:ring-2 focus:ring-[#FF8800]/15 text-gray-900 dark:text-white'}`}
                                placeholder="Enter OJT ID"
                                value={ojtIdInput}
                                onChange={e => { setOjtIdInput(e.target.value.replace(/\D/g, '')); setError(null); }}
                                inputMode="numeric"
                                maxLength={20}
                                autoComplete="off"
                                disabled={isClockedIn || isClockedOut || isExpired}
                            />
                        </div>
                        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500 pl-1">
                            {isClockedIn ? 'OJT ID is locked while your session is active.'
                                : isClockedOut ? 'Session complete for today. Check your entry below.'
                                : 'Enter your OJT ID to clock in and out.'}
                        </p>
                    </div>

                    {/* Ring clock */}
                    {(() => {
                        const R = 60;
                        const circ = 2 * Math.PI * R;
                        const actualPct = isClockedOut
                            ? Math.min(((todayRecord?.total_hours || 0) / MAX_HOURS) * 100, 100)
                            : progressPct;
                        const offset = circ - (actualPct / 100) * circ;
                        const ringColor = isExpired ? '#ef4444' : isClockedOut ? '#22c55e' : '#FF8800';
                        return (
                            <div className="relative w-36 h-36 shrink-0 mx-auto">
                                <svg viewBox="0 0 144 144" className="absolute inset-0 w-full h-full">
                                    <circle fill="none" stroke="rgb(229 231 235)" cx="72" cy="72" r={R} strokeWidth="10"/>
                                    <circle fill="none" stroke={ringColor} cx="72" cy="72" r={R} strokeWidth="10"
                                        strokeLinecap="round"
                                        strokeDasharray={circ} strokeDashoffset={offset}
                                        transform="rotate(-90 72 72)"
                                        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)' }}/>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                    <span className={`text-xl font-black tracking-tight text-gray-900 dark:text-white ${isClockedIn ? 'opacity-100' : ''}`}
                                        style={isClockedIn ? { animation: 'pulse 1.6s ease-in-out infinite' } : {}}>
                                        {isClockedIn || isExpired
                                            ? formatElapsed(elapsed)
                                            : isClockedOut
                                                ? `${todayRecord?.total_hours ?? 0}h`
                                                : '00:00:00'}
                                    </span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-0.5">
                                        {isClockedIn ? 'Elapsed' : isClockedOut ? 'Total' : isExpired ? 'Expired' : 'Ready'}
                                    </span>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Today's time-in / time-out / hours */}
                    {todayRecord && (
                        <div className="flex items-center justify-around py-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Time In</span>
                                <span className="text-base font-bold text-gray-900 dark:text-white">{formatTimeFull(todayRecord.time_in)}</span>
                            </div>
                            <div className="w-px h-8 bg-gray-200 dark:bg-white/10"/>
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Time Out</span>
                                <span className="text-base font-bold text-gray-900 dark:text-white">{formatTimeFull(todayRecord.time_out)}</span>
                            </div>
                            <div className="w-px h-8 bg-gray-200 dark:bg-white/10"/>
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Hours</span>
                                <span className="text-base font-bold text-gray-900 dark:text-white">{todayRecord.total_hours ?? 0}h</span>
                            </div>
                        </div>
                    )}

                    {/* Banners */}
                    {cappedBanner && (
                        <div className="flex items-start gap-2 px-3 py-2.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-xl text-sm text-yellow-800 dark:text-yellow-400">
                            <AlertCircle size={15} className="shrink-0 mt-0.5"/>
                            Reached 8-hour daily maximum — hours capped automatically.
                        </div>
                    )}
                    {isExpired && (
                        <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-sm text-red-700 dark:text-red-400">
                            <AlertCircle size={15} className="shrink-0 mt-0.5"/>
                            Session from previous day is invalid. Enter your OJT ID and click <strong className="ml-1">Acknowledge</strong>.
                        </div>
                    )}
                    {notice && (
                        <div className="flex items-start gap-2 px-3 py-2.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-xl text-sm text-yellow-800 dark:text-yellow-400">
                            <AlertCircle size={15} className="shrink-0 mt-0.5"/>{notice}
                        </div>
                    )}
                    {error && (
                        <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-sm text-red-700 dark:text-red-400">
                            <AlertCircle size={15} className="shrink-0 mt-0.5"/>{error}
                        </div>
                    )}

                    {/* Clock In / Out buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FF8800] text-white text-sm font-bold hover:brightness-90 disabled:opacity-45 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5"
                            onClick={handleClockIn}
                            disabled={acting || !ojtIdOk || !isIdle}
                            title={clockInBlockReason ?? 'Clock in for today'}
                        >
                            {acting && isIdle
                                ? <RefreshCw size={16} className="animate-spin"/>
                                : <LogIn size={16}/>}
                            Clock In
                        </button>
                        <button
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold disabled:opacity-45 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5
                                ${isExpired
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-white dark:bg-transparent border-2 border-[#FF8800] text-[#FF8800] hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}
                            onClick={handleClockOut}
                            disabled={acting || isIdle || isClockedOut || (isClockedIn && elapsed < MAX_HOURS * 3600)}
                            title={(isClockedIn && elapsed < MAX_HOURS * 3600) ? 'You must complete 8 hours before clocking out' : undefined}
                        >
                            {acting && (isClockedIn || isExpired)
                                ? <RefreshCw size={16} className="animate-spin"/>
                                : isExpired ? <AlertCircle size={16}/> : <LogOut size={16}/>}
                            {isExpired ? 'Acknowledge' : 'Clock Out'}
                        </button>
                    </div>

                    <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                        Today only · Max <strong>{MAX_HOURS} hours</strong> · Philippine Standard Time
                    </p>
                </div>

                {/* Recent Entries */}
                <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm p-5 flex flex-col">
                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <p className="font-bold text-gray-900 dark:text-white">Recent Entries</p>
                        <button
                            className="flex items-center gap-1.5 text-xs font-bold text-[#FF8800] hover:bg-orange-50 dark:hover:bg-orange-900/20 px-2.5 py-1.5 rounded-lg transition-all"
                            onClick={refresh}
                        >
                            <RefreshCw size={13}/> Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm min-h-[200px]">Loading…</div>
                    ) : logs.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm text-center min-h-[200px] px-4">
                            No entries yet. Enter your OJT ID and clock in to start.
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 divide-y divide-gray-100 dark:divide-white/5">
                                {paginatedLogs.map((log, i) => {
                                    const isToday = log.date === getTodayStr();
                                    return (
                                        <div key={log.id} className="py-3.5 flex items-start justify-between gap-2" style={{ animationDelay: `${i * 0.04}s` }}>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
                                                    <Calendar size={11}/>
                                                    {isToday ? 'Today — ' : ''}{formatDateLong(log.date)}
                                                </div>
                                                <div className="text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                                                    {formatTimeFull(log.time_in)}
                                                    {' → '}
                                                    {log.time_out
                                                        ? formatTimeFull(log.time_out)
                                                        : isToday
                                                            ? <span className="text-[#FF8800]">In progress…</span>
                                                            : <span className="text-red-500">Missing Clock-Out</span>}
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-[#FF8800] text-xs font-bold rounded-full">
                                                        {log.total_hours} hrs
                                                    </span>
                                                    {log.status && log.status !== 'present' && (
                                                        <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs font-bold rounded-full capitalize">
                                                            {log.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shrink-0"
                                                onClick={() => handleDeleteClick(log.id)}
                                                title="Delete"
                                            >
                                                <Trash size={14}/>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100 dark:border-white/5">
                                    <span className="text-xs text-gray-400 font-medium">Page {currentPage} of {totalPages}</span>
                                    <div className="flex gap-2">
                                        <button
                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        >
                                            Prev
                                        </button>
                                        <button
                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

            {/* Delete Confirm Modal */}
            {deleteId && (
                <ModalPortal>
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4" onClick={cancelDelete}>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/5 shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <button className="absolute right-4 top-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 transition-all" onClick={cancelDelete} disabled={isDeleting}>
                            <X size={18}/>
                        </button>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
                                <Trash size={20}/>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Record</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                            Are you sure you want to delete this attendance record? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                className="px-5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 transition-all"
                                onClick={cancelDelete}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition-all"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? <RefreshCw size={15} className="animate-spin"/> : 'Delete'}
                            </button>
                        </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
};

export default DailyLogs;
