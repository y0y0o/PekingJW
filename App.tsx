import React, { useState, useEffect } from 'react';
import { DayPlan } from './types';
import { DayEditor } from './components/DayEditor.tsx';
import { CalendarView } from './components/CalendarView.tsx';
import { DataService } from './lib/db.ts';
import { Calendar, Map, Plus, Menu, X, Cloud, CloudOff } from 'lucide-react';
import { db } from './lib/firebase.ts';

type ViewMode = 'calendar' | 'editor';

const App: React.FC = () => {
  const [plans, setPlans] = useState<DayPlan[]>([]);
  const [view, setView] = useState<ViewMode>('editor');
  const [currentDayId, setCurrentDayId] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 初始化数据监听
  useEffect(() => {
    const unsubscribe = DataService.subscribeToPlans((newPlans) => {
      setPlans(newPlans);
      setLoading(false);
      
      // 如果当前没有选中的日期，且有数据，默认选中第一天
      if (!currentDayId && newPlans.length > 0) {
        setCurrentDayId(newPlans[0].id);
      }
    });

    // 监听本地存储事件 (用于本地模式下的组件间通信)
    const handleLocalUpdate = () => {
        if (!db) {
            // 重新触发一次读取
            DataService.subscribeToPlans((newPlans) => setPlans(newPlans));
        }
    };
    window.addEventListener('local-storage-updated', handleLocalUpdate);

    return () => {
        unsubscribe();
        window.removeEventListener('local-storage-updated', handleLocalUpdate);
    };
  }, []); // 只在组件挂载时运行一次

  const handleUpdateDay = async (updatedDay: DayPlan) => {
    // 乐观更新：先更新UI，感觉更快
    setPlans(plans.map(p => p.id === updatedDay.id ? updatedDay : p));
    // 异步保存到数据库
    await DataService.saveDay(updatedDay);
  };

  const handleDeleteDay = async (id: string) => {
    if (window.confirm("你确定要删除这一天及其所有活动吗？")) {
      await DataService.deleteDay(id);
      
      const newPlans = plans.filter(p => p.id !== id);
      setPlans(newPlans); // 乐观更新
      
      if (newPlans.length > 0) {
        if (currentDayId === id) {
             setCurrentDayId(newPlans[0].id);
        }
      } else {
        setCurrentDayId('');
        setView('calendar');
      }
    }
  };

  const addNewDay = async () => {
    const newDay: DayPlan = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      activities: []
    };
    
    // 乐观更新
    const newPlans = [...plans, newDay];
    setPlans(newPlans);
    setCurrentDayId(newDay.id);
    setView('editor');
    setIsMobileMenuOpen(false);

    // 保存
    await DataService.saveDay(newDay);
  };

  const navigateToDay = (id: string) => {
    setCurrentDayId(id);
    setView('editor');
    setIsMobileMenuOpen(false);
  };

  const navigateToCalendar = () => {
    setView('calendar');
    setIsMobileMenuOpen(false);
  };

  const currentDay = plans.find(p => p.id === currentDayId);

  if (loading) {
      return <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-gray-400">正在加载行程...</div>;
  }

  return (
    <div className="flex h-screen w-screen bg-gray-100 overflow-hidden font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center px-4 justify-between shadow-sm">
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-600 p-2 -ml-2">
            <Menu size={24} />
        </button>
        <span className="font-bold text-lg text-gray-800">PekingJW</span>
        <div className="w-8"></div> 
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar / Navigation */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col shadow-xl md:shadow-none transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                    PekingJW
                </h1>
                <div className="flex flex-col gap-1 mt-1">
                   <p className="text-xs text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1">
                      {db ? <><Cloud size={10} className="text-green-500"/> 已连接云端</> : <><CloudOff size={10}/> 本地模式</>}
                   </p>
                   <p className="text-[10px] text-gray-300">v1.1</p>
                </div>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400">
                <X size={24} />
            </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
            <button 
                onClick={navigateToCalendar}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${view === 'calendar' ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                <Calendar size={20} />
                日历概览
            </button>
            
            <div className="pt-6 pb-2 px-2 text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center">
                <span>行程天数</span>
                <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px]">{plans.length}</span>
            </div>
            
            <div className="space-y-1">
                {plans.sort((a,b) => a.date.localeCompare(b.date)).map(plan => (
                    <button 
                        key={plan.id}
                        onClick={() => navigateToDay(plan.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-colors ${currentDayId === plan.id && view === 'editor' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <span>{plan.date}</span>
                        {currentDayId === plan.id && view === 'editor' && <Map size={14} className="text-gray-400"/>}
                    </button>
                ))}
            </div>

            <button 
                onClick={addNewDay}
                className="w-full flex items-center justify-center gap-2 mt-4 border-2 border-dashed border-gray-300 rounded-xl py-3 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors text-sm font-bold"
            >
                <Plus size={16} /> 添加日期
            </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-gray-50/50 pt-16 md:pt-0 scroll-smooth">
        {view === 'calendar' ? (
            <div className="p-4 md:p-8 h-full flex flex-col">
                <header className="mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">日历概览</h2>
                    <p className="text-sm md:text-base text-gray-500 mt-1">管理您的旅行日程和预约提醒。</p>
                </header>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 min-h-0">
                    <CalendarView plans={plans} onSelectDay={navigateToDay} />
                </div>
            </div>
        ) : (
            currentDay ? (
                <div className="p-4 md:p-8 pb-20 md:pb-8">
                    <DayEditor 
                        dayPlan={currentDay} 
                        onUpdateDay={handleUpdateDay} 
                        onDeleteDay={() => handleDeleteDay(currentDay.id)}
                    />
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4 text-center">
                    <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                        <Calendar size={48} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-600">未选择日期</h3>
                    <p className="text-sm">从菜单中选择一天或添加新日期以开始规划。</p>
                    <button 
                        onClick={addNewDay}
                        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                    >
                        创建行程
                    </button>
                </div>
            )
        )}
      </main>
    </div>
  );
};

export default App;