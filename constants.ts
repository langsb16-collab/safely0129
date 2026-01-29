
import { ComplaintCategory, Urgency, ComplaintStatus, ComplaintReport, TrafficSegment, DayType } from './types';

export const DEPARTMENTS = {
  [ComplaintCategory.ROAD]: '도로철도과',
  [ComplaintCategory.ENV_WASTE]: '자원순환과',
  [ComplaintCategory.SAFETY_OBSTACLE]: '안전총괄과',
  [ComplaintCategory.TRAFFIC_FACILITY]: '교통행정과',
  [ComplaintCategory.DRAINAGE]: '안전총괄과',
  [ComplaintCategory.UNKNOWN]: '민원여권과'
};

export const MOCK_REPORTS: ComplaintReport[] = [
  {
    id: 'GS-7F2A',
    userId: 'user_123',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    location: { lat: 35.8242, lng: 128.7384, address: '경산시 중방동 844', accuracy: 5, admin_area: '중방동', road_name: '경산로' },
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=1000&auto=format&fit=crop',
    description: '차도 중앙에 큰 포트홀이 있어 타이어가 손상될 것 같습니다.',
    status: ComplaintStatus.ASSIGNED,
    category: ComplaintCategory.ROAD,
    subcategory: 'POTHOLE',
    urgency: Urgency.HIGH,
    department: '도로철도과',
    department_code: 'ROAD',
    aiConfidence: 0.95,
    aiReasoning: '이미지 내 뚜렷한 도로 파손 확인 및 간선도로 위치 고려. 교통량 밀집 지역으로 빠른 조치 필요.',
    risk_score: 85,
    priority: 1
  }
];

export const GYONGSAN_CENTER = { lat: 35.8251, lng: 128.7348 };

// 날씨 가중치 (Smart Score v3 반영용)
export const WEATHER_CONFIG = {
  CLEAR: { label: '맑음', weight: 1.0, icon: 'Sun' },
  RAIN: { label: '비', weight: 1.15, icon: 'CloudRain' },
  SNOW: { label: '눈', weight: 1.35, icon: 'Snowflake' },
  STORM: { label: '폭풍', weight: 1.45, icon: 'Zap' }
};

// 요일(DayType)별 24시간을 5개 구간으로 나눈 평균 속도
export const HISTORICAL_PATTERNS: Record<string, Record<DayType, number[]>> = {
  'TR-01': {
    WEEKDAY: [45, 18, 38, 15, 42], 
    WEEKEND: [48, 40, 42, 35, 46]
  },
  'TR-02': {
    WEEKDAY: [50, 25, 40, 20, 48],
    WEEKEND: [55, 45, 48, 42, 52]
  },
  'TR-03': {
    WEEKDAY: [60, 20, 55, 12, 58],
    WEEKEND: [70, 50, 65, 45, 68]
  },
  'TR-04': {
    WEEKDAY: [45, 40, 45, 35, 45],
    WEEKEND: [48, 45, 48, 42, 48]
  }
};

export const TRAFFIC_SEGMENTS: TrafficSegment[] = [
  { id: 'TR-01', name: "경산역-옥산네거리", path: [[35.8234, 128.7303], [35.8318, 128.7246]], status: "RED", speed: 12, isHabitual: true },
  { id: 'TR-02', name: "영남대 앞 삼거리", path: [[35.8361, 128.7530], [35.8405, 128.7580]], status: "ORANGE", speed: 24, isHabitual: true },
  { id: 'TR-03', name: "경산IC 진입로", path: [[35.8675, 128.8155], [35.8620, 128.8080]], status: "RED", speed: 8, isHabitual: true },
  { id: 'TR-04', name: "시청사거리-중방동", path: [[35.8251, 128.7348], [35.8242, 128.7384]], status: "GREEN", speed: 45, isHabitual: false }
];
