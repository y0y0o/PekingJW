import React from 'react';
import { DayPlan, ActivityType, ActivityData } from '../types';
import { ActivityCard } from './ActivityCard.tsx';
import { Utensils, Sun, Sunset, Coffee, Moon, Trash2 } from 'lucide-react';

interface DayEditorProps {
  dayPlan: DayPlan;
  onUpdateDay: (day: DayPlan) => void;
  onDeleteDay: () => void;
}

export const DayEditor: React.FC<DayEditorProps> = ({ dayPlan, onUpdateDay, onDeleteDay }) => {
  
  const updateActivity = (id: string, updated: ActivityData) => {
    const newActivities = dayPlan.activities.map(a => a.id === id ? updated : a);
    onUpdateDay({ ...dayPlan, activities: newActivities });
  };

  const deleteActivity = (id: string) => {
    onUpdateDay({ ...dayPlan, activities: dayPlan.activities.filter(a => a.id !== id) });
  };

  const addActivity = (type: ActivityType) => {
    const newAct: ActivityData = {
      id: crypto.randomUUID(),
      type,
      title: '',
      requiresReservation: false,
    };
    onUpdateDay({ ...dayPlan, activities: [...dayPlan.activities, newAct] });
  };

  const getSectionTitle = (type: ActivityType) => {
    switch (type) {
      case 'breakfast': return '早餐';
      case 'morning': return '上午活动';
      case 'lunch': return '午餐';
      case 'afternoon': return '下午活动';
      case 'dinner': return '晚餐';
      default: return '其他活动';
    }
  };

  const renderSection = (type: ActivityType, icon: React.ReactNode, label: string) => {
    const acts = dayPlan.activities.filter(a => a.type === type);
    return (
      <div className="mb-8 md:mb-10 relative">
        <div className="flex items-center gap-3 mb-4 sticky top-[72px] md:top-20 bg-gray-100/95 backdrop-blur z-20 py-3 border-b border-gray-200 -mx-2 px-2 md:mx-0 md:px-0">
            <div className={`p-2 rounded-lg flex-shrink-0 ${type.includes('meal') || type === 'breakfast' || type === 'lunch' || type === 'dinner' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                {icon}
            </div>
            <h2 className="text-base md:text-lg font-bold text-gray-800 uppercase tracking-wide truncate">{label}</h2>
            <button 
                onClick={() => addActivity(type)}
                className="ml-auto text-xs md:text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-full hover:bg-gray-50 text-gray-600 shadow-sm whitespace-nowrap"
            >
                + 添加
            </button>
        </div>
        
        <div className="space-y-4 md:pl-4 border-l-0 md:border-l-2 border-gray-200 md:ml-4">
            {acts.length === 0 && (
                <div className="text-gray-400 italic text-sm py-4 text-center md:text-left bg-gray-50/50 rounded-lg md:bg-transparent">暂无{label}安排。</div>
            )}
            {acts.map(act => (
                <ActivityCard 
                    key={act.id} 
                    activity={act} 
                    tripDate={dayPlan.date}
                    onUpdate={(u) => updateActivity(act.id, u)}
                    onDelete={() => deleteActivity(act.id)}
                />
            ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 sticky top-0 md:top-0 z-30 flex justify-between items-center gap-4">
         <div className="flex-1">
             <label className="block text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">正在规划</label>
             <input 
                type="date" 
                className="text-xl md:text-2xl font-bold bg-transparent outline-none text-gray-800 w-full min-w-[150px]"
                value={dayPlan.date}
                onChange={(e) => onUpdateDay({...dayPlan, date: e.target.value})}
             />
         </div>
         <button 
            onClick={onDeleteDay}
            className="flex flex-col items-center justify-center p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors group"
            title="删除这一天"
         >
             <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
             <span className="text-[10px] font-medium mt-1">删除</span>
         </button>
      </div>

      {renderSection('breakfast', <Coffee size={20} />, '早餐')}
      {renderSection('morning', <Sun size={20} />, '上午活动')}
      {renderSection('lunch', <Utensils size={20} />, '午餐')}
      {renderSection('afternoon', <Sunset size={20} />, '下午活动')}
      {renderSection('dinner', <Moon size={20} />, '晚餐')}
    </div>
  );
};