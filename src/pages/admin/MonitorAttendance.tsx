import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { UserCheck, Search, Filter, Download, Plus, X } from 'lucide-react';
import { attendanceService } from '../../services/attendanceServices';
import { userService } from '../../services/userServices';
import type { Attendance, Users } from '../../types/database.types';
import '../../index.css';
import DropdownSelect from '../../components/DropdownSelect';

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Manual Entry State
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [interns, setInterns] = useState<Users[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [manualEntryForm, setManualEntryForm] = useState({
    user_id: '',
    date: todayDate,
    time_in: '',
    time_out: '',
    status: 'present'
  });

  useEffect(() => {
    if (isManualEntryOpen && interns.length === 0) {
      userService.fetchInterns().then(setInterns).catch(console.error);
    }
  }, [isManualEntryOpen, interns.length]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setSubmitError(null);
      await attendanceService.store(manualEntryForm as any);
      setIsManualEntryOpen(false);
      // Refresh attendances
      const records = await attendanceService.getAttendance();
      setAttendanceRecords(records as unknown as AttendanceRecord[]);
      setManualEntryForm({
         user_id: '', date: todayDate, time_in: '', time_out: '', status: 'present'
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit entry');
    } finally {
      setSubmitting(false);
    }
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
      r.status
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

      const matchesStatus = statusFilter === 'all' || record.status.toLowerCase() === statusFilter.toLowerCase();

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
    incomplete: stats?.incomplete ?? attendanceRecords.filter((r) => r.status === 'late').length,
    noLog: stats?.noLog ?? attendanceRecords.filter((r) => r.status === 'absent').length,
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

  const getStatusBadge = (status: string) => {    switch (status.toLowerCase()) {
      case 'present':
      case 'completed':
        return <span className="badge badge-success px-2 py-1 rounded bg-green-100 text-green-800 font-semibold text-xs capitalize">Present</span>;
      case 'late':
      case 'incomplete':
        return <span className="badge badge-warning px-2 py-1 rounded bg-yellow-200 text-yellow-900 font-semibold text-xs capitalize">Late</span>;
      case 'absent':
      case 'no_log':
        return <span className="badge badge-danger px-2 py-1 rounded bg-red-100 text-red-800 font-semibold text-xs capitalize">Absent</span>;
      case 'excused':
        return <span className="badge badge-info px-2 py-1 rounded bg-sky-100 text-sky-900 font-semibold text-xs capitalize">Excused</span>;
      default:
        return <span className="badge px-2 py-1 rounded bg-slate-100 text-slate-700 font-semibold text-xs capitalize">{status}</span>;
    }
  };

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
        }
        
        .attendance-table-wrapper {
          width: 100%;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .attendance-table-header {
          width: 100%;
          table-layout: fixed;
          border-collapse: separate;
          border-spacing: 0;
          background-color: hsl(var(--orange));
        }
        
        .attendance-table-header th {
          text-align: center;
          padding: 1rem;
          font-weight: 600;
          color: white;
          background-color: hsl(var(--orange));
        }
        
        .attendance-table-header th:first-child {
          border-top-left-radius: 8px;
        }
        
        .attendance-table-header th:last-child {
          border-top-right-radius: 8px;
        }
        
        .attendance-table-body-wrapper {
          overflow-y: auto;
          overflow-x: auto;
          max-height: calc(70vh - 2rem);
          width: 100%;
        }
        
        .attendance-table-body-wrapper::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .attendance-table-body-wrapper::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        .attendance-table-body-wrapper::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        .attendance-table-body-wrapper::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        .attendance-table-body {
          width: 100%;
          table-layout: fixed;
          border-collapse: separate;
          border-spacing: 0;
          background-color: white;
        }
        
        .attendance-table-body td {
          text-align: center;
          padding: 0.875rem 1rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          vertical-align: middle;
        }
        
        .attendance-table-body td strong {
          display: inline-block;
          text-align: center;
        }
        
        .attendance-table-body td .badge {
          display: inline-block;
          margin: 0 auto;
        }
        
        .attendance-table-body tr {
          background-color: white;
        }
        
        .attendance-table-body tr:hover {
          background-color: #f5f5f5;
        }
        
        .attendance-table-body tr:last-child td {
          border-bottom: none;
        }
        
        .attendance-mobile-card {
          display: none;
        }

        .attendance-mobile-filter-btn {
          display: none;
        }

        .attendance-filter-drawer-overlay {
          display: none;
        }
        
        @media (max-width: 768px) {
          .attendance-container {
            padding: 0;
            margin: 0;
          }
          
          .attendance-header {
            margin-bottom: 1.25rem !important;
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

          .attendance-mobile-filter-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.625rem 1rem;
            background-color: #e9e6e1;
            border: 1px solid #ccc;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.875rem;
            cursor: pointer;
            margin-bottom: 1.25rem;
            width: 100%;
            justify-content: center;
          }

          .attendance-filter-drawer-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 35;
          }

          .attendance-filter-drawer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            border-radius: 16px 16px 0 0;
            padding: 1.5rem;
            z-index: 36;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
          }

          .attendance-filter-drawer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.25rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid #e5e5e5;
          }

          .attendance-filter-drawer-header h3 {
            font-size: 1.125rem;
            font-weight: 700;
            margin: 0;
            color: #1a1a1a;
          }

          .attendance-filter-drawer-close {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.25rem;
            color: #666;
          }

          .attendance-filter-drawer-body {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .attendance-filter-drawer-body label {
            display: block;
            font-size: 0.8125rem;
            font-weight: 600;
            margin-bottom: 0.375rem;
            color: #555;
          }

          .attendance-filter-drawer-body input,
          .attendance-filter-drawer-body select {
            width: 100% !important;
            font-size: 16px !important;
            padding: 0.75rem !important;
            border-radius: 8px;
            border: 1px solid #ddd;
            box-sizing: border-box;
          }

          .attendance-filter-drawer-body button.drawer-date-toggle {
            width: 100%;
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
            font-weight: 500;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .attendance-table-wrapper {
            display: none !important;
          }
          
          .attendance-mobile-card {
            display: block;
          }
          
          .attendance-mobile-record {
            background: white;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 0.875rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(0, 0, 0, 0.05);
          }
          
          .attendance-mobile-record-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.75rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          }
          
          .attendance-mobile-record-name {
            font-weight: 600;
            font-size: 0.9375rem;
            color: #1a1a1a;
            flex: 1;
            margin-right: 0.5rem;
          }
          
          .attendance-mobile-record-details {
            display: grid;
            gap: 0.625rem;
          }
          
          .attendance-mobile-record-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.875rem;
          }
          
          .attendance-mobile-record-label {
            color: hsl(var(--muted-foreground));
            font-weight: 500;
          }
          
          .attendance-mobile-record-value {
            color: #1a1a1a;
            font-weight: 500;
            text-align: right;
          }
          
          .attendance-table-body-wrapper {
            max-height: calc(60vh - 1.5rem) !important;
          }
          
          .attendance-table-body-wrapper::-webkit-scrollbar {
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
      <div className="attendance-container admin-page-shell">
        {/* Header */}
        <div className="attendance-header mb-8 flex justify-between items-center flex-wrap gap-4">
          <h1>Monitor Attendance</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setIsManualEntryOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-[hsl(var(--orange))] border-2 border-[hsl(var(--orange))] rounded-lg font-semibold cursor-pointer transition-all"
            >
              <Plus size={18} />
              Add Manual Entry
            </button>
            <button
              onClick={handleExport}
              disabled={filteredRecords.length === 0}
              className={`flex items-center gap-2 px-4 py-2.5 bg-[hsl(var(--orange))] text-white border-none rounded-lg font-semibold transition-all ${filteredRecords.length === 0 ? 'cursor-not-allowed opacity-60' : 'cursor-pointer opacity-100'}`}
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid attendance-stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-value">{calculatedStats.completed}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Incomplete</span>
            </div>
            <div className="stat-value">{calculatedStats.incomplete}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">No Log</span>
            </div>
            <div className="stat-value">{calculatedStats.noLog}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">AVG Hours per day</span>
            </div>
            <div className="stat-value">{calculatedStats.avgHoursPerDay?.toFixed(1) || '0.0'}</div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="card attendance-filter-section mb-6">
          <div className="row attendance-filter-row gap-4 items-center flex-wrap">
            {/* Search Bar */}
            <div className="input-group attendance-search-container relative flex-1 min-w-[200px]">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                className="input"
                type="text"
                placeholder="Search by name"
                value={searchTerm}
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

            {/* Filter label */}
            <div className="row attendance-filter-label gap-2 items-center">
              <Filter size={20} className="text-muted-foreground" />
              <span className="font-semibold text-sm">Filters:</span>
            </div>

            {/* Filter dropdown */}
            <div className="attendance-filter-selects flex gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px] flex gap-2 items-center">
                <label htmlFor="date-filter-input" className="absolute -left-[9999px] w-px h-px overflow-hidden">
                  Filter by date
                </label>
                <input
                  id="date-filter-input"
                  type="date"
                  value={dateFilter === 'all' ? '' : dateFilter}
                  onChange={(e) => {
                    if (scrollContainerRef.current) {
                      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
                    }
                    setDateFilter(e.target.value || 'all');
                  }}
                  disabled={dateFilter === 'all'}
                  aria-label="Select date to filter attendance records"
                  aria-disabled={dateFilter === 'all'}
                  className="input"
                  style={{
                    width: '100%',
                    minWidth: '0',
                    backgroundColor: dateFilter === 'all' ? '#f5f5f5' : 'white',
                    cursor: dateFilter === 'all' ? 'not-allowed' : 'text',
                    flex: '1'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (scrollContainerRef.current) {
                      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
                    }
                    setDateFilter(dateFilter === 'all' ? todayDate : 'all');
                  }}
                  aria-label={dateFilter === 'all' ? 'Show today\'s records' : 'Show all dates'}
                  className={`px-4 py-2.5 text-sm font-medium border-2 border-[hsl(var(--orange))] rounded-md cursor-pointer transition-all whitespace-nowrap ${dateFilter === 'all' ? 'text-white bg-[hsl(var(--orange))]' : 'text-[hsl(var(--orange))] bg-white'}`}
                  onMouseEnter={(e) => {
                    if (dateFilter !== 'all') {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (dateFilter !== 'all') {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  {dateFilter === 'all' ? 'Show All Dates' : 'Clear Date'}
                </button>
              </div>

              <div className="relative flex-1 min-w-[150px]">
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
                    { value: 'late', label: 'Late' },
                    { value: 'absent', label: 'Absent' },
                    { value: 'excused', label: 'Excused' },
                  ]}
                  buttonClassName="select"
                />
              </div>

              <div style={{ position: 'relative', flex: '1', minWidth: '130px' }}>
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

        {/* Mobile Filter Button — visible only on mobile via CSS */}
        <button
          className="attendance-mobile-filter-btn"
          onClick={() => setIsFilterDrawerOpen(true)}
        >
          <Filter size={18} />
          Filters
        </button>

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
                {/* Fixed Header */}
                <table className="attendance-table-header">
                  <thead>
                    <tr>
                      <th className="w-[18%]">NAME</th>
                      <th className="w-[10%]">ROLE</th>
                      <th className="w-[11%]">DATE</th>
                      <th className="w-[13%]">TIME IN</th>
                      <th className="w-[13%]">TIME OUT</th>
                      <th className="w-[15%]">TOTAL HOURS</th>
                      <th className="w-[20%]">STATUS</th>
                    </tr>
                  </thead>
                </table>
                
                {/* Scrollable Body */}
                <div className="attendance-table-body-wrapper" ref={scrollContainerRef}>
                  <table className="attendance-table-body">
                    <tbody>
                      {paginatedRecords.map((record, index) => (
                        <tr key={`${record.id}-${record.date}-${index}`}>
                          <td className="w-[18%]">
                            <strong>{record.user?.full_name || 'Unknown User'}</strong>
                          </td>
                          <td className="w-[10%]">{getRoleBadge(record.user?.role)}</td>
                          <td className="w-[11%]">{formatDate(record.date)}</td>
                          <td className="w-[13%]">{formatTime(record.time_in)}</td>
                          <td className="w-[13%]">{formatTime(record.time_out)}</td>
                          <td className="w-[15%]">{formatHours(record.total_hours)}</td>
                          <td className="w-[20%]">{getStatusBadge(record.status)}</td>
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

      {/* Mobile Filter Drawer */}
      {isFilterDrawerOpen && (
        <div className="attendance-filter-drawer-overlay" onClick={() => setIsFilterDrawerOpen(false)}>
          <div className="attendance-filter-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="attendance-filter-drawer-header">
              <h3>Filters</h3>
              <button className="attendance-filter-drawer-close" onClick={() => setIsFilterDrawerOpen(false)}>
                <X size={22} />
              </button>
            </div>
            <div className="attendance-filter-drawer-body">
              {/* Search */}
              <div>
                <label>Search by name</label>
                <input
                  type="text"
                  placeholder="Search by name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Date */}
              <div>
                <label>Date</label>
                <input
                  type="date"
                  value={dateFilter === 'all' ? '' : dateFilter}
                  onChange={(e) => setDateFilter(e.target.value || 'all')}
                  disabled={dateFilter === 'all'}
                  style={{
                    backgroundColor: dateFilter === 'all' ? '#f5f5f5' : 'white',
                    cursor: dateFilter === 'all' ? 'not-allowed' : 'text',
                  }}
                />
                <button
                  type="button"
                  className="drawer-date-toggle"
                  onClick={() => setDateFilter(dateFilter === 'all' ? todayDate : 'all')}
                  style={{
                    marginTop: '0.5rem',
                    color: dateFilter === 'all' ? 'white' : 'hsl(var(--orange))',
                    backgroundColor: dateFilter === 'all' ? 'hsl(var(--orange))' : 'white',
                    border: '2px solid hsl(var(--orange))',
                  }}
                >
                  {dateFilter === 'all' ? 'Show All Dates' : 'Clear Date'}
                </button>
              </div>

              {/* Status */}
              <div>
                <label>Status</label>
                <DropdownSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'present', label: 'Present' },
                    { value: 'late', label: 'Late' },
                    { value: 'absent', label: 'Absent' },
                    { value: 'excused', label: 'Excused' },
                  ]}
                />
              </div>

              {/* Role */}
              <div>
                <label>Role</label>
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
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {isManualEntryOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-[500px] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 text-slate-900">Add Manual Entry</h2>
            {submitError && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md text-sm">{submitError}</div>}
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
              
              <div>
                <label className="block text-sm font-medium mb-2">Intern</label>
                <DropdownSelect
                  value={manualEntryForm.user_id}
                  onChange={(value) => setManualEntryForm({ ...manualEntryForm, user_id: value })}
                  options={[
                    { value: '', label: 'Select an intern...' },
                    ...interns.map((intern) => ({ value: String(intern.id), label: intern.full_name })),
                  ]}
                  buttonClassName="select"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input 
                  type="date" 
                  className="input" 
                  value={manualEntryForm.date} 
                  onChange={e => setManualEntryForm({...manualEntryForm, date: e.target.value})}
                  required
                  style={{ width: '100%' }}
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
                    { value: 'late', label: 'Late' },
                    { value: 'absent', label: 'Absent' },
                    { value: 'excused', label: 'Excused' },
                  ]}
                  buttonClassName="select"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsManualEntryOpen(false)}
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
                  {submitting ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default MonitorAttendance;
