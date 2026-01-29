
import React, { useEffect, useRef, useState } from 'react';
import { 
  MapPin, Clock, AlertCircle, CheckCircle2, ExternalLink, TrendingUp, 
  Filter, Zap, X, BarChart, Activity, Lock, Key, MessageSquare, 
  Map as MapIcon, Search, Route, Car, Signal, AlertTriangle, 
  BrainCircuit, CloudRain, Sun, Snowflake, ChevronRight, Info,
  ShieldAlert
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart as RechartsBarChart, Bar, Cell, Legend
} from 'recharts';
import { ComplaintReport, ComplaintStatus, Urgency, ComplaintCategory, TrafficSegment, DayType, PredictionStat } from '../types.ts';
import { GYONGSAN_CENTER, TRAFFIC_SEGMENTS, HISTORICAL_PATTERNS, WEATHER_CONFIG } from '../constants.ts';

declare const L: any;

interface AdminDashboardProps {
  reports: ComplaintReport[];
  onUpdateStatus: (id: string, status: ComplaintStatus) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ reports, onUpdateStatus }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const trafficLayers = useRef<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'map' | 'analytics'>('map');
  const [showTraffic, setShowTraffic] = useState(false);
  const [weather, setWeather] = useState<'CLEAR' | 'RAIN' | 'SNOW' | 'STORM'>('CLEAR');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('gyeongsan_admin_auth') === 'true';
  });
  const [adminToken, setAdminToken] = useState('');
  const [trafficAlerts, setTrafficAlerts] = useState<{name: string, score: number, reason: string}[]>([]);
  const [selectedReport, setSelectedReport] = useState<ComplaintReport | null>(null);

  // 15분 후 정체 예측 데이터 시뮬레이션
  const [predictionStats] = useState<PredictionStat[]>([
    { hour: '08시', accuracy: 94.2, mae: 3.1 },
    { hour: '10시', accuracy: 97.8, mae: 1.9 },
    { hour: '12시', accuracy: 96.5, mae: 2.4 },
    { hour: '14시', accuracy: 98.1, mae: 1.5 },
    { hour: '16시', accuracy: 93.4, mae: 3.8 },
    { hour: '18시', accuracy: 91.2, mae: 4.9 },
    { hour: '20시', accuracy: 95.7, mae: 2.2 },
    { hour: '22시', accuracy: 98.4, mae: 1.2 },
  ]);

  const [worstLinks] = useState([
    { id: 'TR-03', name: '경산IC 진입로', error: 5.4, samples: 142 },
    { id: 'TR-01', name: '경산역-옥산네거리', error: 4.8, samples: 210 },
    { id: 'TR-05', name: '영남대 서문 도로', error: 4.1, samples: 88 },
    { id: 'TR-02', name: '임당역 사거리', error: 3.2, samples: 156 },
  ]);

  const getDayType = (date: Date): DayType => {
    const day = date.getDay();
    return (day === 0 || day === 6) ? 'WEEKEND' : 'WEEKDAY';
  };

  // Smart Score v3: 4단계 가중치 공식 반영
  const calculateSmartScore = (segment: TrafficSegment): {score: number, level: string, refSpeed: number} => {
    const now = new Date();
    const hour = now.getHours();
    const dayType = getDayType(now);
    
    let timeIdx = 2;
    if (hour < 6) timeIdx = 0;
    else if (hour < 11) timeIdx = 1;
    else if (hour < 17) timeIdx = 2;
    else if (hour < 21) timeIdx = 3;
    else timeIdx = 4;

    const pattern = HISTORICAL_PATTERNS[segment.id];
    const refSpeed = pattern ? pattern[dayType][timeIdx] : 40;
    
    // 1. 속도 감소율 (40%)
    const dropRatio = Math.max(0, (refSpeed - segment.speed) / refSpeed);
    
    // 2. 민원 빈도 (25%)
    const nearbyReports = reports.filter(r => 
      (r.category === ComplaintCategory.ROAD || r.category === ComplaintCategory.TRAFFIC_FACILITY) &&
      new Date(r.createdAt).getTime() > Date.now() - (30 * 60 * 1000)
    ).length;
    const reportsNorm = Math.min(1, nearbyReports / 8);

    // 3. 시간대 가중치 (20%)
    const isPeak = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    const timeWeight = isPeak ? 1.0 : 0.6;

    // 4. 날씨 가중치 (15%)
    const wImpact = (WEATHER_CONFIG[weather].weight - 1) * 3; 

    // 최종 산출
    const score = Math.round(100 * (dropRatio * 0.40 + reportsNorm * 0.25 + timeWeight * 0.20 + wImpact * 0.15));
    
    let level = "원활";
    if (score > 80) level = "심각";
    else if (score > 60) level = "정체";
    else if (score > 30) level = "주의";

    return { score, level, refSpeed };
  };

  const updateTrafficMap = (visible: boolean) => {
    if (!leafletMap.current) return;
    trafficLayers.current.forEach(layer => leafletMap.current.removeLayer(layer));
    trafficLayers.current = [];

    if (visible) {
      const alerts: {name: string, score: number, reason: string}[] = [];
      TRAFFIC_SEGMENTS.forEach(segment => {
        const result = calculateSmartScore(segment);
        
        let color = '#10b981'; // Green
        if (result.score > 80) color = '#ef4444'; // Red
        else if (result.score > 60) color = '#f97316'; // Orange
        else if (result.score > 30) color = '#facc15'; // Yellow
        
        const polyline = L.polyline(segment.path, {
          color: color,
          weight: result.score > 60 ? 12 : 8,
          opacity: 0.8,
          lineJoin: 'round'
        }).addTo(leafletMap.current);

        polyline.bindPopup(`
          <div class="p-3 font-pretendard min-w-[150px]">
            <p class="font-black text-gray-900">${segment.name}</p>
            <div class="mt-2 space-y-1 text-[10px]">
              <p>현재: ${segment.speed}km/h (기준 ${result.refSpeed})</p>
              <p class="font-bold ${result.score > 60 ? 'text-red-500' : 'text-blue-600'}">AI 정체지수: ${result.score}점</p>
              <p class="text-gray-400">상태: ${result.level}</p>
            </div>
          </div>
        `);
        trafficLayers.current.push(polyline);

        if (result.score > 75) {
          alerts.push({ name: segment.name, score: result.score, reason: `${result.level} 단계 정체 감지` });
        }
      });
      setTrafficAlerts(alerts);
    }
  };

  useEffect(() => {
    if (!isAdminAuthenticated || activeTab !== 'map') return;
    if (mapRef.current && !leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, { zoomControl: false }).setView([GYONGSAN_CENTER.lat, GYONGSAN_CENTER.lng], 13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO' }).addTo(leafletMap.current);
    }
    updateTrafficMap(showTraffic);
  }, [isAdminAuthenticated, showTraffic, weather, activeTab]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminToken === 'gyeongsan2025') {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('gyeongsan_admin_auth', 'true');
    } else {
      alert('인가되지 않은 보안 토큰입니다.');
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 text-center border border-gray-100 space-y-10">
          <div className="w-20 h-20 bg-blue-50 text-[#1565C0] rounded-3xl flex items-center justify-center mx-auto"><Lock size={40} /></div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter">경산안심톡 통합관제 인증</h2>
            <p className="text-gray-500 font-bold text-sm">보안 접근을 위해 인가된 관리자 토큰을 입력해 주세요.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="password" placeholder="ADMIN TOKEN" className="w-full bg-gray-50 border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-center font-black tracking-widest outline-none focus:ring-4 focus:ring-blue-500/10" value={adminToken} onChange={(e) => setAdminToken(e.target.value)} />
            </div>
            <button className="w-full bg-[#1565C0] text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 transition active:scale-95">인증 및 접속</button>
          </form>
          <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest">Confidential Security Area</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-8 pb-10">
      
      {/* Dashboard Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#1565C0] font-black text-[10px] tracking-[0.2em] uppercase">
            <Activity size={16} /> GYEONGSAN SMART CITY ENGINE v3
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter">실시간 통합 예측 관제</h1>
        </div>
        
        <div className="flex items-center bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
           <button onClick={() => setActiveTab('map')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'map' ? 'bg-[#1565C0] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>관제 지도</button>
           <button onClick={() => setActiveTab('analytics')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'analytics' ? 'bg-[#1565C0] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>예측 분석</button>
        </div>
      </div>

      {activeTab === 'map' ? (
        <div className="grid lg:grid-cols-3 gap-8 flex-grow min-h-[600px]">
          
          <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-sm border border-gray-100 relative overflow-hidden group">
            <div ref={mapRef} className="absolute inset-0 z-0" />
            
            {/* Overlay Map Controls */}
            <div className="absolute top-8 left-8 z-10 space-y-4">
              <div className="bg-white/95 backdrop-blur px-5 py-3 rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-4 pointer-events-auto">
                <button onClick={() => setShowTraffic(!showTraffic)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all ${showTraffic ? 'bg-[#FF6F00] text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <Route size={14} /> 교통 오버레이 {showTraffic ? 'ON' : 'OFF'}
                </button>
                <div className="h-4 w-px bg-gray-200"></div>
                <div className="flex items-center gap-3">
                   {Object.entries(WEATHER_CONFIG).map(([key, config]) => (
                     <button 
                       key={key} 
                       onClick={() => setWeather(key as any)}
                       className={`p-2 rounded-lg transition-all ${weather === key ? 'bg-blue-50 text-[#1565C0] scale-110 shadow-sm' : 'text-gray-300 hover:text-gray-400'}`}
                       title={config.label}
                     >
                       {key === 'CLEAR' && <Sun size={16} />}
                       {key === 'RAIN' && <CloudRain size={16} />}
                       {key === 'SNOW' && <Snowflake size={16} />}
                       {key === 'STORM' && <Zap size={16} />}
                     </button>
                   ))}
                </div>
              </div>

              {showTraffic && trafficAlerts.length > 0 && (
                <div className="space-y-2 max-w-[280px] pointer-events-auto">
                  {trafficAlerts.map((alert, i) => (
                    <div key={i} className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-left duration-300 border border-red-500">
                      <AlertTriangle size={18} className="shrink-0 mt-0.5 animate-pulse" />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black">{alert.name} 위급</span>
                        <span className="text-[9px] font-medium opacity-80">{alert.reason} (AI 점수: {alert.score})</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="absolute bottom-8 right-8 z-10 pointer-events-none">
               <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white flex items-center gap-3 shadow-2xl">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Live Predictive Monitoring</span>
               </div>
            </div>
          </div>

          <div className="space-y-6 flex flex-col">
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
               <BrainCircuit className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 group-hover:scale-110 transition duration-700" />
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Accuracy Engine</h4>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-black rounded-md">OPTIMIZED</span>
                  </div>
                  <div>
                    <p className="text-4xl font-black">98.2%</p>
                    <p className="text-[11px] font-bold opacity-70 mt-1">15분 후 정체 예측 신뢰도</p>
                  </div>
                  <div className="pt-2 space-y-3">
                    <div className="flex justify-between text-[9px] font-black opacity-50 uppercase"><span>System Load</span><span>Stable</span></div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 rounded-full" style={{ width: '42%' }}></div>
                    </div>
                  </div>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex-grow flex flex-col">
               <h3 className="font-black text-gray-900 mb-6 flex items-center gap-3">
                 <Signal size={20} className="text-[#1565C0]" /> 집중 모니터링 구간
               </h3>
               <div className="space-y-4 flex-grow overflow-y-auto pr-2">
                  {TRAFFIC_SEGMENTS.map(s => {
                    const result = calculateSmartScore(s);
                    return (
                      <div key={s.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-black text-gray-800 group-hover:text-[#1565C0] transition">{s.name}</span>
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-black ${result.score > 60 ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>{result.level}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-grow h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${result.score > 80 ? 'bg-red-500' : result.score > 50 ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ width: `${result.score}%` }}></div>
                          </div>
                          <span className="text-[11px] font-black text-gray-400">{result.score}점</span>
                        </div>
                      </div>
                    );
                  })}
               </div>
               <div className="mt-6 pt-6 border-t border-gray-50">
                  <button className="w-full bg-gray-50 text-gray-400 font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest hover:bg-gray-100 transition">Download Analytics CSV</button>
               </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Analytics Overview KPI Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: '평균 오차(MAE)', value: '2.14', unit: 'km/h', trend: '▼ 0.2', color: 'blue' },
              { label: '레벨 정확도', value: '97.2', unit: '%', trend: '▲ 0.8%', color: 'emerald' },
              { label: '정체 감지 재현율', value: '89.4', unit: '%', trend: '▲ 2.5%', color: 'orange' },
              { label: '학습 데이터 규모', value: '1.42', unit: 'M', trend: '+124k', color: 'indigo' },
            ].map((kpi, i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between h-44 hover:shadow-xl transition-all group">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                  <div className={`p-2 rounded-xl bg-${kpi.color}-50 text-${kpi.color}-600 group-hover:scale-110 transition`}><TrendingUp size={16} /></div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-end gap-1">
                    <h3 className="text-3xl font-black text-gray-900">{kpi.value}</h3>
                    <span className="text-sm font-bold text-gray-400 mb-1">{kpi.unit}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${kpi.trend.includes('▲') || kpi.trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{kpi.trend} 대비</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Chart 1: Hourly Accuracy */}
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-gray-900 text-lg flex items-center gap-3">
                    <Zap size={22} className="text-[#1565C0]" /> 시간대별 예측 정확도 (Accuracy)
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Gyeongsan Urban Traffic Model</p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={predictionStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1565C0" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#1565C0" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 800, fill: '#94a3b8'}} dy={10} />
                    <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 800, fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontWeight: 800}} cursor={{stroke: '#1565C0', strokeWidth: 2}} />
                    <Area type="monotone" dataKey="accuracy" stroke="#1565C0" strokeWidth={5} fillOpacity={1} fill="url(#colorAcc)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: MAE Error Distribution */}
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-gray-900 text-lg flex items-center gap-3">
                    <AlertCircle size={22} className="text-orange-500" /> 시간대별 평균 절대 오차 (MAE)
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Error magnitude by Link ID</p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={predictionStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 800, fill: '#94a3b8'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 800, fill: '#94a3b8'}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontWeight: 800}} />
                    <Bar dataKey="mae" fill="#f97316" radius={[8, 8, 0, 0]} barSize={32}>
                      {predictionStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.mae > 4 ? '#ef4444' : '#f97316'} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Worst Link Table */}
          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
             <div className="flex items-center justify-between">
                <h3 className="font-black text-xl text-gray-900 flex items-center gap-3">
                   <ShieldAlert size={24} className="text-red-500" /> 예측 오차 다발 구간 (Top 4)
                </h3>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Based on last 7 days</span>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full">
                 <thead>
                   <tr className="text-left border-b border-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                     <th className="pb-4 pl-4">구간 정보 (Link ID)</th>
                     <th className="pb-4">분석 샘플 수</th>
                     <th className="pb-4">평균 오차(MAE)</th>
                     <th className="pb-4">신뢰도 등급</th>
                     <th className="pb-4 text-right pr-4">조치</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                   {worstLinks.map((link) => (
                     <tr key={link.id} className="group hover:bg-gray-50/50 transition-all">
                       <td className="py-6 pl-4">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black text-xs">!</div>
                            <div>
                               <p className="font-black text-gray-900 text-sm">{link.name}</p>
                               <p className="text-[10px] font-bold text-gray-400">{link.id}</p>
                            </div>
                         </div>
                       </td>
                       <td className="py-6 text-sm font-black text-gray-900">{link.samples}건</td>
                       <td className="py-6 text-sm font-black text-red-500">{link.error}km/h</td>
                       <td className="py-6">
                          <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-lg">보정 필요</span>
                       </td>
                       <td className="py-6 text-right pr-4">
                          <button className="text-gray-300 hover:text-[#1565C0] transition"><ChevronRight size={20} /></button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>

          {/* AI Automated Insight Report */}
          <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
             <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                <div className="shrink-0 p-8 bg-white/10 rounded-[3rem] backdrop-blur-2xl border border-white/10 shadow-inner">
                  <TrendingUp size={56} className="text-emerald-400" />
                </div>
                <div className="space-y-4 text-center lg:text-left flex-grow">
                   <div className="flex items-center justify-center lg:justify-start gap-3">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/30">WEEKLY INSIGHT</span>
                      <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">2025.01.29 - 2025.02.04</span>
                   </div>
                   <h2 className="text-2xl lg:text-3xl font-black tracking-tight leading-relaxed max-w-2xl">
                     "기상 변수(비) 가중치 적용 시 정체 시작 시간이<br/>
                     평시 대비 <span className="text-emerald-400">18분 조기화</span>되는 경향을 확인했습니다."
                   </h2>
                   <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-6">
                      <div className="flex items-center gap-2 px-5 py-2.5 bg-white/5 rounded-2xl text-[11px] font-black border border-white/5"><Signal size={14} className="text-emerald-400" /> 모델 신뢰도 상향 (0.94)</div>
                      <div className="flex items-center gap-2 px-5 py-2.5 bg-white/5 rounded-2xl text-[11px] font-black border border-white/5"><Car size={14} className="text-blue-400" /> 주말 유동량 가중치 보정됨</div>
                   </div>
                </div>
                <div className="shrink-0">
                   <button className="bg-white text-slate-900 font-black px-10 py-5 rounded-3xl shadow-2xl hover:bg-emerald-400 transition transform hover:scale-105 active:scale-95 text-lg">상세 분석서 보기</button>
                </div>
             </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
