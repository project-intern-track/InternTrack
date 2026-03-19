import { Search, Download, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';

interface InternCardProps {
    id: number;
    name: string;
    email: string;
    role: string;
    hours: string;
    attendance: string;
    status: string;
    lastUpdate: string;
}

type DropdownOption<T extends string> = {
    value: T;
    label: string;
};

type CustomDropdownProps<T extends string> = {
    value: T;
    options: DropdownOption<T>[];
    onChange: (value: T) => void;
    className?: string;
    buttonClassName?: string;
    panelClassName?: string;
};

function CustomDropdown<T extends string>({
    value,
    options,
    onChange,
    className = '',
    buttonClassName = '',
    panelClassName = '',
}: CustomDropdownProps<T>) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const selectedOption = options.find(option => option.value === value) ?? options[0];

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (!dropdownRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    return (
        <div ref={dropdownRef} className={`relative ${open ? 'z-[120]' : 'z-20'} ${className}`}>
            <motion.button
                type="button"
                whileTap={{ scale: 0.985 }}
                onClick={() => setOpen(prev => !prev)}
                className={`flex w-full items-center justify-between rounded-[1.15rem] border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 outline-none transition-all duration-200 focus:border-[hsl(var(--orange))] focus:ring-2 focus:ring-[hsl(var(--orange))]/20 ${buttonClassName} ${open ? 'border-[hsl(var(--orange))] shadow-[0_14px_34px_-22px_rgba(255,136,0,0.85)]' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span>{selectedOption?.label ?? value}</span>
                <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 shrink-0 text-slate-500"
                >
                    <ChevronDown size={18} />
                </motion.span>
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className={`absolute left-0 right-0 top-[calc(100%+0.55rem)] z-10 overflow-hidden rounded-[1.15rem] border border-gray-200 bg-white shadow-[0_24px_55px_-24px_rgba(15,23,42,0.35)] ${panelClassName}`}
                        role="listbox"
                    >
                        <div className="p-2">
                            {options.map(option => {
                                const isActive = option.value === value;

                                return (
                                    <motion.button
                                        key={option.value}
                                        type="button"
                                        whileTap={{ scale: 0.985 }}
                                        onClick={() => {
                                            onChange(option.value);
                                            setOpen(false);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                                            isActive
                                                ? 'bg-[hsl(var(--orange))] text-white'
                                                : 'text-slate-700 hover:bg-orange-50'
                                        }`}
                                        role="option"
                                        aria-selected={isActive}
                                    >
                                        <span>{option.label}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const InternCard = ({ id, name, email, role, hours, attendance, status, lastUpdate }: InternCardProps) => {
    const navigate = useNavigate();

    const getStatusClass = (status: string) => {
        if (status === 'Active') {
            return 'report-status-badge active';
        } else if (status === 'Completed') {
            return 'report-status-badge completed';
        }
        return 'report-status-badge';
    };

    const handleClick = () => {
        navigate(`/admin/reports/${id}`);
    };

    return (
        <button type="button" className="report-intern-card" onClick={handleClick}>
            <div className="report-card-header">
                <div className="report-card-header-row">
                    <h3 className="report-card-name">{name}</h3>
                    <span className={getStatusClass(status)}>{status}</span>
                </div>
                <p className="report-card-email">{email}</p>
            </div>

            <div className="report-card-meta">
                <div className="report-card-meta-row">
                    <span>Role:</span>
                    <strong>{role}</strong>
                </div>
                <div className="report-card-meta-row">
                    <span>Hours:</span>
                    <strong>{hours}</strong>
                </div>
                <div className="report-card-meta-row">
                    <span>Attendance:</span>
                    <strong>{attendance}</strong>
                </div>
            </div>

            <div className="report-card-footer">
                <p>Last update: {lastUpdate}</p>
            </div>
        </button>
    );
};

const Reports = () => {
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const statusOptions: DropdownOption<typeof filterStatus>[] = [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
    ];

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const response = await apiClient.get('/reports/interns/export', {
                params: { status: filterStatus },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `intern-reports-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const [interns, setInterns] = useState<InternCardProps[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/reports/interns');
            // The API returns an object 'data' containing the array
            setInterns(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const processedInterns = interns.map(intern => ({
        ...intern,
        status: intern.attendance === '100%' && intern.status === 'Active' ? 'Completed' : intern.status
    }));

    const filteredInterns = processedInterns.filter(intern => {
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && intern.status === 'Active') ||
            (filterStatus === 'completed' && intern.status === 'Completed');

        const matchesSearch = searchTerm === '' ||
            intern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            intern.email.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    return (
        <div className="admin-page-shell reports-page-shell">
            <div className="reports-header-block">
                <h1 className="reports-title">Reports Section</h1>
                <h2 className="reports-subtitle">Weekly/Monthly Summaries</h2>
            </div>

            <div className="reports-filter-bar">
                <div className="reports-search-wrap">
                    <Search size={20} className="reports-search-icon" />
                    <input
                        type="text"
                        className="reports-search-input"
                        placeholder="Search by name or email"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <CustomDropdown
                    value={filterStatus}
                    options={statusOptions}
                    onChange={setFilterStatus}
                    className="reports-status-dropdown"
                    buttonClassName="reports-status-select"
                />

                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="btn btn-primary reports-export-btn"
                >
                    <Download size={16} />
                    {isExporting ? 'Exporting...' : 'Export All'}
                </button>
            </div>

            {loading ? (
                <div className="reports-empty-state">Loading reports...</div>
            ) : filteredInterns.length === 0 ? (
                <div className="reports-empty-state">No interns found matching the filters.</div>
            ) : (
                <div className="report-intern-grid">
                    {filteredInterns.map((intern, index) => (
                        <InternCard key={intern.id || index} {...intern} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Reports;
