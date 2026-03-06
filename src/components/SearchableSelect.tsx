import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

export interface SearchableSelectOption {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    options: SearchableSelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    /** How many items to show before the list becomes scrollable. Default: 10 */
    maxVisible?: number;
}

const ITEM_HEIGHT_PX = 40; // approximate height of each option row

const SearchableSelect = ({
    options,
    value,
    onChange,
    placeholder = '-- Choose an option --',
    disabled = false,
    maxVisible = 10,
}: SearchableSelectProps) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const [activeIndex, setActiveIndex] = useState(-1);

    const filtered = options.filter((o) =>
        o.label.toLowerCase().includes(query.trim().toLowerCase())
    );

    const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
                setActiveIndex(-1);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Focus search input when menu opens
    useEffect(() => {
        if (open) {
            setTimeout(() => searchRef.current?.focus(), 30);
            setActiveIndex(-1);
        }
    }, [open]);

    const handleSelect = useCallback((optValue: string) => {
        onChange(optValue);
        setOpen(false);
        setQuery('');
        setActiveIndex(-1);
    }, [onChange]);

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setQuery('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setOpen(true);
            }
            return;
        }
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (activeIndex >= 0 && filtered[activeIndex]) {
                    handleSelect(filtered[activeIndex].value);
                }
                break;
            case 'Escape':
                setOpen(false);
                setQuery('');
                setActiveIndex(-1);
                break;
        }
    };

    // Scroll to keep the active item visible
    useEffect(() => {
        if (activeIndex >= 0 && listRef.current) {
            const item = listRef.current.children[activeIndex] as HTMLElement;
            item?.scrollIntoView({ block: 'nearest' });
        }
    }, [activeIndex]);

    const dropdownMaxHeight = ITEM_HEIGHT_PX * maxVisible;

    return (
        <div
            ref={containerRef}
            style={{ position: 'relative', width: '100%' }}
            onKeyDown={handleKeyDown}
        >
            {/* Trigger button */}
            <button
                type="button"
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => !disabled && setOpen((o) => !o)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.625rem 0.875rem',
                    fontSize: '0.875rem',
                    color: value ? '#111827' : '#9ca3af',
                    backgroundColor: disabled ? '#f3f4f6' : 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    gap: '0.5rem',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    boxShadow: open ? '0 0 0 3px rgba(255,140,66,0.15)' : 'none',
                    borderColor: open ? '#ff8c42' : '#d1d5db',
                    opacity: disabled ? 0.6 : 1,
                }}
            >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {value ? selectedLabel : placeholder}
                </span>

                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                    {value && !disabled && (
                        <span
                            role="button"
                            aria-label="Clear selection"
                            onClick={handleClear}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                color: '#9ca3af',
                                padding: '0.1rem',
                                borderRadius: '50%',
                                cursor: 'pointer',
                            }}
                        >
                            <X size={14} />
                        </span>
                    )}
                    <ChevronDown
                        size={16}
                        style={{
                            color: '#6b7280',
                            transition: 'transform 0.2s ease',
                            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                    />
                </span>
            </button>

            {/* Dropdown panel */}
            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        zIndex: 9999,
                        overflow: 'hidden',
                    }}
                >
                    {/* Search bar */}
                    <div
                        style={{
                            padding: '0.5rem',
                            borderBottom: '1px solid #f3f4f6',
                            position: 'relative',
                        }}
                    >
                        <Search
                            size={15}
                            style={{
                                position: 'absolute',
                                left: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#9ca3af',
                                pointerEvents: 'none',
                            }}
                        />
                        <input
                            ref={searchRef}
                            type="text"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
                            placeholder="Search..."
                            style={{
                                width: '100%',
                                padding: '0.4rem 0.5rem 0.4rem 2.25rem',
                                fontSize: '0.8125rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                outline: 'none',
                                backgroundColor: '#f9fafb',
                                color: '#111827',
                            }}
                        />
                    </div>

                    {/* Options list */}
                    <ul
                        ref={listRef}
                        role="listbox"
                        style={{
                            listStyle: 'none',
                            margin: 0,
                            padding: '0.25rem 0',
                            maxHeight: `${dropdownMaxHeight}px`,
                            overflowY: 'auto',
                        }}
                    >
                        {filtered.length === 0 ? (
                            <li
                                style={{
                                    padding: '0.75rem 1rem',
                                    fontSize: '0.8125rem',
                                    color: '#9ca3af',
                                    textAlign: 'center',
                                }}
                            >
                                No results found
                            </li>
                        ) : (
                            filtered.map((opt, idx) => {
                                const isSelected = opt.value === value;
                                const isActive = idx === activeIndex;
                                return (
                                    <li
                                        key={opt.value}
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => handleSelect(opt.value)}
                                        style={{
                                            padding: '0 1rem',
                                            height: `${ITEM_HEIGHT_PX}px`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontSize: '0.875rem',
                                            cursor: 'pointer',
                                            backgroundColor: isSelected
                                                ? '#fff4ed'
                                                : isActive
                                                    ? '#f9fafb'
                                                    : 'transparent',
                                            color: isSelected ? '#ea580c' : '#111827',
                                            fontWeight: isSelected ? 600 : 400,
                                            borderLeft: isSelected ? '3px solid #ff8c42' : '3px solid transparent',
                                            transition: 'background-color 0.1s ease',
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            textOverflow: 'ellipsis',
                                        }}
                                        onMouseEnter={() => setActiveIndex(idx)}
                                    >
                                        {opt.label}
                                    </li>
                                );
                            })
                        )}
                    </ul>

                    {/* Footer: match count when filtering */}
                    {query && (
                        <div
                            style={{
                                padding: '0.375rem 1rem',
                                fontSize: '0.75rem',
                                color: '#9ca3af',
                                borderTop: '1px solid #f3f4f6',
                                backgroundColor: '#fafafa',
                            }}
                        >
                            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
