import React from 'react';
import { DayPlan, ActivityType } from '../types';
import { format, parseISO, isBefore, isToday, startOfWeek, addDays, endOfWeek, eachDayOfInterval, differenceInMinutes, setHours, setMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { AlertCircle, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarViewProps {
  plans: DayPlan[];
  onSelectDay: (id: string) => void;
}

const ACTIVITY_COLORS: Record<ActivityType, { bg: string, border: string, text: string }> = {
    breakfast: { bg: 'bg-orange-200', border: 'border-orange-400', text: 'text-orange-900' },
    morning: { bg: 'bg-sky-200', border: 'border-sky-400', text: 'text-sky-900' },
    lunch: { bg: 'bg-red-200', border: 'border-red-400', text: 'text-red-900' },
    afternoon: { bg: 'bg-teal-200', border: 'border-teal-400', text: 'text-teal-900' },
    dinner: { bg: 'bg-purple-200', border: 'border-purple-400', text: 'text-purple-900' },
};

export const CalendarView: React.FC<CalendarViewProps> = ({ plans, onSelectDay }) => {
  // Sort plans by date
  const sortedPlans = [...plans].sort((a, b) => a.date.localeCompare(b.date));
  const today = new Date();

  // Helper for Gantt positioning
  const START_HOUR = 6; // 6:00 AM
  const END_HOUR = 24; // 12:00 PM
  const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

  const getPositionStyle = (startTime?: string, endTime?: string) => {
      if (!startTime || !endTime) return { display: 'none' };
      
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      
      const startTotalM = (startH * 60 + startM) - (START_HOUR * 60);
      const durationM = (endH * 60 + endM) - (startH * 60 + startM);

      const leftPercent = (startTotalM / TOTAL_MINUTES) * 100;
      const widthPercent = (durationM / TOTAL_MINUTES) * 100;

      return {
          left: `${Math.max(0, leftPercent)}%`,
          width: `${Math.max(1, widthPercent)}%`
      };
  };

  return (
    <div className="h-full overflow-y-auto p-2 md:p-4">
      {/* Mobile View: Agenda List (Better for small screens) */}
      <div className="md:hidden space-y-3">
        {sortedPlans.length === 0 ? (
           <div className="text-center py-10 text-gray-400">
               <CalendarIcon size={40} className="mx-auto mb-2 opacity-50"/>
               <p>暂无行程安排</p>
           </div>
        ) : (
            sortedPlans.map(plan => {
                const isPast = isBefore(parseISO(plan.date), today) && !isToday(parseISO(plan.date));
                return (
                    <div 
                        key={plan.id}
                        onClick={() => onSelectDay(plan.id)}
                        className={`bg-white rounded-xl p-4 border shadow-sm active:scale-[0.98] transition-transform ${isPast ? 'bg-gray-50 border-gray-100' : 'border-gray-200'}`}
                    >
                        <div className="flex justify-between items-center mb-3">
                            <h3 className={`font-bold text-lg ${isPast ? 'text-gray-500' : 'text-gray-800'}`}>
                                {format(parseISO(plan.date), 'M月d日 EEEE', { locale: zhCN })}
                            </h3>
                            {isToday(parseISO(plan.date)) && (
                                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">今天</span>
                            )}
                        </div>
                        <div className="space-y-2">
                             {plan.activities.length === 0 && <div className="text-sm text-gray-400 italic">暂无活动</div>}
                             {plan.activities.sort((a,b) => (a.startTime || '').localeCompare(b.startTime || '')).map(act => {
                                 const colors = ACTIVITY_COLORS[act.type] || { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' };
                                 return (
                                    <div key={act.id} className="flex gap-3 text-sm">
                                        <div className="w-12 text-gray-400 font-mono text-xs pt-1 flex-shrink-0">
                                            {act.startTime || '--:--'}
                                        </div>
                                        <div className={`flex-1 p-2 rounded-lg border-l-4 ${colors.bg} ${colors.border} ${colors.text} ${isPast ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                            <div className="font-semibold">{act.title}</div>
                                            {act.requiresReservation && !isPast && (
                                                <div className="text-xs text-amber-600 flex items-center gap-1 mt-1 font-medium">
                                                    <AlertCircle size={10} /> 需要预约
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                 );
                             })}
                        </div>
                    </div>
                )
            })
        )}
      </div>

      {/* Desktop View: Timeline / Gantt Chart */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Timeline Header */}
        <div className="flex border-b border-gray-200 bg-gray-50">
            <div className="w-32 flex-shrink-0 p-3 font-bold text-gray-500 text-sm text-center border-r">日期</div>
            <div className="flex-1 relative h-10">
                {/* Time Markers */}
                {[6, 9, 12, 15, 18, 21].map(hour => (
                    <div 
                        key={hour} 
                        className="absolute top-0 bottom-0 border-l border-gray-300 pl-1 text-[10px] text-gray-400 font-mono pt-1"
                        style={{ left: `${((hour - START_HOUR) * 60 / TOTAL_MINUTES) * 100}%` }}
                    >
                        {hour}:00
                    </div>
                ))}
            </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100">
            {sortedPlans.map(plan => {
                const isPast = isBefore(parseISO(plan.date), today) && !isToday(parseISO(plan.date));
                return (
                    <div key={plan.id} className={`flex h-24 hover:bg-gray-50 transition-colors ${isPast ? 'bg-gray-50 opacity-70' : ''}`} onClick={() => onSelectDay(plan.id)}>
                        {/* Date Label */}
                        <div className="w-32 flex-shrink-0 p-4 border-r border-gray-200 flex flex-col justify-center items-center cursor-pointer group">
                             <div className="font-bold text-gray-800">{format(parseISO(plan.date), 'M月d日')}</div>
                             <div className="text-xs text-gray-400">{format(parseISO(plan.date), 'EEEE', { locale: zhCN })}</div>
                             {isToday(parseISO(plan.date)) && <span className="bg-blue-600 text-white text-[10px] px-1.5 rounded-full mt-1">今天</span>}
                        </div>
                        
                        {/* Timeline Track */}
                        <div className="flex-1 relative my-2 mx-2">
                             {/* Grid Lines */}
                            {[6, 9, 12, 15, 18, 21].map(hour => (
                                <div 
                                    key={hour} 
                                    className="absolute top-0 bottom-0 border-l border-dashed border-gray-200"
                                    style={{ left: `${((hour - START_HOUR) * 60 / TOTAL_MINUTES) * 100}%` }}
                                ></div>
                            ))}

                            {/* Activities Blocks */}
                            {plan.activities.map(act => {
                                const style = getPositionStyle(act.startTime, act.endTime);
                                const colors = ACTIVITY_COLORS[act.type] || { bg: 'bg-gray-300', border: 'border-gray-400', text: 'text-gray-800' };
                                
                                return (
                                    <div 
                                        key={act.id}
                                        className={`absolute top-1 bottom-1 rounded-md border text-xs overflow-hidden px-2 py-1 shadow-sm cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all flex flex-col justify-center whitespace-nowrap ${colors.bg} ${colors.border} ${colors.text} z-10`}
                                        style={style}
                                        title={`${act.title} (${act.startTime}-${act.endTime})`}
                                    >
                                        <div className="font-bold truncate">{act.title || '活动'}</div>
                                        <div className="opacity-80 text-[10px] truncate">{act.startTime}-{act.endTime}</div>
                                    </div>
                                );
                            })}
                            
                            {plan.activities.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm pointer-events-none">
                                    无安排
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};