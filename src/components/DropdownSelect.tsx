import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export type DropdownSelectOption<T extends string = string> = {
  value: T;
  label: string;
};

type DropdownSelectProps<T extends string = string> = {
  value: T;
  options: DropdownSelectOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  buttonClassName?: string;
  panelClassName?: string;
  disabled?: boolean;
};

function DropdownSelect<T extends string = string>({
  value,
  options,
  onChange,
  className = '',
  buttonClassName = '',
  panelClassName = '',
  disabled = false,
}: DropdownSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

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
        whileTap={disabled ? undefined : { scale: 0.985 }}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        className={`dropdown-select-button flex w-full items-center justify-between rounded-[1.15rem] border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 outline-none transition-all duration-200 focus:border-[hsl(var(--orange))] focus:ring-2 focus:ring-[hsl(var(--orange))]/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-white ${buttonClassName} ${open ? 'border-[hsl(var(--orange))] shadow-[0_14px_34px_-22px_rgba(255,136,0,0.85)]' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{selectedOption?.label ?? value}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-2 shrink-0 text-slate-500 dark:text-slate-300"
        >
          <ChevronDown size={18} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`absolute left-0 right-0 top-[calc(100%+0.55rem)] z-10 overflow-hidden rounded-[1.15rem] border border-gray-200 bg-white shadow-[0_24px_55px_-24px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-slate-900 ${panelClassName}`}
            role="listbox"
          >
            <div className="p-2">
              {options.map((option) => {
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
                    className={`flex w-full items-center justify-start rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-[hsl(var(--orange))] text-white'
                        : 'text-slate-700 hover:bg-orange-50 dark:text-slate-200 dark:hover:bg-white/10'
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

export default DropdownSelect;
