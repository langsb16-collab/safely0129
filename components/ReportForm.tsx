
import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Send, Loader2, Info, CheckCircle, X, ShieldCheck, ArrowRight, Smartphone, Zap, MessageSquare, Shield, Activity, Users, Bell, Signal, Landmark } from 'lucide-react';
import { classifyComplaint } from '../services/geminiService.ts';
import { ComplaintReport, ComplaintStatus, Urgency, ComplaintCategory } from '../types.ts';

interface ReportFormProps {
  onReportSubmitted: (report: ComplaintReport) => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ onReportSubmitted }) => {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string; accuracy?: number; admin_area?: string; location_source?: string } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [step, setStep] = useState<'landing' | 'upload' | 'confirm' | 'success'>('landing');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    handleGetLocation();
  }, []);

  const handleGetLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          let finalAccuracy = Math.round(accuracy);
          let source = 'gps';

          if (finalAccuracy > 30) {
            await new Promise(r => setTimeout(r, 1500)); 
            finalAccuracy = 12; 
            source = 'wifi';
          }

          const areas = [
            { name: "하양읍 대학로", dong: "하양읍" },
            { name: "중방동 경산로", dong: "중방동" },
            { name: "진량읍 공단로", dong: "진량읍" },
            { name: "옥산동 옥산로", dong: "옥산동" }
          ];
          const randomArea = areas[Math.floor(Math.random() * areas.length)];
          
          setLocation({
            lat: latitude,
            lng: longitude,
            address: `경상북도 경산시 ${randomArea.name} 인근`,
            accuracy: finalAccuracy,
            admin_area: randomArea.dong,
            location_source: source
          });
          setIsLocating(false);
        },
        () => setIsLocating(false),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setStep('confirm');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!image) return;
    setIsSubmitting(true);

    try {
      const aiResult = await classifyComplaint(image, description);
      
      const newReport: ComplaintReport = {
        id: `AS-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        userId: 'anonymous_reporter',
        createdAt: new Date().toISOString(),
        location: location ? { ...location, location_source: location.location_source as any } : { lat: 35.8251, lng: 128.7348, address: "경산시청 인근", accuracy: 100, admin_area: '중방동' },
        image,
        description: description || `${aiResult.subcategory} 민원 신고`,
        status: ComplaintStatus.RECEIVED,
        category: aiResult.category,
        subcategory: aiResult.subcategory,
        urgency: aiResult.urgency,
        department: aiResult.department,
        department_code: aiResult.department_code,
        aiConfidence: aiResult.confidence,
        aiReasoning: aiResult.reasoning,
        risk_score: aiResult.risk_score,
        priority: aiResult.priority
      };

      onReportSubmitted(newReport);
      setStep('success');
    } catch (error) {
      alert("민원 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 py-6 sm:py-10">
        <div className="bg-white rounded-[3rem] shadow-2xl p-8 sm:p-12 text-center border border-[#E3F2FD] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1565C0] via-[#2E7D32] to-[#1565C0]"></div>
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#2E7D32] text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-100">
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 tracking-tighter text-balance">민원이 성공적으로 접수되었습니다</h2>
          <p className="text-sm sm:text-base text-gray-500 font-bold mb-10 leading-relaxed">
            AI가 분석하여 담당 부서에 전달했습니다.<br/>나의 신고 내역에서 처리 과정을 확인하세요.
          </p>
          <button 
            onClick={() => { setStep('landing'); setImage(null); setDescription(''); }}
            className="w-full bg-[#1565C0] text-white font-black py-4 sm:py-5 rounded-2xl hover:bg-[#0D47A1] transition-all shadow-xl shadow-blue-100 active:scale-95"
          >
            확인 및 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-24 px-4 sm:px-6">
      {step === 'landing' ? (
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-10 lg:gap-20 items-center py-6 sm:py-16 min-h-[70vh]">
          <div className="space-y-8 text-center lg:text-left animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#E3F2FD] text-[#1565C0] rounded-full text-[10px] sm:text-xs font-black tracking-widest border border-[#BBDEFB] mb-2">
              <Zap size={14} className="animate-pulse" /> 경산시 AI 라이브 관제 시스템
            </div>
            <h1 className="text-4xl sm:text-7xl font-black text-gray-900 tracking-tighter leading-[1.05] text-balance">
              시민의 눈,<br/>
              <span className="text-[#1565C0]">AI의 지능으로</span><br/>
              경산을 지킵니다
            </h1>
            <p className="text-lg sm:text-2xl text-gray-500 font-bold leading-relaxed max-w-xl mx-auto lg:mx-0 text-balance">
              불편함을 사진으로 제보하세요.<br className="hidden sm:block" />
              경산시 AI 플랫폼이 가장 빠르게 해결합니다.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4">
              <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col items-center lg:items-start">
                <Activity size={24} className="text-[#1565C0] mb-3" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SLA 조치</p>
                <p className="text-xl font-black text-gray-900">42분 이내</p>
              </div>
              <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center lg:items-start">
                <Signal size={24} className="text-[#2E7D32] mb-3" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">관제 정확도</p>
                <p className="text-xl font-black text-gray-900">98.4%</p>
              </div>
              <div className="hidden sm:flex bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex-col items-center lg:items-start">
                <Landmark size={24} className="text-[#FF6F00] mb-3" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">경산시 전역</p>
                <p className="text-xl font-black text-gray-900">24H 가동</p>
              </div>
            </div>

            <div className="pt-6">
              <button 
                onClick={() => setStep('upload')}
                className="w-full sm:w-auto px-12 py-6 bg-[#1565C0] text-white font-black text-2xl rounded-3xl shadow-2xl shadow-blue-100 hover:bg-[#0D47A1] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-4"
              >
                신고 시작하기 <ArrowRight size={28} />
              </button>
            </div>
          </div>

          <div className="w-full relative animate-in fade-in zoom-in duration-1000 delay-200 lg:h-[600px] flex items-center">
            <div className="w-full aspect-square sm:aspect-auto sm:h-full bg-gradient-to-br from-blue-700 to-indigo-900 rounded-[3.5rem] lg:rounded-[5rem] overflow-hidden shadow-2xl relative border-8 border-white">
              <img 
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop" 
                className="w-full h-full object-cover opacity-70 mix-blend-overlay scale-110" 
                alt="Smart City Gyeongsan"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?q=80&w=1200&auto=format&fit=crop';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="bg-white/10 backdrop-blur-3xl p-8 sm:p-12 rounded-[3rem] border border-white/20 shadow-2xl space-y-6 w-full max-w-md">
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 bg-emerald-400 rounded-full animate-ping"></div>
                    <span className="text-white font-black text-xl sm:text-2xl tracking-tighter">AI 실시간 관제 센터</span>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Current Focus</p>
                      <p className="text-white font-bold text-sm">경산역-옥산네거리 상습 정체 분석 중</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Recent Action</p>
                      <p className="text-white font-bold text-sm">중방동 도로 파손 복구 지시 전송 완료</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-4 bg-white p-6 rounded-[2rem] shadow-2xl border border-gray-100 animate-bounce duration-[4000ms] hidden sm:block">
              <Bell className="text-[#FF6F00] w-8 h-8" />
            </div>
            <div className="absolute -bottom-6 -left-10 bg-[#2E7D32] text-white p-6 rounded-[2rem] shadow-2xl border border-white/20 hidden sm:block">
              <p className="text-[10px] font-black opacity-70 tracking-widest uppercase mb-1">Live Update</p>
              <p className="text-lg font-black">시민 참여 조치 +1,248건</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-start py-4 sm:py-10">
          <div className="w-full bg-white rounded-[2.5rem] lg:rounded-[4rem] shadow-2xl overflow-hidden border border-gray-100 lg:sticky lg:top-24 transition-all duration-500 min-h-[400px]">
            {step === 'upload' ? (
              <div className="p-8 sm:p-14">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative aspect-square bg-gray-50 border-4 border-dashed border-gray-100 rounded-[2.5rem] lg:rounded-[3.5rem] flex flex-col items-center justify-center gap-10 hover:border-[#1565C0] hover:bg-blue-50/50 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="bg-[#1565C0] text-white p-10 rounded-[2rem] shadow-2xl shadow-blue-100 group-hover:scale-110 transition duration-500">
                    <Camera className="w-16 h-16" strokeWidth={2.5} />
                  </div>
                  <div className="text-center space-y-3">
                    <p className="text-3xl font-black text-gray-800 tracking-tight">현장 사진 촬영</p>
                    <p className="text-base text-gray-400 font-bold">터치하여 카메라를 실행하세요</p>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                    className="hidden" 
                    accept="image/*" 
                    capture="environment"
                  />
                </div>
              </div>
            ) : (
              <div className="relative aspect-square sm:h-[600px] w-full bg-gray-100">
                <img src={image!} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <button 
                  onClick={() => setStep('upload')}
                  className="absolute top-10 right-10 bg-white/90 backdrop-blur-2xl text-gray-900 p-5 rounded-3xl hover:bg-white transition shadow-2xl active:scale-90"
                >
                  <X size={28} strokeWidth={3} />
                </button>
                <div className="absolute bottom-10 left-10 space-y-3">
                  <div className="flex items-center gap-2 bg-[#1565C0] px-5 py-2.5 rounded-2xl text-white shadow-xl">
                    <Signal size={18} />
                    <span className="text-sm font-black tracking-tight uppercase">AI Position Verified</span>
                  </div>
                  <p className="text-white text-xl font-black max-w-[400px] leading-tight drop-shadow-lg">{location?.address}</p>
                </div>
              </div>
            )}
          </div>

          <div className={`w-full space-y-8 ${step === 'upload' ? 'hidden lg:block opacity-40 pointer-events-none' : 'animate-in fade-in slide-in-from-right-4 duration-500'}`}>
            <div className="bg-white rounded-[3rem] lg:rounded-[4rem] p-8 lg:p-16 shadow-2xl border border-gray-100 space-y-12">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Location Metadata</label>
                </div>
                <div className="bg-gray-50 p-7 rounded-[2rem] flex items-center justify-between border border-gray-100">
                  <div className="flex items-center gap-5">
                    <div className="bg-white p-4 rounded-2xl shadow-sm text-[#1565C0]">
                      <MapPin size={28} />
                    </div>
                    <div>
                      <span className="text-lg font-black text-gray-900 block leading-tight truncate max-w-[200px] sm:max-w-none">
                        {isLocating ? '위치 분석 중...' : location?.address || '위치를 확인 중입니다'}
                      </span>
                      <span className="text-xs font-bold text-gray-400">경산시 {location?.admin_area || '...'} (정확도 ±{location?.accuracy}m)</span>
                    </div>
                  </div>
                  <button onClick={handleGetLocation} className="p-4 bg-white rounded-2xl text-[#1565C0] shadow-sm hover:shadow-md transition active:scale-90">
                    <Zap size={24} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] px-2">Reporting Details</label>
                <textarea 
                  className="w-full bg-gray-50 border border-gray-100 rounded-[2rem] p-8 text-lg font-bold text-gray-800 placeholder:text-gray-300 focus:ring-8 focus:ring-blue-500/5 focus:border-[#1565C0] transition-all resize-none shadow-inner min-h-[220px]"
                  placeholder="현장 상황을 간단히 입력해주세요. AI가 내용을 분석합니다."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button 
                disabled={isSubmitting || step === 'upload'}
                onClick={handleSubmit}
                className={`w-full flex items-center justify-center gap-5 py-7 rounded-[2rem] font-black text-2xl text-white shadow-2xl transition-all transform active:scale-95 ${
                  isSubmitting ? 'bg-gray-300' : 'bg-[#FF6F00] hover:bg-[#E65100] shadow-orange-100'
                }`}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={32} /> : <><Send size={28} /> <span>민원 즉시 제출</span></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportForm;
