import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check, Search } from 'lucide-react';

export interface Option {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  options: (string | Option)[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  allowManualInput?: boolean;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = 'Pilih Opsi (Bisa Lebih Dari 1)...',
  className = '',
  allowManualInput = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [manualInput, setManualInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize options into { value, label }
  const normalizedOptions: Option[] = options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = normalizedOptions.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const handleSelectAll = () => {
    const allValues = Array.from(new Set([...selectedValues, ...normalizedOptions.map(o => o.value)]));
    onChange(allValues);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualInput.trim();
    if (trimmed && !selectedValues.includes(trimmed)) {
      onChange([...selectedValues, trimmed]);
      setManualInput('');
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Trigger Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[42px] px-3 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-white cursor-pointer flex items-center justify-between gap-2 shadow-sm transition-all"
      >
        <div className="flex flex-wrap gap-1.5 items-center flex-1 overflow-hidden">
          {selectedValues.length === 0 ? (
            <span className="text-slate-400 font-semibold">{placeholder}</span>
          ) : (
            selectedValues.map(val => (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30 text-[11px]"
              >
                <span>{val}</span>
                <X
                  className="w-3 h-3 text-amber-300 hover:text-white cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(val);
                  }}
                />
              </span>
            ))
          )}
        </div>
        <div className="flex items-center gap-1 text-slate-400 shrink-0">
          {selectedValues.length > 0 && (
            <span className="text-[10px] bg-slate-800 text-amber-400 font-extrabold px-1.5 py-0.5 rounded-md border border-slate-700">
              {selectedValues.length}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 bg-slate-950 border border-slate-800 text-white rounded-xl shadow-2xl p-2.5 space-y-2 animate-fade-in max-h-72 flex flex-col">
          {/* Search bar inside dropdown */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Cari pilihan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
            />
          </div>

          {/* Action buttons (Pilih Semua / Hapus All) */}
          <div className="flex items-center justify-between px-1 text-[11px]">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-amber-400 hover:underline font-bold"
            >
              Pilih Semua
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-rose-400 hover:underline font-bold"
            >
              Hapus Semua
            </button>
          </div>

          {/* List of options */}
          <div className="overflow-y-auto flex-1 space-y-0.5 pr-1 divide-y divide-slate-900">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => toggleOption(opt.value)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold transition-colors ${
                      isSelected ? 'bg-amber-400/15 text-amber-300' : 'hover:bg-slate-900 text-slate-200'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-amber-400 border-amber-400 text-slate-950'
                          : 'border-slate-700 bg-slate-900'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-3 text-center text-slate-500 text-xs">
                Tidak ada opsi yang cocok
              </div>
            )}
          </div>

          {/* Manual Input field inside dropdown */}
          {allowManualInput && (
            <form onSubmit={handleAddManual} className="pt-2 border-t border-slate-900 flex gap-1.5">
              <input
                type="text"
                placeholder="Atau ketik pilihan kustom..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs shrink-0"
              >
                + Tambah
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
