import { DayPlan } from '../types';
import { MOCK_INITIAL_PLAN } from '../constants';
import { db } from './firebase.ts';
// @ts-ignore
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';

// 集合名称 (相当于数据库中的表名)
const COLLECTION_NAME = 'travel_plans';
const LOCAL_STORAGE_KEY = 'beijing_travel_data';

export const DataService = {
  /**
   * 监听数据变化 (实时同步)
   */
  subscribeToPlans: (callback: (plans: DayPlan[]) => void) => {
    // 1. 如果配置了 Firebase，使用云数据库
    if (db) {
      // 实时监听 Firestore 变化
      const unsubscribe = onSnapshot(collection(db, COLLECTION_NAME), (snapshot: any) => {
        const plans: DayPlan[] = [];
        snapshot.forEach((doc: any) => {
          plans.push(doc.data() as DayPlan);
        });
        callback(plans);
      }, (error: any) => {
        console.error("监听数据库失败:", error);
      });
      return unsubscribe;
    } 
    
    // 2. 否则使用本地存储 (LocalStorage)
    else {
      const loadLocal = () => {
        try {
          const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (stored) {
            callback(JSON.parse(stored));
          } else {
            // 第一次加载，写入默认数据
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(MOCK_INITIAL_PLAN));
            callback(MOCK_INITIAL_PLAN);
          }
        } catch (e) {
          console.error("读取本地存储失败", e);
          callback(MOCK_INITIAL_PLAN);
        }
      };
      
      loadLocal();
      // 本地存储不需要真正的 unsubscribe，返回空函数
      return () => {};
    }
  },

  /**
   * 保存或更新某一天的计划
   */
  saveDay: async (day: DayPlan) => {
    if (db) {
      try {
        await setDoc(doc(db, COLLECTION_NAME, day.id), day);
      } catch (e) {
        console.error("保存到云端失败", e);
        alert("保存失败，请检查网络");
      }
    } else {
      // 本地保存
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      let plans: DayPlan[] = stored ? JSON.parse(stored) : [];
      const index = plans.findIndex(p => p.id === day.id);
      if (index >= 0) {
        plans[index] = day;
      } else {
        plans.push(day);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(plans));
      
      // 触发一个自定义事件，通知 App 更新 (因为 LocalStorage 不是响应式的)
      window.dispatchEvent(new Event('local-storage-updated'));
    }
  },

  /**
   * 删除某一天
   */
  deleteDay: async (dayId: string) => {
    if (db) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, dayId));
      } catch (e) {
        console.error("删除失败", e);
      }
    } else {
      // 本地删除
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        let plans: DayPlan[] = JSON.parse(stored);
        plans = plans.filter(p => p.id !== dayId);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(plans));
        window.dispatchEvent(new Event('local-storage-updated'));
      }
    }
  }
};
