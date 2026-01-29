
import React from 'react';
import { MapPin, Calendar, ArrowRight, CheckCircle2, Clock, RotateCw, AlertTriangle, ChevronRight, Zap } from 'lucide-react';
import { ComplaintReport, ComplaintStatus, Urgency } from '../types';

interface ReportListProps {
  reports: ComplaintReport[];
}

const ReportList: React.FC<ReportListProps> = ({ reports }) => {
  if (reports.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-10 text-center space-y-6">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-gray-200 shadow-sm border border-gray-50">
          <AlertTriangle size={48} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-gray-900">제출된 신고가 없습니다</h3>
          <p className="text-gray-400 font-medium">현장에서 사진을 촬영하여 경산안심톡에 제보해주세요.</p>
        </div>
      </div>
    );
  }

  const getStatusStyle = (status: ComplaintStatus) => {
    switch (status) {
      case ComplaintStatus.RESOLVED: 
        return { bg: 'bg-[#E8F5E9]', text: 'text-[#2E7D32]', icon: <CheckCircle2 size={14} />, label: '조치 완료' };
      case ComplaintStatus.IN_PROGRESS: 
        return { bg: 'bg-[#FFF3E0]', text: 'text-[#FF6F00]', icon: <RotateCw size={14} className="animate-spin-slow" />, label: '처리 중' };
      default: 
        return { bg: 'bg-[#E3F2FD]', text: 'text-[#1565C0]', icon: <Clock size={14} />, label: '접수 대기' };
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter">나의 신고 내역</h2>
          <p className="text-gray-400 font-bold text-sm">경산안심톡을 통해 접수한 {reports.length}건의 내역입니다.</p>
        </div>
        <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm text-[#1565C0]">
          <Zap size={24} />
        </div>
      </div>
      
      <div className="space-y-6">
        {reports.map((report) => {
          const style = getStatusStyle(report.status);
          return (
            <div key={report.id} className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-50 overflow-hidden flex flex-col sm:flex-row group hover:border-[#1565C0]/30 transition-all duration-300">
              <div className="w-full sm:w-56 h-48 sm:h-auto bg-gray-100 relative overflow-hidden">
                <img src={report.image} alt="Report" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-xl text-[10px] font-black text-white shadow-xl backdrop-blur-md ${
                  report.urgency === Urgency.HIGH || report.urgency === Urgency.CRITICAL ? 'bg-[#D32F2F]' : 'bg-[#1565C0]'
                }`}>
                  {report.urgency}
                </div>
              </div>
              
              <div className="p-8 flex-grow space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-[#1565C0] uppercase tracking-widest">{report.department_code}</span>
                      <span className="text-gray-300 font-bold">|</span>
                      <h3 className="font-black text-gray-900 text-lg tracking-tight">{report.subcategory}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-bold">
                      <Calendar size={14} />
                      {new Date(report.createdAt).toLocaleString('ko-KR', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black ${style.bg} ${style.text} border border-white/20 shadow-sm`}>
                    {style.icon}
                    {style.label}
                  </div>
                </div>

                <p className="text-sm text-gray-500 font-medium leading-relaxed line-clamp-2">{report.description}</p>

                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 font-bold max-w-[200px]">
                    <MapPin size={14} className="text-[#1565C0] shrink-0" />
                    <span className="truncate">{report.location.address}</span>
                  </div>
                  <button className="text-[#1565C0] text-xs font-black flex items-center gap-1 group/btn px-4 py-2 hover:bg-blue-50 rounded-xl transition">
                    상세 조회 <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#1565C0] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-xl shrink-0">
            <Clock className="text-[#80d8ff]" size={32} />
          </div>
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-sm font-black text-[#80d8ff] uppercase tracking-widest">Processing Policy</h4>
            <p className="text-[13px] font-medium text-white/90 leading-relaxed">
              경산안심톡 플랫폼은 접수된 모든 민원을 <span className="text-white font-bold">1시간 내에 분석 및 부서 배정</span>하는 것을 목표로 운영됩니다. 처리 과정은 카카오 알림톡 등을 통해 안내됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportList;
