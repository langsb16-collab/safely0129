
export enum ComplaintStatus {
  RECEIVED = '접수됨',
  ASSIGNED = '부서배정',
  IN_PROGRESS = '처리중',
  RESOLVED = '처리완료',
  REJECTED = '반려됨'
}

export enum ComplaintCategory {
  ROAD = 'ROAD',
  TRAFFIC_FACILITY = 'TRAFFIC_FACILITY',
  ENV_WASTE = 'ENV_WASTE',
  SAFETY_OBSTACLE = 'SAFETY_OBSTACLE',
  DRAINAGE = 'DRAINAGE',
  UNKNOWN = 'UNKNOWN'
}

export enum Urgency {
  LOW = '일반',
  MEDIUM = '보통',
  HIGH = '긴급',
  CRITICAL = '매우긴급'
}

export interface LocationInfo {
  lat: number;
  lng: number;
  address?: string;
  accuracy?: number; 
  admin_area?: string; 
  road_name?: string; 
  location_source?: 'gps' | 'wifi' | 'cell';
}

export interface ComplaintReport {
  id: string;
  userId: string;
  createdAt: string;
  location: LocationInfo;
  image: string;
  description: string;
  status: ComplaintStatus;
  category: ComplaintCategory;
  subcategory: string;
  urgency: Urgency;
  department: string;
  department_code: string;
  aiConfidence: number;
  aiReasoning: string;
  risk_score: number;
  priority: number;
}

export interface AIClassificationResult {
  category: ComplaintCategory;
  subcategory: string;
  urgency: Urgency;
  department: string;
  department_code: string;
  confidence: number;
  reasoning: string;
  risk_score: number;
  priority: number;
}

export type DayType = 'WEEKDAY' | 'WEEKEND';

export interface TrafficSegment {
  id: string;
  name: string;
  path: [number, number][];
  status: 'GREEN' | 'ORANGE' | 'RED' | 'BLACK';
  speed: number;
  isHabitual: boolean;
  incidentDescription?: string;
  predictionScore?: number;
  ref_speed_kmh?: number;
}

export interface PredictionLog {
  link_id: string;
  hour: string;
  dayType: DayType;
  pred_speed: number;
  actual_speed: number;
  error: number;
  isCorrect: boolean;
}

export interface PredictionStat {
  hour: string;
  accuracy: number;
  mae: number;
}
