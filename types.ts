export type ActivityType = 'breakfast' | 'morning' | 'lunch' | 'afternoon' | 'dinner';

export type TransportMode = 'subway' | 'car' | 'walk';

export interface SubwaySegment {
  id: string;
  lineName: string; // e.g., "1号线八通线"
  lineColor: string; // Hex code
  startStation: string;
  endStation: string;
  stationCount: number;
  direction?: string; // e.g., "安河桥北方向"
  status?: string; // e.g., "运营正常"
}

export interface TransportRoute {
  id: string;
  mode: TransportMode;
  totalDurationMinutes: number;
  totalDistanceKm: number;
  price?: number;
  startLocation: string;
  endLocation: string;
  segments: SubwaySegment[]; // Only used if mode === 'subway'
}

export interface ActivityData {
  id: string;
  type: ActivityType;
  title: string;
  location?: string;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  requiresReservation: boolean;
  reservationAdvanceDays?: number; // How many days in advance
  reservationTime?: string; // HH:mm Specific time tickets are released
  
  // Transport TO this activity
  transport?: TransportRoute; 
}

export interface DayPlan {
  id: string;
  date: string; // ISO Date String YYYY-MM-DD
  activities: ActivityData[];
}