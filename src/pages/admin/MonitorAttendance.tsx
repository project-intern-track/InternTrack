import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { UserCheck, Search, Filter, ChevronDown } from 'lucide-react';
import '../../index.css';

interface AttendanceRecord {
  id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  rendered_hours: number | null;
  credited_hours: number | null;
  status: string;
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
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // sample
  useEffect(() => {
    setLoading(true);
    // simulate
    setTimeout(() => {
      const sampleData: AttendanceRecord[] = [
        {
          id: '1',
          date: '2026-02-09',
          time_in: null,
          time_out: null,
          rendered_hours: null,
          credited_hours: null,
          status: 'no_log',
          user: { full_name: 'Yuan Crispino' },
        },
        {
          id: '2',
          date: '2026-02-14',
          time_in: '2026-02-09T08:00:00',
          time_out: '2026-02-09T18:00:00',
          rendered_hours: 9,
          credited_hours: 8,
          status: 'completed',
          user: { full_name: 'Maria Letuzawa' },
        },
        {
          id: '3',
          date: '2026-02-09',
          time_in: '2026-02-09T08:00:00',
          time_out: '2026-02-09T18:00:00',
          rendered_hours: 9,
          credited_hours: 8,
          status: 'completed',
          user: { full_name: 'John Jones' },
        },
        {
          id: '4',
          date: '2026-02-09',
          time_in: '2026-02-09T08:00:00',
          time_out: '2026-02-09T18:00:00',
          rendered_hours: 9,
          credited_hours: 8,
          status: 'completed',
          user: { full_name: 'Sarah Geronimo' },
        },
        {
          id: '5',
          date: '2026-02-09',
          time_in: '2026-02-09T08:00:00',
          time_out: '2026-02-09T18:00:00',
          rendered_hours: 9,
          credited_hours: 8,
          status: 'completed',
          user: { full_name: 'Michael Jordan' },
        },
        {
            id: '6',
            date: '2026-02-09',
            time_in: '2026-02-09T08:00:00',
            time_out: '2026-02-09T18:00:00',
            rendered_hours: 9,
            credited_hours: 8,
            status: 'completed',
            user: { full_name: 'Alex Honnold' },
          },
          {
            id: '7',
            date: '2026-02-09',
            time_in: '2026-02-09T08:00:00',
            time_out: '2026-02-09T18:00:00',
            rendered_hours: 9,
            credited_hours: 8,
            status: 'completed',
            user: { full_name: 'Lebron James' },
          },
          {
            id: '8',
            date: '2026-02-09',
            time_in: '2026-02-09T08:00:00',
            time_out: '2026-02-09T18:00:00',
            rendered_hours: 9,
            credited_hours: 8,
            status: 'completed',
            user: { full_name: 'Kween Yasmin' },
          },
          {
            id: '9',
            date: '2026-02-09',
            time_in: '2026-02-09T08:00:00',
            time_out: '2026-02-09T18:00:00',
            rendered_hours: 9,
            credited_hours: 8,
            status: 'completed',
            user: { full_name: 'Diwata Pares' },
          },
          {
            id: '10',
            date: '2026-02-09',
            time_in: '2026-02-09T08:00:00',
            time_out: '2026-02-09T18:00:00',
            rendered_hours: 9,
            credited_hours: 8,
            status: 'completed',
            user: { full_name: 'Mang Oka' },
          },
          {
            id: '11',
            date: '2026-02-09',
            time_in: '2026-02-09T08:00:00',
            time_out: '2026-02-09T18:00:00',
            rendered_hours: 9,
            credited_hours: 8,
            status: 'completed',
            user: { full_name: 'Bronny James' },
          },
          {
            id: '1',
            date: '2026-02-09',
            time_in: '2026-02-09T08:00:00',
            time_out: '2026-02-09T18:00:00',
            rendered_hours: 9,
            credited_hours: 8,
            status: 'completed',
            user: { full_name: 'Poison 13' },
          },
          {
            id: '12',
            date: '2026-02-09',
            time_in: '2026-02-09T08:00:00',
            time_out: '2026-02-09T18:00:00',
            rendered_hours: 9,
            credited_hours: 8,
            status: 'completed',
            user: { full_name: 'Lanzeta Round3' },
          },
          {
            id: '13',
            date: '2026-02-09',
            time_in: '2026-02-09T08:00:00',
            time_out: '2026-02-09T18:00:00',
            rendered_hours: 9,
            credited_hours: 8,
            status: 'completed',
            user: { full_name: 'Dwayne Wade' },
          },
      ];
      setAttendanceRecords(sampleData);
      setLoading(false);
    }, 500);
  }, []);

 
  const uniqueDates = Array.from(new Set(attendanceRecords.map((r) => r.date)))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Sort descending (newest first)

  //filter record
  const seenKeys = new Set<string>();
  const uniqueRecords = attendanceRecords.filter((record) => {
    const key = `${record.id}-${record.date}`;
    if (seenKeys.has(key)) {
      return false; // Skip duplicate
    }
    seenKeys.add(key);
    return true;
  });

