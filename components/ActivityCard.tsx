import React, { useState } from 'react';
import { ActivityData, TransportRoute } from '../types';
import { TransportRouteCard } from './TransportRoute.tsx';
import { Clock, MapPin, CalendarClock, Trash2, Edit2, Check, BellRing } from 'lucide-react';
import { differenceInDays, subDays, format, isValid, parseISO, setHours, setMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ActivityCardProps {
  activity: ActivityData;
  tripDate: string; // YYYY-MM-DD
  onUpdate: (a: ActivityData) => void;
  onDelete: () => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, tripDate, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);

  // Reservation Logic
  let reservationDate = activity.requiresReservation && activity.reservationAdvanceDays 
    ? subDays(parseISO(tripDate), activity.reservationAdvanceDays) 
    : null;
    
  // If specific time is set, add it to the date object for calculation
  if (reservationDate && activity.reservationTime) {
      const [hours, minutes] = activity.reservationTime.split(':').map(Number);
      reservationDate = setHours(setMinutes(reservationDate, minutes), hours);
  }
  
  const isReservationPast = reservationDate ? new Date() > reservationDate : false;

  const handleTransportUpdate = (t: TransportRoute) => {
    onUpdate({ ...activity, transport: t });
  };

  const addTransport = () => {
    onUpdate({
      ...activity,
      transport: {
        id: crypto.randomUUID(),
        mode: 'subway',
        startLocation: '起点',
        endLocation: activity.location || '目的地',
        totalDurationMinutes: 30,
        totalDistanceKm: 0, // Default to 0, though UI won't show it
        segments: []
      }
    });
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border p-5 mb-6 transition-all ${isEditing ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:shadow-md'}`}>
      
      {/* Header Section */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
            {isEditing ? (
                <div className="flex gap-2 mb-2">
                    <input 
                        value={activity.title} 
                        onChange={e => onUpdate({...activity, title: e.target.value})}
                        className="font-bold text-lg border-b border-gray-300 focus:border-blue-500 outline-none w-full"
                        placeholder="活动名称"
                    />
                </div>
            ) : (
                <h3 className="text-xl font-bold text-gray-800">{activity.title || "未命名活动"}</h3>
            )}
            
            <div className="flex items-center gap-3 text-gray-500 text-sm mt-1">
                <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                    <Clock size={14} /> 
                    {isEditing ? (
                        <div className="flex gap-1">
                            <input type="time" value={activity.startTime || ''} onChange={e => onUpdate({...activity, startTime: e.target.value})} className="bg-transparent" />
                            -
                            <input type="time" value={activity.endTime || ''} onChange={e => onUpdate({...activity, endTime: e.target.value})} className="bg-transparent" />
                        </div>
                    ) : (
                        <span>{activity.startTime || '--:--'} - {activity.endTime || '--:--'}</span>
                    )}
                </span>
                
                {isEditing ? (
                    <input 
                        value={activity.location || ''} 
                        onChange={e => onUpdate({...activity, location: e.target.value})}
                        placeholder="地点"
                        className="border-b text-sm w-32"
                    />
                ) : (
                   activity.location && <span className="flex items-center gap-1"><MapPin size={14} /> {activity.location}</span>
                )}
            </div>
        </div>

        <div className="flex gap-2">
            <button 
                onClick={() => setIsEditing(!isEditing)} 
                className={`p-2 rounded-full ${isEditing ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
                {isEditing ? <Check size={18}/> : <Edit2 size={18}/>}
            </button>
            {isEditing && (
                <button onClick={onDelete} className="p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100">
                    <Trash2 size={18}/>
                </button>
            )}
        </div>
      </div>

      {/* Reservation Section */}
      <div className={`rounded-xl p-4 mb-4 ${activity.requiresReservation ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50 border border-gray-100'}`}>
        <div className="flex justify-between items-center mb-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                    type="checkbox" 
                    checked={activity.requiresReservation}
                    onChange={(e) => onUpdate({...activity, requiresReservation: e.target.checked})}
                    disabled={!isEditing}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <span className={`font-semibold text-sm ${activity.requiresReservation ? 'text-amber-800' : 'text-gray-500'}`}>
                    需要预约
                </span>
            </label>
            {activity.requiresReservation && (
                <div className="flex items-center gap-1 text-amber-700 text-xs font-medium">
                     <BellRing size={12} />
                     已开启提醒
                </div>
            )}
        </div>

        {activity.requiresReservation && (
            <div className="pl-6">
                {isEditing ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            提前
                            <input 
                                type="number" 
                                min="0"
                                className="w-16 border rounded p-1 text-center"
                                value={activity.reservationAdvanceDays || 0}
                                onChange={(e) => onUpdate({...activity, reservationAdvanceDays: parseInt(e.target.value)})}
                            />
                            天预约。
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                             <span>放票/抢票时间:</span>
                             <input 
                                type="time"
                                className="border rounded p-1"
                                value={activity.reservationTime || ''}
                                onChange={(e) => onUpdate({...activity, reservationTime: e.target.value})}
                             />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1 text-sm text-gray-600">
                        <span>提前 {activity.reservationAdvanceDays} 天预约。</span>
                        {activity.reservationTime && <span className="text-amber-700 font-medium">放票时间: {activity.reservationTime}</span>}
                    </div>
                )}
                
                {reservationDate && isValid(reservationDate) && (
                    <div className={`mt-2 text-sm flex items-center gap-2 p-2 rounded-lg ${isReservationPast ? 'bg-red-100 text-red-700' : 'bg-white text-amber-800 border border-amber-200'}`}>
                        <CalendarClock size={16} />
                        <span className="font-medium">
                            {/* 如果有时间，显示具体时间，否则只显示日期 */}
                            预约时间: {format(reservationDate, activity.reservationTime ? 'yyyy年M月d日 HH:mm' : 'yyyy年M月d日', { locale: zhCN })}
                        </span>
                        {isReservationPast && <span className="text-xs font-bold uppercase ml-auto">已过期!</span>}
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Transport Section */}
      <div className="mt-4">
        {!activity.transport && isEditing && (
            <button onClick={addTransport} className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
                + 添加到达此处的交通方案
            </button>
        )}
        {activity.transport && (
            <TransportRouteCard 
                route={activity.transport} 
                isEditing={isEditing}
                onUpdate={handleTransportUpdate}
                onDelete={() => onUpdate({...activity, transport: undefined})}
            />
        )}
      </div>

    </div>
  );
};