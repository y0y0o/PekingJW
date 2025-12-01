import React from 'react';
import { TransportRoute, SubwaySegment } from '../types';
import { Car, Navigation, Trash2, Footprints } from 'lucide-react';
import { BEIJING_SUBWAY_LINES } from '../constants';

interface TransportRouteProps {
  route: TransportRoute;
  isEditing: boolean;
  onUpdate: (updated: TransportRoute) => void;
  onDelete: () => void;
}

const SubwaySegmentEditor: React.FC<{ 
  segment: SubwaySegment; 
  onChange: (s: SubwaySegment) => void; 
  onRemove: () => void 
}> = ({ segment, onChange, onRemove }) => {
  
  // Get the stations for the currently selected line
  const selectedLine = BEIJING_SUBWAY_LINES.find(l => l.name === segment.lineName);
  const stations = selectedLine ? selectedLine.stations : [];

  return (
    <div className="border border-gray-200 rounded-lg p-3 mb-2 bg-gray-50">
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{background: segment.lineColor}}></span>
            路段详情
        </h4>
        <button onClick={onRemove} className="text-red-500 hover:text-red-700"><Trash2 size={14}/></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        
        {/* 线路选择 */}
        <div className="col-span-1 sm:col-span-2">
            <label className="block text-xs text-gray-400 mb-1">地铁线路</label>
            <select 
            className="border rounded p-1 w-full"
            value={segment.lineName}
            onChange={(e) => {
                const line = BEIJING_SUBWAY_LINES.find(l => l.name === e.target.value);
                // When line changes, reset stations but keep direction/count logic for user to decide
                onChange({
                    ...segment, 
                    lineName: e.target.value, 
                    lineColor: line ? line.color : '#999',
                    startStation: '',
                    endStation: ''
                });
            }}
            >
            {BEIJING_SUBWAY_LINES.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
            </select>
        </div>

        {/* 站点选择 */}
        <div>
            <label className="block text-xs text-gray-400 mb-1">上车站</label>
            <select 
                className="border rounded p-1 w-full"
                value={segment.startStation}
                onChange={(e) => onChange({...segment, startStation: e.target.value})}
            >
                <option value="">请选择上车站</option>
                {stations.map(s => (
                    <option key={`start-${s}`} value={s} disabled={s === segment.endStation}>{s}</option>
                ))}
            </select>
        </div>
        
        <div>
            <label className="block text-xs text-gray-400 mb-1">下车站</label>
            <select 
                className="border rounded p-1 w-full"
                value={segment.endStation}
                onChange={(e) => onChange({...segment, endStation: e.target.value})}
            >
                <option value="">请选择下车站</option>
                {stations.map(s => (
                    <option key={`end-${s}`} value={s} disabled={s === segment.startStation}>{s}</option>
                ))}
            </select>
        </div>

        <div>
            <label className="block text-xs text-gray-400 mb-1">站数估算</label>
            <input 
            type="number"
            className="border rounded p-1 w-full"
            value={segment.stationCount}
            onChange={(e) => onChange({...segment, stationCount: parseInt(e.target.value) || 0})}
            placeholder="途经站数"
            />
        </div>

        <div>
            <label className="block text-xs text-gray-400 mb-1">开往方向</label>
            <input 
            className="border rounded p-1 w-full"
            value={segment.direction || ''}
            onChange={(e) => onChange({...segment, direction: e.target.value})}
            placeholder="例如: 安河桥北"
            />
        </div>
      </div>
    </div>
  );
};

