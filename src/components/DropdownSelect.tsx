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
  optionsContainerClassName?: string;
  disabled?: boolean;
};

function DropdownSelect<T extends string = string>({
  value,
  options,
  onChange,
  className = '',
  buttonClassName = '',
  panelClassName = '',
  optionsContainerClassName = '',
  disabled = false,
}: DropdownSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const updatePanelDirection = () => {
      const rect = dropdownRef.current?.getBoundingClientRect();
      if (!rect) return;

      const viewportHeight = window.innerHeight;
      const estimatedPanelHeight = 288; // menu + padding + border
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      setOpenUpward(spaceBelow < estimatedPanelHeight && spaceAbove > spaceBelow);
    };

    updatePanelDirection();

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

    window.addEventListener('resize', updatePanelDirection);
    window.addEventListener('scroll', updatePanelDirection, true);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('resize', updatePanelDirection);
      window.removeEventListener('scroll', updatePanelDirection, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={dropdownRef} className={`relative min-w-0 max-w-full ${open ? 'z-[120]' : 'z-20'} ${className}`}>
      <motion.button
        type="button"
        whileTap={disabled ? undefined : { scale: 0.985 }}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        className={`dropdown-select-button flex w-full min-w-0 max-w-full items-center justify-between rounded-[1.15rem] border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 outline-none transition-all duration-200 focus:border-[hsl(var(--orange))] focus:ring-2 focus:ring-[hsl(var(--orange))]/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-white ${buttonClassName} ${open ? 'border-[hsl(var(--orange))] shadow-[0_14px_34px_-22px_rgba(255,136,0,0.85)]' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 truncate">{selectedOption?.label ?? value}</span>
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
            initial={{ opacity: 0, y: openUpward ? 8 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: openUpward ? 8 : -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`absolute left-0 right-0 z-10 overflow-hidden rounded-[1.15rem] border border-gray-200 bg-white shadow-[0_24px_55px_-24px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-slate-900 ${
              openUpward
                ? 'bottom-[calc(100%+0.55rem)] [transform-origin:bottom_center]'
                : 'top-[calc(100%+0.55rem)] [transform-origin:top_center]'
            } ${panelClassName}`}
            role="listbox"
          >
            <div className={`max-h-64 overflow-y-auto p-2 ${optionsContainerClassName}`}>
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
                    className={`flex min-h-[48px] w-full items-center justify-start rounded-2xl px-4 py-3 text-left text-sm font-semibold leading-5 transition-all duration-200 ${
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
