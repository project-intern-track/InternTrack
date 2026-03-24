import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface DateTimePickerProps {
  date: string;
  time: string;
  minDate?: string;
  showTime?: boolean;
  datePlaceholder?: string;
  disabled?: boolean;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onInteract?: () => void;
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const HOURS_12 = Array.from({ length: 12 }, (_, index) => (index + 1).toString());
const MINUTES = Array.from({ length: 60 }, (_, index) => index.toString().padStart(2, '0'));
const PERIODS = ['AM', 'PM'] as const;
type Period = (typeof PERIODS)[number];

const formatMonthLabel = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const formatDateLabel = (dateValue: string) => {
  if (!dateValue) return 'Select date';
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getCalendarDays = (displayMonth: Date) => {
  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const startDate = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + index);
    return day;
  });
};

const parseTimeParts = (time: string) => {
  if (!time) {
    return { hour12: '', minute: '', period: 'AM' as Period };
  }

  const [hourString = '', minuteString = ''] = time.split(':');
  const hour24 = Number(hourString);
  if (Number.isNaN(hour24)) {
    return { hour12: '', minute: minuteString, period: 'AM' as Period };
  }

  const period = hour24 >= 12 ? 'PM' : 'AM';
  const normalizedHour = hour24 % 12 || 12;
  return {
    hour12: normalizedHour.toString(),
    minute: minuteString,
    period,
  };
};

const compose24HourTime = (hour12: string, minute: string, period: Period) => {
  if (!hour12 || !minute) return '';

  const numericHour = Number(hour12);
  if (Number.isNaN(numericHour)) return '';

  let hour24 = numericHour % 12;
  if (period === 'PM') {
    hour24 += 12;
  }

  return `${hour24.toString().padStart(2, '0')}:${minute}`;
};

const DateTimePicker = ({
  date,
  time,
  minDate,
  showTime = true,
  datePlaceholder = 'Select date',
  disabled = false,
  onDateChange,
  onTimeChange,
  onInteract,
}: DateTimePickerProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialMonth = useMemo(() => {
    if (date) {
      const [year, month] = date.split('-').map(Number);
      return new Date(year, (month || 1) - 1, 1);
    }
    return new Date();
  }, [date]);

  const [displayMonth, setDisplayMonth] = useState(initialMonth);

  useEffect(() => {
    setDisplayMonth(initialMonth);
  }, [initialMonth]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calendarDays = useMemo(() => getCalendarDays(displayMonth), [displayMonth]);
  const minDateValue = minDate ?? '';
  const { hour12: selectedHour, minute: selectedMinute, period: selectedPeriod } = parseTimeParts(time);

  return (
    <div className="date-time-picker" ref={containerRef}>
      <div className={`date-time-picker-row ${showTime ? '' : 'date-only'}`.trim()}>
        <button
          type="button"
          className={`date-time-picker-trigger ${disabled ? 'is-disabled' : ''}`.trim()}
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            onInteract?.();
            setOpen((current) => !current);
          }}
        >
          <Calendar size={18} className="date-time-picker-leading-icon" />
          <span className={date ? 'date-time-picker-value' : 'date-time-picker-placeholder'}>
            {date ? formatDateLabel(date) : datePlaceholder}
          </span>
        </button>

        {showTime ? (
          <div className={`date-time-picker-time ${disabled ? 'is-disabled' : ''}`.trim()}>
            <Clock size={18} className="date-time-picker-leading-icon" />
            <select
              className="date-time-picker-select"
              disabled={disabled}
              value={selectedHour}
              onChange={(event) => {
                const nextHour = event.target.value;
                onInteract?.();
                onTimeChange(compose24HourTime(nextHour, selectedMinute || '00', selectedPeriod as Period));
              }}
            >
              <option value="">Hour</option>
              {HOURS_12.map((hour) => (
                <option key={hour} value={hour}>
                  {hour.padStart(2, '0')}
                </option>
              ))}
            </select>
            <span className="date-time-picker-separator">:</span>
            <select
              className="date-time-picker-select"
              disabled={disabled}
              value={selectedMinute}
              onChange={(event) => {
                const nextMinute = event.target.value;
                onInteract?.();
                onTimeChange(compose24HourTime(selectedHour || '12', nextMinute, selectedPeriod as Period));
              }}
            >
              <option value="">Min</option>
              {MINUTES.map((minute) => (
                <option key={minute} value={minute}>
                  {minute}
                </option>
              ))}
            </select>
            <select
              className="date-time-picker-select date-time-picker-period"
              disabled={disabled}
              value={selectedPeriod}
              onChange={(event) => {
                const nextPeriod = event.target.value as Period;
                onInteract?.();
                onTimeChange(compose24HourTime(selectedHour || '12', selectedMinute || '00', nextPeriod));
              }}
            >
              {PERIODS.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {open ? (
        <div className="date-time-picker-popover">
          <div className="date-time-picker-popover-header">
            <button
              type="button"
              className="date-time-picker-nav"
              onClick={() =>
                setDisplayMonth(
                  new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1),
                )
              }
            >
              <ChevronLeft size={16} />
            </button>
            <div className="date-time-picker-month-label">{formatMonthLabel(displayMonth)}</div>
            <button
              type="button"
              className="date-time-picker-nav"
              onClick={() =>
                setDisplayMonth(
                  new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1),
                )
              }
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="date-time-picker-weekdays">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="date-time-picker-calendar">
            {calendarDays.map((day) => {
              const isoDate = day.toLocaleDateString('en-CA');
              const inCurrentMonth = day.getMonth() === displayMonth.getMonth();
              const isSelected = isoDate === date;
              const isDisabled = Boolean(minDateValue) && isoDate < minDateValue;

              return (
                <button
                  key={isoDate}
                  type="button"
                  className={[
                    'date-time-picker-day',
                    inCurrentMonth ? '' : 'is-muted',
                    isSelected ? 'is-selected' : '',
                    isDisabled ? 'is-disabled' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={isDisabled}
                  onClick={() => {
                    onInteract?.();
                    onDateChange(isoDate);
                    setOpen(false);
                  }}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DateTimePicker;