export const TransportRouteCard: React.FC<TransportRouteProps> = ({ route, isEditing, onUpdate, onDelete }) => {
  
  const addSegment = () => {
    const newSeg: SubwaySegment = {
      id: crypto.randomUUID(),
      lineName: '1号线八通线',
      lineColor: '#c23a30',
      startStation: '',
      endStation: '',
      stationCount: 1
    };
    onUpdate({
      ...route,
      segments: [...route.segments, newSeg]
    });
  };

  const updateSegment = (index: number, updatedSeg: SubwaySegment) => {
    const newSegs = [...route.segments];
    newSegs[index] = updatedSeg;
    onUpdate({ ...route, segments: newSegs });
  };

  const removeSegment = (index: number) => {
    const newSegs = route.segments.filter((_, i) => i !== index);
    onUpdate({ ...route, segments: newSegs });
  };

  // Render the Map-App style visualization
  const renderVisualRoute = () => {
    // WALKING MODE
    if (route.mode === 'walk') {
        return (
          <div className="bg-green-50 p-4 rounded-xl flex items-center gap-4 border border-green-100">
            <div className="bg-green-500 text-white p-2 rounded-full shadow-md flex-shrink-0">
              <Footprints size={24} />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-gray-800 truncate">步行前往</div>
              <div className="text-sm text-gray-500 truncate">
                预计 {route.totalDurationMinutes} 分钟
              </div>
              <div className="text-xs text-green-600 font-medium mt-1 cursor-pointer">开始导航</div>
            </div>
          </div>
        );
    }

    // CAR MODE
    if (route.mode === 'car') {
      return (
        <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-4 border border-blue-100">
          <div className="bg-blue-500 text-white p-2 rounded-full shadow-md flex-shrink-0">
            <Car size={24} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-gray-800 truncate">打车 / 驾车</div>
            <div className="text-sm text-gray-500 truncate">
              预计 {route.totalDurationMinutes} 分钟
            </div>
            <div className="text-xs text-blue-600 font-medium mt-1 cursor-pointer">开始导航</div>
          </div>
        </div>
      );
    }

    // SUBWAY MODE
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Summary */}
        <div className="bg-gray-50 p-3 border-b flex flex-wrap gap-2 justify-between items-center">
          <div className="whitespace-nowrap">
            <span className="text-lg font-bold text-gray-900">
                {Math.floor(route.totalDurationMinutes / 60) > 0 ? `${Math.floor(route.totalDurationMinutes / 60)}小时 ` : ''}
                {route.totalDurationMinutes % 60} 分钟
            </span>
          </div>
          <div className="flex gap-1 flex-wrap">
             {route.segments.map((seg, i) => (
               <span key={i} className="text-xs text-white px-1.5 py-0.5 rounded-sm whitespace-nowrap" style={{backgroundColor: seg.lineColor}}>
                 {seg.lineName.replace(/号线|八通线|大兴线/g, '').replace('亦庄', '亦').replace('昌平', '昌').replace('房山', '房').replace('首都机场', '机').replace('大兴机场', '大兴机').replace('西郊', '西').replace('线', '')}
               </span>
             ))}
          </div>
        </div>

        <div className="p-4 relative">
            {/* Start Node */}
            <div className="flex gap-4 mb-1 relative z-10">
                <div className="flex flex-col items-center w-8 flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm">
                        起
                    </div>
                    {/* Dotted line for initial walk */}
                    <div className="w-0.5 h-8 border-l-2 border-dotted border-gray-300 my-1"></div>
                </div>
                <div className="pt-0.5 min-w-0">
                     <div className="font-bold text-gray-800 text-sm truncate">{route.startLocation || '起点'}</div>
                </div>
            </div>

            {/* Segments */}
            {route.segments.map((seg, idx) => (
                <div key={seg.id} className="flex gap-4 relative z-10 group">
                    <div className="flex flex-col items-center w-8 flex-shrink-0">
                        {/* Station Enter Icon */}
                        <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-400 mb-1 z-20"></div>
                        
                        {/* The Line Itself */}
                        <div className="w-1.5 flex-grow rounded-full my-[-4px]" style={{backgroundColor: seg.lineColor, minHeight: '80px'}}></div>

                         {/* Station Exit Icon (only if last or next is diff) */}
                         <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-400 mt-1 z-20"></div>
                        
                         {/* Connection line if transferring */}
                         {idx < route.segments.length - 1 && (
                             <div className="w-0.5 h-8 bg-gray-300 my-0.5"></div>
                         )}
                    </div>
                    
                    <div className="pb-6 flex-grow min-w-0">
                         {/* Station Name Top */}
                        <div className="flex items-center gap-2 mb-2">
                             <span className="font-bold text-gray-900 truncate">{seg.startStation || '请选择上车站'}</span>
                        </div>

                        {/* Line Badge & Info */}
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 shadow-sm relative -left-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs text-white px-2 py-0.5 rounded whitespace-nowrap" style={{backgroundColor: seg.lineColor}}>
                                    {seg.lineName}
                                </span>
                                {seg.direction && <span className="text-xs text-gray-500 truncate">{seg.direction}方向</span>}
                            </div>
                            <div className="text-xs text-gray-400 flex items-center gap-2">
                                <span>{seg.stationCount} 站</span>
                                <span className="text-green-600 bg-green-50 px-1 rounded whitespace-nowrap">运营正常</span>
                            </div>
                        </div>

                         {/* Station Name Bottom */}
                        <div className="mt-2">
                             <span className="font-bold text-gray-900 truncate">{seg.endStation || '请选择下车站'}</span>
                        </div>
                    </div>
                </div>
            ))}

            {/* End Node */}
            <div className="flex gap-4 mt-1 relative z-10">
                <div className="flex flex-col items-center w-8 flex-shrink-0">
                    <div className="w-0.5 h-6 border-l-2 border-dotted border-gray-300 mb-1"></div>
                    <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm">
                        终
                    </div>
                </div>
                <div className="pt-6 min-w-0">
                     <div className="font-bold text-gray-800 text-sm truncate">{route.endLocation || '终点'}</div>
                </div>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-3">
      {/* View Mode */}
      {!isEditing && renderVisualRoute()}

      {/* Edit Mode */}
      {isEditing && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Navigation size={16} /> 配置交通方式
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                 <label className="col-span-1 sm:col-span-2 flex flex-col text-xs font-semibold text-gray-500">
                    出行方式
                    <select 
                        className="border rounded p-2 mt-1"
                        value={route.mode}
                        onChange={(e) => onUpdate({...route, mode: e.target.value as any})}
                    >
                        <option value="subway">北京地铁</option>
                        <option value="car">驾车 / 打车</option>
                        <option value="walk">步行</option>
                    </select>
                </label>
                <label className="flex flex-col text-xs font-semibold text-gray-500">
                    总时长 (分钟)
                    <input 
                        type="number"
                        className="border rounded p-2 mt-1"
                        value={route.totalDurationMinutes}
                        onChange={(e) => onUpdate({...route, totalDurationMinutes: parseInt(e.target.value)})}
                    />
                </label>
                {/* 移除了公里数输入框 */}
                <label className="flex flex-col text-xs font-semibold text-gray-500">
                    出发地
                    <input 
                        className="border rounded p-2 mt-1"
                        value={route.startLocation}
                        onChange={(e) => onUpdate({...route, startLocation: e.target.value})}
                    />
                </label>
                <label className="flex flex-col text-xs font-semibold text-gray-500">
                    目的地
                    <input 
                        className="border rounded p-2 mt-1"
                        value={route.endLocation}
                        onChange={(e) => onUpdate({...route, endLocation: e.target.value})}
                    />
                </label>
            </div>

            {route.mode === 'subway' && (
                <div className="border-t pt-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">地铁换乘路段</p>
                    {route.segments.map((seg, idx) => (
                        <SubwaySegmentEditor 
                            key={seg.id} 
                            segment={seg} 
                            onChange={(updated) => updateSegment(idx, updated)}
                            onRemove={() => removeSegment(idx)}
                        />
                    ))}
                    <button 
                        onClick={addSegment}
                        className="w-full py-2 bg-blue-50 text-blue-600 font-medium rounded-lg text-sm hover:bg-blue-100 transition-colors"
                    >
                        + 添加地铁线路
                    </button>
                </div>
            )}
            
            <div className="mt-4 flex justify-end">
                 <button onClick={onDelete} className="text-red-500 text-xs hover:underline">移除交通方案</button>
            </div>
        </div>
      )}
    </div>
  );
};