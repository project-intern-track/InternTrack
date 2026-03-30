import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { BarChart, CheckCircle, Clock, Search, Filter, Download, Plus, UserCheck, X, ChevronDown, Pencil, Trash } from 'lucide-react';
import { attendanceService } from '../../services/attendanceServices';
import { userService } from '../../services/userServices';
import type { Attendance, Users } from '../../types/database.types';
import '../../index.css';
import DropdownSelect from '../../components/DropdownSelect';
import MobileFilterDrawer from '../../components/MobileFilterDrawer';
import ModalPortal from '../../components/ModalPortal';
import DateTimePicker from '../../components/DateTimePicker';
import ConfirmationModal from '../../components/ConfirmationModal';

interface AttendanceRecord extends Omit<Attendance, 'id'> {
  id: string | number; // Laravel ids are numbers, but we often treat as string in frontend
  user: {
    full_name: string;
    role?: string;
  };
}

interface AttendanceStats {
  completed: number;
  incomplete: number;
  noLog: number;
  avgHoursPerDay?: number;
}

const MonitorAttendance = ({ stats }: { stats?: AttendanceStats }) => {
  const ATTENDANCE_TABLE_MIN_WIDTH = 1080;
  const normalizeAttendanceStatus = (status?: string | null) => {
    const normalized = (status ?? '').toLowerCase();
    return ['late', 'incomplete'].includes(normalized) ? 'absent' : normalized;
  };

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // memoize today's date
  const todayDate = useMemo(() => getTodayDate(), []);

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(todayDate);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const attendanceContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const [useCardLayout, setUseCardLayout] = useState(false);

  // Manual Entry State
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [interns, setInterns] = useState<Users[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | number | null>(null);
  const [editingInternName, setEditingInternName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AttendanceRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [manualInternOpen, setManualInternOpen] = useState(false);
  const [manualInternQuery, setManualInternQuery] = useState('');
  const manualInternRef = useRef<HTMLDivElement>(null);
  const [manualEntryForm, setManualEntryForm] = useState({
    user_id: '',
    date: todayDate,
    time_in: '',
    time_out: '',
    status: 'present'
  });

  const resetManualEntryForm = () => {
    setManualEntryForm({
      user_id: '',
      date: todayDate,
      time_in: '',
      time_out: '',
      status: 'present'
    });
    setEditingRecordId(null);
    setEditingInternName('');
    setSubmitError(null);
    setManualInternOpen(false);
    setManualInternQuery('');
  };

  const loadAttendanceRecords = async () => {
    const records = await attendanceService.getAttendance();
    setAttendanceRecords(records as unknown as AttendanceRecord[]);
  };

  useEffect(() => {
    if (isManualEntryOpen && interns.length === 0) {
      userService.fetchInterns().then(setInterns).catch(console.error);
    }
  }, [isManualEntryOpen, interns.length]);

  useEffect(() => {
    if (!manualInternOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!manualInternRef.current?.contains(event.target as Node)) {
        setManualInternOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [manualInternOpen]);

  useEffect(() => {
    if (!isManualEntryOpen) {
      setManualInternOpen(false);
      setManualInternQuery('');
      return;
    }

    const selectedIntern = interns.find((intern) => String(intern.id) === manualEntryForm.user_id);
    setManualInternQuery(selectedIntern?.full_name ?? '');
  }, [isManualEntryOpen, manualEntryForm.user_id, interns]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setSubmitError(null);
      if (editingRecordId !== null) {
        await attendanceService.update(editingRecordId, manualEntryForm as any);
      } else {
        await attendanceService.store(manualEntryForm as any);
      }
      setIsManualEntryOpen(false);
      await loadAttendanceRecords();
      resetManualEntryForm();
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const messages = Object.values(err.response.data.errors).flat().join('\n');
        setSubmitError(messages);
      } else {
        setSubmitError(err.response?.data?.message || err.message || 'Failed to submit entry');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCreateModal = () => {
    resetManualEntryForm();
    setIsManualEntryOpen(true);
  };

  const handleOpenEditModal = (record: AttendanceRecord) => {
    setEditingRecordId(record.id);
    setEditingInternName(record.user?.full_name ?? '');
    setSubmitError(null);
    setManualEntryForm({
      user_id: String(record.user_id),
      date: record.date,
      time_in: record.time_in ?? '',
      time_out: record.time_out ?? '',
      status: normalizeAttendanceStatus(record.status) || 'present'
    });
    setManualInternQuery(record.user?.full_name ?? '');
    setManualInternOpen(false);
    setIsManualEntryOpen(true);
  };

  const handleDeleteRecord = (record: AttendanceRecord) => {
    setDeleteTarget(record);
  };

  const handleCancelDelete = () => {
    if (deleting) return;
    setDeleteTarget(null);
  };

  const confirmDeleteRecord = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await attendanceService.deleteAttendance(deleteTarget.id);
      setDeleteTarget(null);
      await loadAttendanceRecords();
    } catch (err) {
      console.error('Failed to delete attendance record', err);
      setSubmitError('Failed to delete attendance record.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseManualModal = () => {
    setIsManualEntryOpen(false);
    resetManualEntryForm();
  };

  const handleExport = () => {
    if (filteredRecords.length === 0) return;

    const headers = ['Name', 'Role', 'Date', 'Time In', 'Time Out', 'Total Hours', 'Status'];
    const rows = filteredRecords.map(r => [
      `"${r.user.full_name}"`,
      r.user.role ? r.user.role.charAt(0).toUpperCase() + r.user.role.slice(1) : 'Intern',
      formatDate(r.date),
      r.time_in ? formatTime(r.time_in) : '',
      r.time_out ? formatTime(r.time_out) : '',
      r.total_hours || 0,
      normalizeAttendanceStatus(r.status)
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Export_${todayDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // fetch real data
  useEffect(() => {
    let mounted = true;
    const loadLogs = async () => {
      try {
        setLoading(true);
        const records = await attendanceService.getAttendance(); // Admin sees all records
        if (mounted) {
          setAttendanceRecords(records as unknown as AttendanceRecord[]);
        }
      } catch (err) {
        console.error('Failed to load attendance records', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadLogs();
    return () => { mounted = false; };
  }, []);

 

  // Filter and deduplicate records 
  const uniqueRecords = useMemo(() => {
    const seenKeys = new Set<string>();
    return attendanceRecords.filter((record) => {
      const key = `${record.id}-${record.date}`;
      if (seenKeys.has(key)) {
        return false; // Skip duplicate
      }
      seenKeys.add(key);
      return true;
    });
  }, [attendanceRecords]);

  const filteredRecords = useMemo(() => {
    return uniqueRecords.filter((record) => {
      const searchTermLower = searchTerm.trim().toLowerCase();
      const matchesSearch = searchTermLower === '' || record.user.full_name.toLowerCase().includes(searchTermLower);

      const matchesStatus =
        statusFilter === 'all' || normalizeAttendanceStatus(record.status) === statusFilter.toLowerCase();

      const matchesRole = roleFilter === 'all' || (record.user.role ?? 'intern').toLowerCase() === roleFilter.toLowerCase();

      //show all records
      const matchesDate = dateFilter === 'all' || record.date.trim() === dateFilter.trim();

      return matchesSearch && matchesStatus && matchesRole && matchesDate;
    });
  }, [uniqueRecords, searchTerm, statusFilter, roleFilter, dateFilter]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter, dateFilter]);

  // Calculate pagination
  const totalRecords = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / recordsPerPage));
  // Ensure currentPage is within valid range
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);
  
  // Sync currentpage
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages]); // Only depend on totalPages to avoid infinite loops
  
  // Pagination helpers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
   
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);

      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  };


  // Save scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      scrollPositionRef.current = container.scrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useLayoutEffect(() => {
    const updateResponsiveLayout = () => {
      const containerWidth = attendanceContainerRef.current?.clientWidth ?? window.innerWidth;
      setUseCardLayout(containerWidth < ATTENDANCE_TABLE_MIN_WIDTH);
    };

    updateResponsiveLayout();

    const observer =
      typeof ResizeObserver !== 'undefined' && attendanceContainerRef.current
        ? new ResizeObserver(() => updateResponsiveLayout())
        : null;

    if (observer && attendanceContainerRef.current) {
      observer.observe(attendanceContainerRef.current);
    }

    window.addEventListener('resize', updateResponsiveLayout);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateResponsiveLayout);
    };
  }, []);

  // Restore scroll position after filtered records update
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (container && scrollPositionRef.current > 0 && filteredRecords.length > 0) {
       container.scrollTop = scrollPositionRef.current;
    }
  }, [filteredRecords]);

  // Calculate stats from records
  const completedRecords = attendanceRecords.filter((r) => r.status && r.status !== 'absent');
  const totalCreditedHours = completedRecords.reduce((sum, r) => sum + (r.total_hours || 0), 0);
  const completedRecordsCount = completedRecords.length;
  
  
  // Average hours per day = total credited hours ÷ number of completed records (each record = one person-day)
  const avgHoursPerDay = completedRecordsCount > 0 ? totalCreditedHours / completedRecordsCount : 0;

  const calculatedStats: AttendanceStats = {
    completed: stats?.completed ?? completedRecords.length,
    incomplete:
      stats?.incomplete ??
      attendanceRecords.filter((r) => (r.status ?? '').toLowerCase() === 'incomplete').length,
    noLog:
      stats?.noLog ??
      attendanceRecords.filter((r) => ['absent', 'late'].includes((r.status ?? '').toLowerCase())).length,
    avgHoursPerDay: stats?.avgHoursPerDay ?? Math.round(avgHoursPerDay * 10) / 10,
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    // If it's just "HH:mm" or "HH:mm:ss"
    if (timeString.length === 5 || timeString.length === 8) {
      const parts = timeString.split(':');
      const hours = parseInt(parts[0], 10);
      const m = parts[1];
      const s = parts[2];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return s ? `${displayHours}:${m}:${s} ${ampm}` : `${displayHours}:${m} ${ampm}`;
    }
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return timeString;
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatHours = (hours: number | null) => {
    if (hours === null) return '-';
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  };

  const getRoleBadge = (role?: string) => {
    switch ((role ?? 'intern').toLowerCase()) {
      case 'admin':
        return <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#ede9fe', color: '#5b21b6', fontWeight: 600, fontSize: '0.75rem' }}>Admin</span>;
      case 'supervisor':
        return <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#ccfbf1', color: '#0f766e', fontWeight: 600, fontSize: '0.75rem' }}>Supervisor</span>;
      default:
        return <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#dbeafe', color: '#1d4ed8', fontWeight: 600, fontSize: '0.75rem' }}>Intern</span>;
    }
  };

  const getStatusBadge = (status: string) => {    switch (normalizeAttendanceStatus(status)) {
      case 'present':
      case 'completed':
        return <span className="badge badge-success px-2 py-1 rounded bg-green-100 text-green-800 font-semibold text-xs capitalize">Present</span>;
      case 'absent':
      case 'no_log':
        return <span className="badge badge-danger px-2 py-1 rounded bg-red-100 text-red-800 font-semibold text-xs capitalize">Absent</span>;
      case 'excused':
        return <span className="badge badge-info px-2 py-1 rounded bg-sky-100 text-sky-900 font-semibold text-xs capitalize">Excused</span>;
      default:
        return <span className="badge px-2 py-1 rounded bg-slate-100 text-slate-700 font-semibold text-xs capitalize">{status}</span>;
    }
  };

  const filteredManualInterns = useMemo(() => {
    const query = manualInternQuery.trim().toLowerCase();
    if (!query) return interns;
    return interns.filter((intern) => intern.full_name.toLowerCase().includes(query));
  }, [interns, manualInternQuery]);

  const selectedManualIntern = interns.find((intern) => String(intern.id) === manualEntryForm.user_id);
  const manualInternListId = 'manual-entry-intern-options';
  const manualInternHasScrollableList = filteredManualInterns.length > 6;

  return (
    <>
      <style>{`
        .attendance-container {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          padding: 0;
        }
        
        .attendance-header h1 {
          color: hsl(var(--orange));
          margin: 0;
          font-size: 31px;
          font-weight: 700;
        }

        .attendance-action-group {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .attendance-action-btn {
          min-height: 40px;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .attendance-action-btn-outline {
          background: #fff;
          color: hsl(var(--orange));
          border: 1.5px solid hsl(var(--orange));
          box-shadow: none;
        }

        .attendance-action-btn-outline:hover:not(:disabled) {
          background: rgba(255, 136, 0, 0.06);
          transform: translateY(-1px);
        }
        
        .attendance-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .attendance-search-container {
          position: relative;
          flex: 1;
          min-width: 200px;
        }
        
        .attendance-filter-section {
          margin-bottom: 1.5rem;
          padding: 1.25rem;
          background-color: #e9e6e1;
          border-radius: 8px;
          position: relative;
          z-index: 20;
          overflow: visible;
        }
        
        .attendance-filter-row {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .attendance-filter-label {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          white-space: nowrap;
        }
        
        .attendance-filter-selects {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          flex: 1;
          min-width: 300px;
          overflow: visible;
        }
        
        .attendance-table-wrapper {
          position: relative;
          z-index: 0;
          width: 100%;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(15, 23, 42, 0.08);
        }

        .attendance-table-scroll {
          width: 100%;
          overflow-x: auto;
          overflow-y: auto;
          max-height: calc(70vh - 2rem);
          -webkit-overflow-scrolling: touch;
        }

        .attendance-table-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .attendance-table-scroll::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .attendance-table-scroll::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }

        .attendance-table-scroll::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }

        .attendance-table {
          width: 100%;
          min-width: 1080px;
          table-layout: fixed;
          border-collapse: separate;
          border-spacing: 0;
          background-color: white;
        }

        .attendance-table thead th {
          text-align: center;
          padding: 1rem;
          font-weight: 600;
          color: white;
          background-color: hsl(var(--orange));
          position: sticky;
          top: 0;
          z-index: 2;
          white-space: nowrap;
        }

        .attendance-table thead th:first-child {
          border-top-left-radius: 8px;
        }

        .attendance-table thead th:last-child {
          border-top-right-radius: 8px;
        }

        .attendance-table td {
          text-align: center;
          padding: 0.875rem 1rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          vertical-align: middle;
          white-space: nowrap;
        }

        .attendance-table td strong {
          display: inline-block;
          text-align: center;
        }

        .attendance-name-cell,
        .attendance-name-cell strong {
          white-space: normal !important;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .attendance-table td .badge {
          display: inline-block;
          margin: 0 auto;
        }

        .attendance-table td:first-child,
        .attendance-table th:first-child {
          min-width: 210px;
        }

        .attendance-table td:nth-child(3),
        .attendance-table th:nth-child(3) {
          min-width: 165px;
        }

        .attendance-table td:nth-child(4),
        .attendance-table td:nth-child(5),
        .attendance-table th:nth-child(4),
        .attendance-table th:nth-child(5) {
          min-width: 170px;
        }

        .attendance-table td:nth-child(3),
        .attendance-table td:nth-child(4),
        .attendance-table td:nth-child(5),
        .attendance-table th:nth-child(3),
        .attendance-table th:nth-child(4),
        .attendance-table th:nth-child(5) {
          padding-left: 1.25rem;
          padding-right: 1.25rem;
        }

        .attendance-table td:last-child,
        .attendance-table th:last-child {
          min-width: 150px;
        }

        .attendance-table tr {
          background-color: white;
        }

        .attendance-table tr:hover {
          background-color: #f5f5f5;
        }

        .attendance-table tbody tr:last-child td {
          border-bottom: none;
        }
        
        .attendance-mobile-card {
          display: none;
        }

        .attendance-card-view .attendance-table-wrapper {
          display: none !important;
        }

        .attendance-card-view .attendance-mobile-card {
          display: grid;
          gap: 1rem;
        }

        .attendance-card-view .attendance-filter-section {
          display: none !important;
        }

        .attendance-mobile-record {
          background: white;
          border-radius: 14px;
          padding: 1rem;
          box-shadow: 0 10px 30px -24px rgba(0, 0, 0, 0.22);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .attendance-mobile-record-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        .attendance-mobile-record-name {
          flex: 1;
          min-width: 0;
          font-weight: 700;
          font-size: 1rem;
          color: #1a1a1a;
          overflow-wrap: anywhere;
        }

        .attendance-mobile-record-details {
          display: grid;
          gap: 0.625rem;
        }

        .attendance-mobile-record-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
        }

        .attendance-mobile-record-label {
          color: hsl(var(--muted-foreground));
          font-weight: 600;
          font-size: 0.75rem;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .attendance-mobile-record-value {
          min-width: 0;
          color: #1a1a1a;
          font-weight: 500;
          text-align: right;
          overflow-wrap: anywhere;
        }

        .attendance-mobile-record-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          margin-top: 0.875rem;
          padding-top: 0.875rem;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
        }

        .attendance-actions-cell {
          white-space: nowrap;
        }

        .attendance-action-buttons {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .attendance-row-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          border: none;
          background: transparent;
          color: #475569;
          transition: all 0.2s ease;
        }

        .attendance-row-action:hover {
          transform: translateY(-1px);
        }

        .attendance-row-action.edit:hover {
          color: hsl(var(--orange));
        }

        .attendance-row-action.delete:hover {
          border-color: #fca5a5;
          background: #fef2f2;
          color: #b91c1c;
        }

        @media (max-width: 768px) {
          .attendance-container {
            padding: 0;
            margin: 0;
          }
          
          .attendance-header {
            margin-bottom: 1.25rem !important;
          }

          .attendance-action-group {
            width: 100%;
          }
          
          .attendance-header h1 {
            font-size: 24px !important;
            line-height: 1.2;
          }
          
          .admin-page-shell .attendance-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.875rem !important;
            margin-bottom: 1.25rem !important;
          }

          .admin-page-shell .stat-card {
            padding: 1rem !important;
          }

          .admin-page-shell .stat-value {
            font-size: 1.75rem !important;
          }

          .admin-page-shell .stat-label {
            font-size: 0.875rem !important;
          }

          .attendance-search-container {
            width: 100% !important;
            min-width: 100% !important;
            margin-bottom: 0;
          }
          
          .attendance-search-container input {
            font-size: 16px !important;
            padding: 0.75rem 0.75rem 0.75rem 2.75rem !important;
            width: 100% !important;
          }
          
          .attendance-search-container svg {
            left: 0.875rem !important;
            width: 18px !important;
            height: 18px !important;
          }
          
          .attendance-filter-section {
            display: none !important;
          }

          .attendance-mobile-record {
            margin-bottom: 0.875rem;
          }
          
          .attendance-mobile-record-header {
            gap: 0.5rem;
          }
          
          .attendance-mobile-record-name {
            font-size: 0.9375rem;
          }
          
          .attendance-mobile-record-details {
            gap: 0.625rem;
          }

          .attendance-mobile-record-actions {
            margin-top: 0.875rem;
          }
          
          .attendance-mobile-record-row {
            font-size: 0.875rem;
          }
          
          .attendance-mobile-record-label {
            font-size: 0.75rem;
          }
          
          .attendance-table-scroll {
            max-height: calc(60vh - 1.5rem) !important;
          }

          .attendance-table-scroll::-webkit-scrollbar {
            width: 6px;
          }
          
          .attendance-empty-state {
            padding: 2rem 1rem !important;
          }
          
          .attendance-empty-state svg {
            width: 40px !important;
            height: 40px !important;
            margin-bottom: 0.75rem !important;
          }
          
          .attendance-empty-state p {
            font-size: 0.9375rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .attendance-header h1 {
            font-size: 22px !important;
          }

          .admin-page-shell .attendance-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
          }

          .admin-page-shell .stat-card {
            padding: 0.875rem !important;
          }

          .admin-page-shell .stat-value {
            font-size: 1.25rem !important;
          }

          .admin-page-shell .stat-label {
            font-size: 0.75rem !important;
          }

          .attendance-mobile-record {
            padding: 0.875rem !important;
            margin-bottom: 0.75rem !important;
          }
          
          .attendance-mobile-record-name {
            font-size: 0.875rem !important;
          }
          
          .attendance-mobile-record-row {
            font-size: 0.8125rem !important;
          }

          .attendance-action-group {
            gap: 0.5rem;
          }

          .attendance-action-btn {
            flex: 1 1 0;
            justify-content: center;
            min-width: 0;
            padding-inline: 0.875rem;
          }
        }
        
        .attendance-pagination {
          margin-top: 2rem;
          padding: 1.25rem 1.5rem;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .attendance-pagination-info {
          color: hsl(var(--muted-foreground));
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .attendance-pagination-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .attendance-pagination-page-indicator {
          color: #1a1a1a;
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0 0.5rem;
        }
        
        .attendance-pagination-button {
          padding: 0.625rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          background-color: hsl(var(--orange));
          border: 2px solid hsl(var(--orange));
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 80px;
        }
        
        .attendance-pagination-button:hover:not(:disabled) {
          background-color: hsl(var(--orange));
          color: white;
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .attendance-pagination-button:active:not(:disabled) {
          background-color: hsl(var(--orange));
          color: white;
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .attendance-pagination-button:focus:not(:disabled) {
          outline: none;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
        }
        
        .attendance-pagination-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background-color: #f5f5f5;
          color: #999;
          border-color: #e0e0e0;
        }
        
        @media (max-width: 768px) {
          .attendance-pagination {
            margin-top: 1.5rem;
            padding: 1rem;
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }
          
          .attendance-pagination-info {
            text-align: center;
            font-size: 0.8125rem;
            width: 100%;
          }
          
          .attendance-pagination-controls {
            width: 100%;
            justify-content: space-between;
            gap: 0.75rem;
          }
          
          .attendance-pagination-page-indicator {
            font-size: 0.8125rem;
            flex: 1;
            text-align: center;
          }
          
          .attendance-pagination-button {
            flex: 1;
            min-width: auto;
            padding: 0.625rem 1rem;
            font-size: 0.8125rem;
          }
        }
        
        @media (max-width: 480px) {
          .attendance-pagination {
            margin-top: 1.25rem;
            padding: 0.875rem;
          }
          
          .attendance-pagination-info {
            font-size: 0.75rem;
          }
          
          .attendance-pagination-page-indicator {
            font-size: 0.75rem;
          }
          
          .attendance-pagination-button {
            padding: 0.5rem 0.875rem;
            font-size: 0.75rem;
          }
        }
      `}</style>
      <div
        ref={attendanceContainerRef}
        className={`attendance-container admin-page-shell w-full space-y-6 ${useCardLayout ? 'attendance-card-view' : ''}`}
      >
        {/* Header */}
        <div className="attendance-header mb-8 flex justify-between items-center flex-wrap gap-4">
          <h1>Monitor Attendance</h1>
          <div className="attendance-action-group">
            <button
              onClick={handleOpenCreateModal}
              className="btn attendance-action-btn attendance-action-btn-outline"
            >
              <Plus size={16} />
              Add Manual Entry
            </button>
            <button
              onClick={handleExport}
              disabled={filteredRecords.length === 0}
              className={`btn btn-primary attendance-action-btn ${filteredRecords.length === 0 ? 'cursor-not-allowed opacity-60' : 'cursor-pointer opacity-100'}`}
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid attendance-stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-500/20">
                <CheckCircle size={20} className="text-green-600 dark:text-green-300" />
              </div>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-value">{calculatedStats.completed}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-500/20">
                <Clock size={20} className="text-amber-600 dark:text-amber-300" />
              </div>
              <span className="stat-label">Incomplete</span>
            </div>
            <div className="stat-value">{calculatedStats.incomplete}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-500/20">
                <X size={20} className="text-red-600 dark:text-red-300" />
              </div>
              <span className="stat-label">No Log</span>
            </div>
            <div className="stat-value">{calculatedStats.noLog}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-500/20">
                <BarChart size={20} className="text-blue-600 dark:text-blue-300" />
              </div>
              <span className="stat-label">AVG Hours per day</span>
            </div>
            <div className="stat-value">{calculatedStats.avgHoursPerDay?.toFixed(1) || '0.0'}</div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6">
          <div className="input-group attendance-search-container relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              className="input"
              type="text"
              placeholder="Search by name"
              value={searchTerm}
              maxLength={256}
              onChange={(e) => {
                if (scrollContainerRef.current) {
                  scrollPositionRef.current = scrollContainerRef.current.scrollTop;
                }
                setSearchTerm(e.target.value);
              }}
              style={{
                paddingLeft: '3rem',
                backgroundColor: 'white',
              }}
            />
          </div>
        </div>

        <div className={`card attendance-filter-section mb-6 ${useCardLayout ? '!hidden' : '!block'}`}>
          <div className="row attendance-filter-row gap-4 items-center flex-wrap">
            {/* Filter label */}
            <div className="row attendance-filter-label gap-2 items-center">
              <Filter size={20} className="text-muted-foreground" />
              <span className="font-semibold text-sm">Filters:</span>
            </div>

            {/* Filter dropdown */}
            <div className="attendance-filter-selects flex gap-4 flex-wrap">
              <div className="relative flex min-w-[340px] flex-[1.35] items-center gap-2 max-[1120px]:min-w-full">
                <label htmlFor="date-filter-input" className="absolute -left-[9999px] w-px h-px overflow-hidden">
                  Filter by date
                </label>
                <div style={{ width: '100%', minWidth: '190px', flex: '1 1 auto' }}>
                  <DateTimePicker
                    date={dateFilter === 'all' ? '' : dateFilter}
                    time=""
                    showTime={false}
                    datePlaceholder="Filter by date"
                    onDateChange={(value) => {
                      if (scrollContainerRef.current) {
                        scrollPositionRef.current = scrollContainerRef.current.scrollTop;
                      }
                      setDateFilter(value || 'all');
                    }}
                    onTimeChange={() => {}}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (scrollContainerRef.current) {
                      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
                    }
                    setDateFilter(dateFilter === 'all' ? todayDate : 'all');
                  }}
                  aria-label={dateFilter === 'all' ? 'Show today\'s records' : 'Show all dates'}
                  className={`shrink-0 rounded-md border-2 border-[hsl(var(--orange))] px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all ${
                    dateFilter === 'all'
                      ? 'bg-orange-50 text-[hsl(var(--orange))] hover:bg-orange-100'
                      : 'bg-white text-[hsl(var(--orange))] hover:bg-orange-50'
                  }`}
                >
                  {dateFilter === 'all' ? 'Show All Dates' : 'Clear Date'}
                </button>
              </div>

              <div className="relative min-w-[180px] flex-1">
                <DropdownSelect
                  value={statusFilter}
                  onChange={(value) => {
                    if (scrollContainerRef.current) {
                      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
                    }
                    setStatusFilter(value);
                  }}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'present', label: 'Present' },
                    { value: 'absent', label: 'Absent' },
                    { value: 'excused', label: 'Excused' },
                  ]}
                  buttonClassName="select"
                />
              </div>

              <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
                <DropdownSelect
                  value={roleFilter}
                  onChange={(value) => {
                    if (scrollContainerRef.current) {
                      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
                    }
                    setRoleFilter(value);
                  }}
                  options={[
                    { value: 'all', label: 'All Roles' },
                    { value: 'intern', label: 'Intern' },
                    { value: 'admin', label: 'Admin' },
                    { value: 'supervisor', label: 'Supervisor' },
                  ]}
                  buttonClassName="select"
                />
              </div>
            </div>
          </div>
        </div>

        <MobileFilterDrawer
          open={isFilterDrawerOpen}
          onOpen={() => setIsFilterDrawerOpen(true)}
          onClose={() => setIsFilterDrawerOpen(false)}
          bodyClassName="space-y-4"
          className={useCardLayout ? 'w-full' : 'hidden'}
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Date</label>
            <DateTimePicker
              date={dateFilter === 'all' ? '' : dateFilter}
              time=""
              showTime={false}
              datePlaceholder="Select date"
              onDateChange={(value) => setDateFilter(value || 'all')}
              onTimeChange={() => {}}
            />
            <button
              type="button"
              className={`mt-3 inline-flex rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                dateFilter === 'all'
                  ? 'border-orange-500 bg-orange-50 text-orange-600 hover:bg-orange-100'
                  : 'border-orange-200 bg-white text-orange-600 hover:bg-orange-50'
              }`}
              onClick={() => setDateFilter(dateFilter === 'all' ? todayDate : 'all')}
            >
              {dateFilter === 'all' ? 'Show All Dates' : 'Clear Date'}
            </button>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Status</label>
            <DropdownSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'present', label: 'Present' },
                { value: 'absent', label: 'Absent' },
                { value: 'excused', label: 'Excused' },
              ]}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Role</label>
            <DropdownSelect
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { value: 'all', label: 'All Roles' },
                { value: 'intern', label: 'Intern' },
                { value: 'admin', label: 'Admin' },
                { value: 'supervisor', label: 'Supervisor' },
              ]}
            />
          </div>
        </MobileFilterDrawer>

        <div>

          {/* Attendance Table - Desktop */}
          {loading ? (
            <div className="attendance-empty-state p-12 text-center text-muted-foreground">
              Loading attendance records...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="attendance-empty-state p-12 text-center">
              <UserCheck size={48} className="text-muted-foreground mb-4 inline-block" />
              <p className="text-muted-foreground text-base">
                {dateFilter === 'all'
                  ? 'No attendance records found'
                  : dateFilter === todayDate
                  ? `No attendance records found for today (${formatDate(todayDate)})`
                  : `No attendance records found for the selected date (${formatDate(dateFilter)})`}
              </p>
            </div>
          ) : (
            <>
              <div className="attendance-table-wrapper">
                <div className="attendance-table-scroll" ref={scrollContainerRef}>
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th className="w-[18%]">NAME</th>
                        <th className="w-[10%]">ROLE</th>
                        <th className="w-[11%]">DATE</th>
                        <th className="w-[13%]">TIME IN</th>
                        <th className="w-[13%]">TIME OUT</th>
                        <th className="w-[15%]">TOTAL HOURS</th>
                        <th className="w-[12%]">STATUS</th>
                        <th className="w-[8%]">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRecords.map((record, index) => (
                        <tr key={`${record.id}-${record.date}-${index}`}>
                          <td className="w-[18%] attendance-name-cell">
                            <strong>{record.user?.full_name || 'Unknown User'}</strong>
                          </td>
                          <td className="w-[10%]">{getRoleBadge(record.user?.role)}</td>
                          <td className="w-[11%]">{formatDate(record.date)}</td>
                          <td className="w-[13%]">{formatTime(record.time_in)}</td>
                          <td className="w-[13%]">{formatTime(record.time_out)}</td>
                          <td className="w-[15%]">{formatHours(record.total_hours)}</td>
                          <td className="w-[12%]">{getStatusBadge(record.status)}</td>
                          <td className="w-[8%] attendance-actions-cell">
                            <div className="attendance-action-buttons">
                              <button
                                type="button"
                                className="attendance-row-action edit"
                                onClick={() => handleOpenEditModal(record)}
                                title="Edit"
                                aria-label={`Edit attendance for ${record.user?.full_name ?? 'user'}`}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                className="attendance-row-action delete"
                                onClick={() => handleDeleteRecord(record)}
                                title="Delete"
                                aria-label={`Delete attendance for ${record.user?.full_name ?? 'user'}`}
                              >
                                <Trash size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="attendance-mobile-card">
                {paginatedRecords.map((record, index) => (
                  <div key={`${record.id}-${record.date}-${index}`} className="attendance-mobile-record">
                    <div className="attendance-mobile-record-header">
                      <div className="attendance-mobile-record-name">{record.user.full_name}</div>
                      <div>{getStatusBadge(record.status)}</div>
                    </div>
                    <div className="attendance-mobile-record-details">
                      <div className="attendance-mobile-record-row">
                        <span className="attendance-mobile-record-label">Role</span>
                        <span className="attendance-mobile-record-value">{getRoleBadge(record.user?.role)}</span>
                      </div>
                      <div className="attendance-mobile-record-row">
                        <span className="attendance-mobile-record-label">Date</span>
                        <span className="attendance-mobile-record-value">{formatDate(record.date)}</span>
                      </div>
                      <div className="attendance-mobile-record-row">
                        <span className="attendance-mobile-record-label">Time In</span>
                        <span className="attendance-mobile-record-value">{formatTime(record.time_in)}</span>
                      </div>
                      <div className="attendance-mobile-record-row">
                        <span className="attendance-mobile-record-label">Time Out</span>
                        <span className="attendance-mobile-record-value">{formatTime(record.time_out)}</span>
                      </div>
                      <div className="attendance-mobile-record-row">
                        <span className="attendance-mobile-record-label">Total Hours</span>
                        <span className="attendance-mobile-record-value">{formatHours(record.total_hours)}</span>
                      </div>
                      <div className="attendance-mobile-record-actions">
                        <button
                          type="button"
                          className="attendance-row-action edit"
                          onClick={() => handleOpenEditModal(record)}
                          title="Edit"
                          aria-label={`Edit attendance for ${record.user?.full_name ?? 'user'}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="attendance-row-action delete"
                          onClick={() => handleDeleteRecord(record)}
                          title="Delete"
                          aria-label={`Delete attendance for ${record.user?.full_name ?? 'user'}`}
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Component */}
              {totalRecords > 0 && (
                <div className="attendance-pagination">
                  <div className="attendance-pagination-info">
                    Showing {startIndex + 1}–{Math.min(endIndex, totalRecords)} of {totalRecords} records
                  </div>
                  <div className="attendance-pagination-controls">
                    <button
                      className="attendance-pagination-button attendance-pagination-prev"
                      onClick={handlePrevPage}
                      disabled={safeCurrentPage === 1}
                      aria-label="Previous page"
                    >
                      Prev
                    </button>
                    <div className="attendance-pagination-page-indicator">
                      Page {safeCurrentPage} of {totalPages}
                    </div>
                    <button
                      className="attendance-pagination-button attendance-pagination-next"
                      onClick={handleNextPage}
                      disabled={safeCurrentPage === totalPages}
                      aria-label="Next page"
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

      {/* Manual Entry Modal */}
      {isManualEntryOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-8 w-full max-w-[500px] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] overflow-visible">
            <h2 className="text-xl font-bold mb-6 text-slate-900">{editingRecordId !== null ? 'Edit Attendance Entry' : 'Add Manual Entry'}</h2>
            {submitError && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md text-sm">{submitError}</div>}
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
              
              {editingRecordId !== null ? (
                <div>
                  <label className="block text-sm font-medium mb-2">Intern</label>
                  <div className="select flex w-full items-center rounded-[1.15rem] border border-gray-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                    {editingInternName || selectedManualIntern?.full_name || manualInternQuery || 'Selected intern'}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">Intern</label>
                  <div ref={manualInternRef} className={`relative ${manualInternOpen ? 'z-[160]' : 'z-10'}`}>
                    <button
                      type="button"
                      onClick={() => setManualInternOpen((prev) => !prev)}
                      role="combobox"
                      aria-expanded={manualInternOpen}
                      aria-controls={manualInternListId}
                      aria-haspopup="listbox"
                      className="dropdown-select-button select flex w-full items-center justify-between rounded-[1.15rem] border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 outline-none transition-all duration-200 focus:border-[hsl(var(--orange))] focus:ring-2 focus:ring-[hsl(var(--orange))]/20"
                    >
                      <span className={selectedManualIntern ? 'text-slate-900' : 'text-slate-400'}>
                        {selectedManualIntern?.full_name || 'Select an intern...'}
                      </span>
                      <ChevronDown size={18} className={`ml-2 shrink-0 text-slate-500 transition-transform ${manualInternOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {manualInternOpen && (
                      <div className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-20 overflow-hidden rounded-[1.15rem] border border-gray-200 bg-white shadow-[0_24px_55px_-24px_rgba(15,23,42,0.35)]">
                        <div className="border-b border-gray-100 p-3">
                          <div className="relative">
                            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={manualInternQuery}
                              onChange={(e) => {
                                setManualInternQuery(e.target.value);
                                if (!manualInternOpen) setManualInternOpen(true);
                              }}
                              placeholder="Search intern"
                              role="searchbox"
                              aria-controls={manualInternListId}
                              className="input w-full pl-11"
                              style={{ paddingLeft: '2.75rem' }}
                              autoFocus
                            />
                          </div>
                        </div>

                        <div
                          id={manualInternListId}
                          role="listbox"
                          className={`${manualInternHasScrollableList ? 'max-h-60 overflow-y-auto' : 'overflow-y-visible'} p-2`}
                        >
                          {filteredManualInterns.length === 0 ? (
                            <div className="rounded-xl px-4 py-3 text-sm text-slate-500">
                              No interns found.
                            </div>
                          ) : (
                            filteredManualInterns.map((intern) => {
                              const isSelected = String(intern.id) === manualEntryForm.user_id;
                              return (
                                <button
                                  key={intern.id}
                                  type="button"
                                  role="option"
                                  aria-selected={isSelected}
                                  onClick={() => {
                                    setManualEntryForm({ ...manualEntryForm, user_id: String(intern.id) });
                                    setManualInternQuery(intern.full_name);
                                    setManualInternOpen(false);
                                  }}
                                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                                    isSelected
                                      ? 'bg-[hsl(var(--orange))] text-white'
                                      : 'text-slate-700 hover:bg-orange-50'
                                  }`}
                                >
                                  <span className="truncate text-left">{intern.full_name}</span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <DateTimePicker
                  date={manualEntryForm.date}
                  time=""
                  showTime={false}
                  datePlaceholder="Select date"
                  onDateChange={(value) => setManualEntryForm({ ...manualEntryForm, date: value })}
                  onTimeChange={() => {}}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Time In</label>
                  <input 
                    type="time" 
                    step="1"
                    className="input" 
                    value={manualEntryForm.time_in} 
                    onChange={e => setManualEntryForm({...manualEntryForm, time_in: e.target.value})}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time Out (Optional)</label>
                  <input 
                    type="time" 
                    step="1"
                    className="input" 
                    value={manualEntryForm.time_out} 
                    onChange={e => setManualEntryForm({...manualEntryForm, time_out: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <DropdownSelect
                  value={manualEntryForm.status}
                  onChange={(value) => setManualEntryForm({ ...manualEntryForm, status: value })}
                  options={[
                    { value: 'present', label: 'Present' },
                    { value: 'absent', label: 'Absent' },
                    { value: 'excused', label: 'Excused' },
                  ]}
                  buttonClassName="select"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleCloseManualModal}
                  className="px-4 py-2 rounded-md border border-slate-300 bg-white font-medium cursor-pointer"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md border-none bg-[hsl(var(--orange))] text-white font-medium cursor-pointer"
                  style={{ opacity: submitting ? 0.7 : 1 }}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingRecordId !== null ? 'Save Changes' : 'Save Entry'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </ModalPortal>
      )}

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        title="Delete Attendance Record"
        message={deleteTarget
          ? `Are you sure you want to delete the attendance record for ${deleteTarget.user?.full_name ?? 'this user'} on ${formatDate(deleteTarget.date)}?`
          : ''}
        note="This action cannot be undone."
        confirmLabel="Delete"
        loadingLabel="Deleting..."
        variant="danger"
        isLoading={deleting}
        onCancel={handleCancelDelete}
        onConfirm={confirmDeleteRecord}
      />
    </>
  );
};

export default MonitorAttendance;
