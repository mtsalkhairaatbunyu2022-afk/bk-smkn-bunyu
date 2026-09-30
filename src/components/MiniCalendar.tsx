import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export interface CalendarEventMarker {
  date: string; // YYYY-MM-DD
  count?: number;
  label?: string;
  type?: 'ibadah' | 'konseling' | 'homevisit' | 'agenda' | 'general';
  color?: string; // Tailwind color class or hex
}

interface MiniCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  events?: CalendarEventMarker[];
  title?: string;
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  selectedDate,
  onSelectDate,
  events = [],
  title
}) => {
  // Parse initial month from selectedDate or current date
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
      }
    }
    return new Date();
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Days in Month Calculation
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Day of week offset (0 = Sunday -> converting to 0 = Monday)
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek < 0) startingDayOfWeek = 6;

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    const formattedToday = today.toISOString().split('T')[0];
    onSelectDate(formattedToday);
  };

  // Helper to format YYYY-MM-DD
  const formatDateString = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Build calendar matrix
  const daysGrid = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    daysGrid.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    daysGrid.push(day);
  }

  // Today string
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-slate-100 select-none">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-black text-white uppercase tracking-wider">
            {title || `${monthNames[month]} ${year}`}
          </h4>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleToday}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-[10px] font-bold transition-colors"
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Bulan Berikutnya"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 text-center text-[10px] font-extrabold text-slate-400 mb-2 uppercase">
        <span>Sen</span>
        <span>Sel</span>
        <span>Rab</span>
        <span>Kam</span>
        <span className="text-emerald-400">Jum</span>
        <span>Sab</span>
        <span className="text-rose-400">Min</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-xs">
        {daysGrid.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-8" />;
          }

          const dateStr = formatDateString(day);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;

          // Find events on this date
          const dateEvents = events.filter(e => e.date === dateStr);
          const hasEvent = dateEvents.length > 0;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={`h-8 rounded-lg relative flex flex-col items-center justify-center font-bold text-xs transition-all ${
                isSelected
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md scale-105 z-10'
                  : isToday
                  ? 'bg-indigo-600/60 text-white border border-indigo-400'
                  : 'bg-slate-950/60 hover:bg-slate-800/80 text-slate-300 border border-slate-800/60'
              }`}
            >
              <span>{day}</span>

              {/* Event Badge Dots */}
              {hasEvent && (
                <div className="absolute bottom-1 flex items-center justify-center gap-0.5">
                  {dateEvents.slice(0, 3).map((ev, eIdx) => (
                    <span
                      key={eIdx}
                      className={`w-1.5 h-1.5 rounded-full ${
                        ev.type === 'ibadah'
                          ? 'bg-emerald-400 animate-pulse'
                          : ev.type === 'homevisit'
                          ? 'bg-amber-400'
                          : ev.type === 'konseling'
                          ? 'bg-blue-400'
                          : 'bg-rose-400'
                      }`}
                      title={ev.label || 'Kegiatan Agenda'}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
