
import React, { useEffect, useRef, useState } from 'react';
import { 
  MapPin, Clock, AlertCircle, CheckCircle2, MoreVertical, ExternalLink, 
  TrendingUp, Filter, Hammer, Zap, Trash2, X, ChevronRight, BarChart3, 
  ShieldAlert, Download, Calendar, Activity, Lock, Key, MessageSquare, List, Map as MapIcon, Search, ChevronDown
} from 'lucide-react';
import { ComplaintReport, ComplaintStatus, Urgency, ComplaintCategory } from '../types';
import { GYONGSAN_CENTER } from '../constants';

declare const L: any;

interface AdminDashboardProps {
  reports: ComplaintReport[];
  onUpdateStatus: (id: string, status: ComplaintStatus) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ reports, onUpdateStatus }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'stats'>('map');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<ComplaintReport | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('gyeongsan_admin_auth') === 'true';
  });
  const [adminToken, setAdminToken] = useState('');

  const filteredReports = reports.filter(r => {
    const statusMatch = filterStatus === 'all' || r.status === filterStatus;
    const categoryMatch = filterCategory === 'all' || r.category === filterCategory;
    const searchMatch = r.location.address?.includes(searchQuery) || r.id.includes(searchQuery) || r.subcategory.includes(searchQuery);
    return statusMatch && categoryMatch && searchMatch;
  });

  const calculateStats = () => {
    const total = reports.length;
    const urgent = reports.filter(r => r.urgency === Urgency.CRITICAL || r.urgency === Urgency.HIGH).length;
    const resolved = reports.filter(r => r.status === ComplaintStatus.RESOLVED).length;
    const slaRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : "0";
    const avgResponseTime = total > 0 ? "42분" : "0분";

    return { total, urgent, slaRate, avgResponseTime, resolved };
  };

  const stats = calculateStats();

  useEffect(() => {
    if (!isAdminAuthenticated) return;
    // Map initialisation logic
    if (mapRef.current && !leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, { zoomControl: false }).setView([GYONGSAN_CENTER.lat, GYONGSAN_CENTER.lng], 13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO'
      }).addTo(leafletMap.current);
      L.control.zoom({ position: 'bottomright' }).addTo(leafletMap.current);
    }

    if (leafletMap.current) {
      leafletMap.current.eachLayer((layer: any) => {
        if (layer instanceof L.CircleMarker) leafletMap.current.removeLayer(layer);
      });

      filteredReports.forEach(report => {
        const color = report.urgency === Urgency.CRITICAL ? '#D32F2F' : 
                      report.urgency === Urgency.HIGH ? '#FF6F00' : '#1565C0';
        
        const marker = L.circleMarker([report.location.lat, report.location.lng], {
          radius: 12,
          fillColor: color,
          color: "#fff",
          weight: 3,
          opacity: 1,
          fillOpacity: 0.9
        }).addTo(leafletMap.current);

        marker.on('click', () => setSelectedReport(report));
      });
    }
  }, [filteredReports, isAdminAuthenticated, activeTab]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminToken === 'gyeongsan2025') {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('gyeongsan_admin_auth', 'true');
    } else {
      alert('유효하지 않은 관리자 토큰입니다.');
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-8 sm:p-12 border border-gray-100 text-center space-y-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 text-[#1565C0] rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Lock size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">경산안심톡 관제 인증</h2>
            <p className="text-gray-500 font-medium text-xs sm:text-sm leading-relaxed">경산시 통합 관제 시스템 보안 접근을 위해<br/>인가된 보안 토큰을 입력해 주세요.</p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password"
                placeholder="ADMIN TOKEN"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-black text-center tracking-widest focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
              />
            </div>
            <button className="w-full bg-[#1565C0] text-white font-black py-4 rounded-2xl hover:bg-[#0D47A1] transition shadow-xl shadow-blue-100">
              인증 및 접속
            </button>
          </form>
          <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest italic leading-none">Confidential Security Area</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 lg:gap-8 pb-10">
      
      {/* PC: Left Sidebar (Filter & Search) */}
      <aside className="hidden lg:flex flex-col w-[320px] shrink-0 gap-6">
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 space-y-8">
          <div className="space-y-4">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">실시간 통합 검색</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="주소, 민원번호 검색" 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">처리 상태 필터</label>
            <div className="grid grid-cols-1 gap-2">
              {['all', ...Object.values(ComplaintStatus)].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-5 py-3 rounded-2xl text-xs font-black text-left transition-all ${filterStatus === s ? 'bg-[#1565C0] text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                >
                  {s === 'all' ? '전체 보기' : s}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50">
             <button className="w-full bg-white border border-gray-200 text-gray-700 font-black py-4 rounded-2xl text-xs flex items-center justify-center gap-2 hover:bg-gray-50 transition shadow-sm">
                <Download size={16} /> 데이터 내보내기 (CSV)
             </button>
          </div>
        </div>

        <div className="bg-[#1565C0] text-white rounded-[2rem] p-8 shadow-xl shadow-blue-100 relative overflow-hidden group">
          <Activity className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition duration-700" />
          <h4 className="text-xs font-black uppercase tracking-widest mb-4 opacity-70">Operation Status</h4>
          <div className="space-y-4 relative z-10">
            <div>
              <p className="text-[10px] font-bold opacity-60">SLA 준수율</p>
              <p className="text-2xl font-black">{stats.slaRate}% <span className="text-xs text-emerald-300 font-bold ml-1">▲ 2.1%</span></p>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${stats.slaRate}%` }}></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col gap-6 lg:gap-8">
        
        {/* Header & Stats (Responsive) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#1565C0] font-black text-[10px] uppercase tracking-[0.2em]">
              <Activity size={16} /> ANSIMTALK LIVE COMMAND
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tighter">통합 관제 실시간 센터</h1>
          </div>
          
          <div className="grid grid-cols-2 sm:flex gap-3">
             <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
               <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
               <span className="text-xs font-black text-gray-900">긴급 {stats.urgent}건</span>
             </div>
             <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
               <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
               <span className="text-xs font-black text-gray-900">정상 가동 중</span>
             </div>
          </div>
        </div>

        {/* Mobile View Toggles */}
        <div className="lg:hidden flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
           <button onClick={() => setActiveTab('map')} className={`flex-grow flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition ${activeTab === 'map' ? 'bg-[#1565C0] text-white shadow-lg' : 'text-gray-500'}`}>
              <MapIcon size={16} /> 지도
           </button>
           <button onClick={() => setActiveTab('list')} className={`flex-grow flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition ${activeTab === 'list' ? 'bg-[#1565C0] text-white shadow-lg' : 'text-gray-500'}`}>
              <List size={16} /> 리스트
           </button>
           <button onClick={() => setActiveTab('stats')} className={`flex-grow flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition ${activeTab === 'stats' ? 'bg-[#1565C0] text-white shadow-lg' : 'text-gray-500'}`}>
              <BarChart3 size={16} /> 통계
           </button>
        </div>

        {/* Dynamic Display Area */}
        <div className="flex-grow flex flex-col gap-8">
           
           {/* Summary Cards (PC & Stats Tab Mobile) */}
           <div className={`grid grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 ${activeTab !== 'stats' && 'hidden lg:grid'}`}>
              {[
                { label: '누적 신고', value: stats.total, color: 'blue', icon: <MessageSquare size={18} /> },
                { label: '조치 완료', value: stats.resolved, color: 'emerald', icon: <CheckCircle2 size={18} /> },
                { label: 'SLA 지표', value: stats.slaRate + '%', color: 'indigo', icon: <Zap size={18} /> },
                { label: '평균 응답', value: stats.avgResponseTime, color: 'orange', icon: <Clock size={18} /> },
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-5 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between h-32 lg:h-40 hover:shadow-xl transition-all group">
                   <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-${item.color}-50 text-${item.color}-600 flex items-center justify-center group-hover:scale-110 transition`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[9px] lg:text-[11px] font-black text-gray-400 uppercase tracking-widest mb-0.5 lg:mb-1">{item.label}</p>
                    <h3 className="text-xl lg:text-3xl font-black text-gray-900">{item.value}</h3>
                  </div>
                </div>
              ))}
           </div>

           {/* Map & List Container */}
           <div className="flex-grow flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8 min-h-[500px]">
              
              {/* Map View */}
              <div className={`lg:col-span-2 bg-white rounded-[2rem] lg:rounded-[3rem] shadow-sm overflow-hidden border border-gray-100 relative ${activeTab !== 'map' && 'hidden lg:block'}`}>
                 <div ref={mapRef} className="absolute inset-0 z-0" />
                 
                 {/* Map Control Overlays */}
                 <div className="absolute top-4 left-4 lg:top-8 lg:left-8 z-10 pointer-events-none">
                    <div className="bg-white/95 backdrop-blur-xl px-4 py-2 lg:px-5 lg:py-3 rounded-xl lg:rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-3 pointer-events-auto">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] lg:text-xs font-black text-gray-800">지능형 위험도 히트맵 가동 중</span>
                    </div>
                 </div>
              </div>

              {/* List View */}
              <div className={`bg-white rounded-[2rem] lg:rounded-[3rem] shadow-sm border border-gray-100 flex flex-col overflow-hidden ${activeTab !== 'list' && 'hidden lg:flex'}`}>
                 <div className="p-6 lg:p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50 shrink-0">
                    <h3 className="font-black text-gray-800 text-sm lg:text-base flex items-center gap-3">
                      <Filter size={20} className="text-[#1565C0]" /> 민원 리스트 ({filteredReports.length})
                    </h3>
                    <button className="p-2 hover:bg-white rounded-xl transition shadow-sm border border-transparent hover:border-gray-200">
                      <MoreVertical size={18} />
                    </button>
                 </div>
                 <div className="flex-grow overflow-y-auto p-4 lg:p-6 space-y-4">
                    {filteredReports.map(report => (
                      <div 
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className={`p-4 lg:p-5 rounded-2xl lg:rounded-[2rem] border-2 transition-all cursor-pointer flex items-center gap-4 lg:gap-5 hover:translate-x-1 ${
                          selectedReport?.id === report.id ? 'bg-blue-50 border-[#1565C0]/30 shadow-lg shadow-blue-100' : 'bg-white border-gray-50 hover:border-gray-100 shadow-sm'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img src={report.image} className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl object-cover shadow-inner" />
                          <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 lg:w-4 lg:h-4 rounded-full border-2 border-white ${
                            report.status === ComplaintStatus.RESOLVED ? 'bg-[#2E7D32]' : 'bg-[#FF6F00]'
                          }`}></div>
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-[9px] lg:text-[10px] font-black uppercase tracking-tighter ${
                              report.urgency === Urgency.CRITICAL ? 'text-red-500' : 'text-[#1565C0]'
                            }`}>{report.department_code}</span>
                            <span className="text-[8px] lg:text-[9px] text-gray-400 font-bold whitespace-nowrap">
                              {new Date(report.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs lg:text-sm font-black text-gray-900 truncate">{report.subcategory}</p>
                          <p className="text-[10px] lg:text-[11px] text-gray-400 font-semibold truncate flex items-center gap-1">
                            <MapPin size={10} /> {report.location.address}
                          </p>
                        </div>
                        <ChevronRight size={18} className="text-gray-300 hidden lg:block" />
                      </div>
                    ))}
                 </div>
              </div>

           </div>
        </div>
      </div>

      {/* Detail Panel (Responsive: Sidebar on PC, Bottom Sheet on Mobile) */}
      {selectedReport && (
        <div className="fixed inset-0 lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[500px] bg-black/40 lg:bg-transparent z-[60] animate-in fade-in duration-300">
           <div className="absolute inset-x-0 bottom-0 lg:inset-y-0 lg:right-0 bg-white shadow-[-40px_0_80px_rgba(0,0,0,0.15)] rounded-t-[3rem] lg:rounded-none lg:border-l border-gray-100 animate-in slide-in-from-bottom lg:slide-in-from-right duration-500 flex flex-col h-[85vh] lg:h-full">
              
              <div className="p-6 lg:p-8 border-b border-gray-50 flex items-center justify-between bg-white shrink-0">
                <div>
                  <span className="text-[9px] lg:text-[11px] font-black text-[#1565C0] tracking-[0.3em] uppercase mb-1 block">Analysis Report</span>
                  <h2 className="text-xl lg:text-2xl font-black text-gray-900 tracking-tight">#{selectedReport.id} 상세 분석</h2>
                </div>
                <button onClick={() => setSelectedReport(null)} className="p-2 sm:p-3 hover:bg-gray-100 rounded-2xl transition-all">
                  <X size={28} />
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto p-6 lg:p-10 space-y-8 lg:space-y-10">
                <div className="group relative aspect-video rounded-3xl lg:rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <img src={selectedReport.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl text-[9px] lg:text-[10px] font-black shadow-lg">원본 이미지</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 lg:gap-6">
                  <div className="bg-gray-50 p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border border-gray-100">
                    <p className="text-[9px] lg:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">처리 상태</p>
                    <select 
                      value={selectedReport.status}
                      onChange={(e) => onUpdateStatus(selectedReport.id, e.target.value as ComplaintStatus)}
                      className="w-full bg-transparent text-xs lg:text-sm font-black text-[#1565C0] outline-none cursor-pointer"
                    >
                      {Object.values(ComplaintStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="bg-gray-50 p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border border-gray-100">
                    <p className="text-[9px] lg:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">긴급 등급</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        selectedReport.urgency === Urgency.CRITICAL ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
                      }`}></div>
                      <span className={`text-xs lg:text-sm font-black ${
                        selectedReport.urgency === Urgency.CRITICAL ? 'text-red-600' : 'text-gray-900'
                      }`}>{selectedReport.urgency}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] lg:text-xs font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                    <ShieldAlert size={14} className="text-[#1565C0]" /> AI 분석 판독문
                  </h4>
                  <div className="bg-slate-900 text-white p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10 space-y-4 lg:space-y-6">
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/10 rounded-xl"><Zap size={16} className="text-emerald-400" /></div>
                          <span className="text-[9px] lg:text-[11px] font-black tracking-widest opacity-60">CONFIDENCE</span>
                        </div>
                        <span className="text-lg lg:text-xl font-black text-emerald-400">{(selectedReport.aiConfidence * 100).toFixed(1)}%</span>
                      </div>
                      <p className="text-sm lg:text-[15px] font-medium leading-relaxed italic text-gray-300">"{selectedReport.aiReasoning}"</p>
                      <div className="flex items-center gap-4 text-[9px] lg:text-[10px] font-black opacity-60 tracking-widest border-t border-white/10 pt-4">
                        <span>RISK: {selectedReport.risk_score}</span>
                        <span>PRIORITY: P{selectedReport.priority}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pb-4">
                  <h4 className="text-[10px] lg:text-xs font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                    <MapPin size={14} className="text-[#1565C0]" /> 현장 위치 데이터
                  </h4>
                  <div className="bg-gray-50 p-5 lg:p-6 rounded-[2rem] border border-gray-100 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-white p-3 rounded-2xl shadow-sm text-[#1565C0] shrink-0"><MapPin size={24} /></div>
                      <div className="space-y-1">
                        <span className="text-xs lg:text-sm font-black text-gray-900 leading-tight block">{selectedReport.location.address}</span>
                        <p className="text-[9px] lg:text-[11px] text-gray-400 font-bold tracking-tight">Accuracy: {selectedReport.location.accuracy || 10}m</p>
                      </div>
                    </div>
                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <a href={`https://maps.google.com/?q=${selectedReport.location.lat},${selectedReport.location.lng}`} target="_blank" className="flex-grow bg-white text-gray-700 border border-gray-200 font-black text-[11px] py-4 rounded-2xl text-center shadow-sm hover:bg-gray-50 transition">Google Maps</a>
                      <a href={`https://map.kakao.com/link/map/${selectedReport.location.address},${selectedReport.location.lat},${selectedReport.location.lng}`} target="_blank" className="flex-grow bg-[#FEE500] text-[#3c1e1e] font-black text-[11px] py-4 rounded-2xl text-center shadow-sm">Kakao Map</a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 lg:p-8 border-t border-gray-50 bg-gray-50/30 shrink-0 backdrop-blur-xl">
                <button className="w-full bg-[#1565C0] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-blue-100 hover:bg-[#0D47A1] transition active:scale-95">
                  부서 지시 전송 (텔레그램) <ExternalLink size={20} />
                </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
