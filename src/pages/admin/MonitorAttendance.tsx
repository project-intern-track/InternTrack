import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { UserCheck, Search, Filter, ChevronDown } from 'lucide-react';
import { attendanceService } from '../../services/attendanceServices';
import type { Attendance } from '../../types/database.types';
import '../../index.css';

interface AttendanceRecord extends Omit<Attendance, 'id'> {
  id: string | number; // Laravel ids are numbers, but we often treat as string in frontend
  user: {
    full_name: string;
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
  const [dateFilter, setDateFilter] = useState(todayDate);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

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
      
      //show all records
      const matchesDate = dateFilter === 'all' || record.date.trim() === dateFilter.trim();

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [uniqueRecords, searchTerm, statusFilter, dateFilter]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter]);

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
    // If it's just "HH:mm"
    if (timeString.length === 5) {
      const [h, m] = timeString.split(':');
      const hours = parseInt(h, 10);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${m} ${ampm}`;
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

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
      case 'completed':
        return <span className="badge badge-success" style={{ padding: '4px 8px', borderRadius: '4px', background: '#dcfce7', color: '#166534', fontWeight: 600, fontSize: '0.75rem', textTransform: 'capitalize' }}>Present</span>;
      case 'late':
      case 'incomplete':
        return <span className="badge badge-warning" style={{ padding: '4px 8px', borderRadius: '4px', background: '#fef08a', color: '#854d0e', fontWeight: 600, fontSize: '0.75rem', textTransform: 'capitalize' }}>Late</span>;
      case 'absent':
      case 'no_log':
        return <span className="badge badge-danger" style={{ padding: '4px 8px', borderRadius: '4px', background: '#fee2e2', color: '#991b1b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'capitalize' }}>Absent</span>;
      case 'excused':
        return <span className="badge badge-info" style={{ padding: '4px 8px', borderRadius: '4px', background: '#e0f2fe', color: '#075985', fontWeight: 600, fontSize: '0.75rem', textTransform: 'capitalize' }}>Excused</span>;
      default:
        return <span className="badge" style={{ padding: '4px 8px', borderRadius: '4px', background: '#f3f4f6', color: '#374151', fontWeight: 600, fontSize: '0.75rem', textTransform: 'capitalize' }}>{status}</span>;
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
          
          .attendance-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.875rem !important;
            margin-bottom: 1.25rem !important;
          }
          
          .stat-card {
            padding: 1rem !important;
          }
          
          .stat-value {
            font-size: 1.75rem !important;
          }
          
          .stat-label {
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
            padding: 1rem !important;
            margin-bottom: 1.25rem !important;
          }
          
          .attendance-filter-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.875rem !important;
          }
          
          .attendance-filter-label {
            margin-bottom: 0;
            justify-content: flex-start;
          }
          
          .attendance-filter-label span {
            font-size: 0.875rem !important;
          }
          
          .attendance-filter-selects {
            width: 100% !important;
            min-width: 100% !important;
            flex-direction: column !important;
            gap: 0.875rem !important;
          }
          
          .attendance-filter-selects > div {
            width: 100% !important;
            min-width: 100% !important;
            flex-direction: column !important;
            display: flex !important;
            gap: 0.75rem !important;
          }
          
          .attendance-filter-selects select {
            width: 100% !important;
            min-width: 100% !important;
            font-size: 16px !important;
            padding: 0.75rem 2.5rem 0.75rem 0.875rem !important;
          }
          
          .attendance-filter-selects input[type="date"] {
            width: 100% !important;
            min-width: 100% !important;
            font-size: 16px !important;
            padding: 0.75rem !important;
            flex: none !important;
          }
          
          .attendance-filter-selects button {
            width: 100% !important;
            padding: 0.75rem 1rem !important;
            font-size: 0.875rem !important;
            flex: none !important;
            white-space: normal !important;
            word-wrap: break-word !important;
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
          
          .attendance-stats-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
          
          .stat-card {
            padding: 0.875rem !important;
          }
          
          .stat-value {
            font-size: 1.5rem !important;
          }
          
          .attendance-filter-section {
            padding: 0.875rem !important;
          }
          
          .attendance-filter-selects input[type="date"] {
            font-size: 16px !important;
            padding: 0.625rem !important;
          }
          
          .attendance-filter-selects button {
            font-size: 0.8125rem !important;
            padding: 0.625rem 0.875rem !important;
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
      <div className="attendance-container">
        {/* Header */}
        <div className="attendance-header" style={{ marginBottom: '2rem' }}>
          <h1>Monitor Attendance</h1>
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
        <div className="card attendance-filter-section" style={{ marginBottom: '1.5rem' }}>
          <div className="row attendance-filter-row" style={{ gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Bar */}
            <div className="input-group attendance-search-container" style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
              <Search
                size={20}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'hsl(var(--muted-foreground))',
                  pointerEvents: 'none',
                }}
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
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: 'white',
                }}
              />
            </div>

            {/* Filter label */}
            <div className="row attendance-filter-label" style={{ gap: '0.5rem', alignItems: 'center' }}>
              <Filter size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Filters:</span>
            </div>

            {/* Filter dropdown */}
            <div className="attendance-filter-selects" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '200px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label htmlFor="date-filter-input" style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
                  Filter by date
                </label>
                <input
                  id="date-filter-input"
                  type="date"
                  className="input"
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
                  style={{ 
                    width: '100%', 
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
                  style={{
                    padding: '0.625rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: dateFilter === 'all' ? 'white' : 'hsl(var(--orange))',
                    backgroundColor: dateFilter === 'all' ? 'hsl(var(--orange))' : 'white',
                    border: `2px solid hsl(var(--orange))`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
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

              <div style={{ position: 'relative', flex: '1', minWidth: '150px' }}>
                <select
                  className="select"
                  value={statusFilter}
                  onChange={(e) => {
                    if (scrollContainerRef.current) {
                      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
                    }
                    setStatusFilter(e.target.value);
                  }}
                  style={{ width: '100%', backgroundColor: 'white', paddingRight: '2.5rem' }}
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                  <option value="excused">Excused</option>
                </select>
                <ChevronDown
                  size={16}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: 'hsl(var(--muted-foreground))',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          
          {/* Attendance Table - Desktop */}
          {loading ? (
            <div className="attendance-empty-state" style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
              Loading attendance records...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="attendance-empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
              <UserCheck size={48} style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '1rem' }} />
              <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1rem' }}>
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
                      <th style={{ width: '20%' }}>NAME</th>
                      <th style={{ width: '12%' }}>DATE</th>
                      <th style={{ width: '15%' }}>TIME IN</th>
                      <th style={{ width: '15%' }}>TIME OUT</th>
                      <th style={{ width: '18%' }}>TOTAL HOURS</th>
                      <th style={{ width: '20%' }}>STATUS</th>
                    </tr>
                  </thead>
                </table>
                
                {/* Scrollable Body */}
                <div className="attendance-table-body-wrapper" ref={scrollContainerRef}>
                  <table className="attendance-table-body">
                    <tbody>
                      {paginatedRecords.map((record, index) => (
                        <tr key={`${record.id}-${record.date}-${index}`}>
                          <td style={{ width: '20%' }}>
                            <strong>{record.user?.full_name || 'Unknown User'}</strong>
                          </td>
                          <td style={{ width: '12%' }}>{formatDate(record.date)}</td>
                          <td style={{ width: '15%' }}>{formatTime(record.time_in)}</td>
                          <td style={{ width: '15%' }}>{formatTime(record.time_out)}</td>
                          <td style={{ width: '18%' }}>{formatHours(record.total_hours)}</td>
                          <td style={{ width: '20%' }}>{getStatusBadge(record.status)}</td>
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
    </>
  );
};

export default MonitorAttendance;
