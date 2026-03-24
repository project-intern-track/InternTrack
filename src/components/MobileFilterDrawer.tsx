import type { ReactNode } from 'react';
import { ChevronDown, Filter } from 'lucide-react';

type MobileFilterDrawerProps = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  children: ReactNode;
  triggerLabel?: string;
  triggerClassName?: string;
  bodyClassName?: string;
  className?: string;
};

const MobileFilterDrawer = ({
  open,
  onOpen,
  onClose,
  children,
  triggerLabel = 'Filters',
  triggerClassName = '',
  bodyClassName = '',
  className = 'w-full min-[851px]:hidden',
}: MobileFilterDrawerProps) => {
  const handleToggle = () => {
    if (open) {
      onClose();
      return;
    }

    onOpen();
  };

  return (
    <div className={className}>
      <button
        type="button"
        className={`inline-flex w-full items-center justify-between rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700 shadow-sm transition hover:bg-orange-100 ${triggerClassName}`}
        onClick={handleToggle}
        aria-expanded={open}
        aria-controls="mobile-filter-collapse"
      >
        <span className="flex items-center gap-2">
          <Filter size={18} />
          {triggerLabel}
        </span>
        <ChevronDown
          size={18}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          id="mobile-filter-collapse"
          className="mt-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950"
        >
          <div className={bodyClassName}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileFilterDrawer;