  const filteredRecords = uniqueRecords.filter((record) => {

    const searchTermLower = searchTerm.trim().toLowerCase();
    const matchesSearch = searchTermLower === '' || record.user.full_name.toLowerCase().includes(searchTermLower);
    
    const matchesStatus = statusFilter === 'all' || record.status.toLowerCase() === statusFilter.toLowerCase();
    
    // Date filter
    const matchesDate = dateFilter === 'all' || record.date.trim() === dateFilter.trim();

    // All filters must match
    return matchesSearch && matchesStatus && matchesDate;
  });

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
  const completedRecords = attendanceRecords.filter((r) => r.status === 'completed');
  const totalCreditedHours = completedRecords.reduce((sum, r) => sum + (r.credited_hours || 0), 0);
  const completedRecordsCount = completedRecords.length;
  // Average hours per day = total credited hours ÷ number of completed records (each record = one person-day)
  const avgHoursPerDay = completedRecordsCount > 0 ? totalCreditedHours / completedRecordsCount : 0;

  const calculatedStats: AttendanceStats = {
    completed: stats?.completed ?? completedRecords.length,
    incomplete: stats?.incomplete ?? attendanceRecords.filter((r) => r.status === 'incomplete').length,
    noLog: stats?.noLog ?? attendanceRecords.filter((r) => r.status === 'no_log').length,
    avgHoursPerDay: stats?.avgHoursPerDay ?? Math.round(avgHoursPerDay * 10) / 10,
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    const date = new Date(timeString);
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
      case 'completed':
        return <span className="badge badge-success">Completed</span>;
      case 'incomplete':
        return <span className="badge badge-warning">Incomplete</span>;
      case 'no_log':
        return <span className="badge badge-danger">No Log</span>;
      default:
        return <span className="badge">{status}</span>;
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
          }
          
          .attendance-filter-selects select {
            width: 100% !important;
            min-width: 100% !important;
            font-size: 16px !important;
            padding: 0.75rem 2.5rem 0.75rem 0.875rem !important;
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
          
          .attendance-results-count {
            margin-top: 1rem;
            text-align: center !important;
            font-size: 0.8125rem !important;
            padding: 0.5rem 0;
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

            {/* Filter Label */}
            <div className="row attendance-filter-label" style={{ gap: '0.5rem', alignItems: 'center' }}>
              <Filter size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Filters:</span>
            </div>

            {/* Filter Dropdowns */}
            <div className="attendance-filter-selects" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '150px' }}>
                <select
                  className="select"
                  value={dateFilter}
                  onChange={(e) => {
                    if (scrollContainerRef.current) {
                      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
                    }
                    setDateFilter(e.target.value);
                  }}
                  style={{ width: '100%', backgroundColor: 'white', paddingRight: '2.5rem' }}
                >
                  <option value="all">All Date</option>
                  {uniqueDates.map((date) => (
                    <option key={date} value={date}>
                      {formatDate(date)}
                    </option>
                  ))}
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
                  <option value="completed">Completed</option>
                  <option value="incomplete">Incomplete</option>
                  <option value="no_log">No Log</option>
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

        {/* Attendance Table - Desktop */}
        {loading ? (
          <div className="attendance-empty-state" style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
            Loading attendance records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="attendance-empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
            <UserCheck size={48} style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '1rem' }} />
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1rem' }}>
              No attendance records found
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
                    <th style={{ width: '12%' }}>TIME IN</th>
                    <th style={{ width: '12%' }}>TIME OUT</th>
                    <th style={{ width: '14%' }}>RENDERED HOURS</th>
                    <th style={{ width: '14%' }}>CREDITED HOURS</th>
                    <th style={{ width: '16%' }}>STATUS</th>
                  </tr>
                </thead>
              </table>
              
              {/* Scrollable Body */}
              <div className="attendance-table-body-wrapper" ref={scrollContainerRef}>
                <table className="attendance-table-body">
                  <tbody>
                    {filteredRecords.map((record, index) => (
                      <tr key={`${record.id}-${record.date}-${index}`}>
                        <td style={{ width: '20%' }}>
                          <strong>{record.user.full_name}</strong>
                        </td>
                        <td style={{ width: '12%' }}>{formatDate(record.date)}</td>
                        <td style={{ width: '12%' }}>{formatTime(record.time_in)}</td>
                        <td style={{ width: '12%' }}>{formatTime(record.time_out)}</td>
                        <td style={{ width: '14%' }}>{formatHours(record.rendered_hours)}</td>
                        <td style={{ width: '14%' }}>{formatHours(record.credited_hours)}</td>
                        <td style={{ width: '16%' }}>{getStatusBadge(record.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="attendance-mobile-card">
              {filteredRecords.map((record, index) => (
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
                      <span className="attendance-mobile-record-label">Rendered Hours</span>
                      <span className="attendance-mobile-record-value">{formatHours(record.rendered_hours)}</span>
                    </div>
                    <div className="attendance-mobile-record-row">
                      <span className="attendance-mobile-record-label">Credited Hours</span>
                      <span className="attendance-mobile-record-value">{formatHours(record.credited_hours)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Results Count */}
        {!loading && filteredRecords.length > 0 && (
          <div className="attendance-results-count" style={{
            marginTop: '1rem',
            textAlign: 'right',
            color: 'hsl(var(--muted-foreground))',
            fontSize: '0.875rem',
          }}>
            Showing {filteredRecords.length} of {attendanceRecords.length} records
          </div>
        )}
      </div>
    </>
  );
};

export default MonitorAttendance;
