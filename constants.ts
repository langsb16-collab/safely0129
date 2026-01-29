
import { ComplaintCategory, Urgency, ComplaintStatus, ComplaintReport } from './types';

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
    location: { 
      lat: 35.8242, 
      lng: 128.7384, 
      address: '경산시 중방동 844', 
      accuracy: 5,
      admin_area: '중방동',
      road_name: '경산로'
    },
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
  },
  {
    id: 'GS-3B9C',
    userId: 'user_456',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    location: { 
      lat: 35.8321, 
      lng: 128.7512, 
      address: '경산시 계양동 123', 
      accuracy: 12,
      admin_area: '계양동',
      road_name: '대학로'
    },
    image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=1000&auto=format&fit=crop',
    description: '공원 입구에 쓰레기가 무단투기 되어 악취가 심합니다.',
    status: ComplaintStatus.IN_PROGRESS,
    category: ComplaintCategory.ENV_WASTE,
    subcategory: 'ILLEGAL_DUMPING',
    urgency: Urgency.MEDIUM,
    department: '자원순환과',
    department_code: 'ENV',
    aiConfidence: 0.88,
    aiReasoning: '다량의 규격외 쓰레기 봉투 및 오물 노출 확인. 인근 유동인구가 많은 공원 진입로임.',
    risk_score: 60,
    priority: 3
  }
];

export const GYONGSAN_CENTER = { lat: 35.8251, lng: 128.7348 };
