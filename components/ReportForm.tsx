
import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Send, Loader2, Info, CheckCircle, X, ShieldCheck, ArrowRight, Smartphone, Zap, MessageSquare, Shield, Activity, Users, BellRing } from 'lucide-react';
import { classifyComplaint } from '../services/geminiService';
import { ComplaintReport, ComplaintStatus, Urgency, ComplaintCategory } from '../types';

interface ReportFormProps {
  onReportSubmitted: (report: ComplaintReport) => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ onReportSubmitted }) => {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string; accuracy?: number; admin_area?: string } | null>(null);
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
            accuracy: Math.round(accuracy),
            admin_area: randomArea.dong
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
        location: location || { lat: 35.8251, lng: 128.7348, address: "경산시청 인근", accuracy: 100, admin_area: '중방동' },
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

  // 성공 화면
  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 py-6 sm:py-10">
        <div className="bg-white rounded-[3rem] shadow-2xl p-8 sm:p-12 text-center border border-[#E3F2FD] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1565C0] via-[#2E7D32] to-[#1565C0]"></div>
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#2E7D32] text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-100">
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 tracking-tighter">접수 완료!</h2>
          <p className="text-sm sm:text-base text-gray-500 font-bold mb-10 leading-relaxed">
            AI가 민원을 분석하여 담당 부서에 <span className="text-[#1565C0]">즉각 전달</span>했습니다. 경산안심톡은 더 안전한 경산을 위해 함께합니다.
          </p>
          <button 
            onClick={() => { setStep('landing'); setImage(null); setDescription(''); }}
            className="w-full bg-[#1565C0] text-white font-black py-4 sm:py-5 rounded-2xl hover:bg-[#0D47A1] transition-all shadow-xl shadow-blue-100 active:scale-95"
          >
            추가 신고하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-24">
      {step === 'landing' ? (
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-10 lg:gap-20 items-center py-6 sm:py-12">
          {/* Hero Content */}
          <div className="space-y-8 text-center lg:text-left animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#E3F2FD] text-[#1565C0] rounded-full text-[10px] sm:text-xs font-black tracking-widest border border-[#BBDEFB] mb-2">
              <Zap size={14} className="animate-pulse" /> 경산시 AI 실시간 관제 중
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tighter leading-[1.1]">
              "찍고 보내면,<br/>
              <span className="text-[#1565C0]">경산이</span> 움직입니다"
            </h1>
            <p className="text-base sm:text-xl text-gray-500 font-bold leading-relaxed max-w-xl mx-auto lg:mx-0">
              사진 한 장으로 우리 동네의 불편함을 해결하세요.<br className="hidden sm:block" />
              AI가 즉시 분석하고 가장 빠른 부서에 배정합니다.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                <Activity size={20} className="text-[#1565C0] mb-2 mx-auto lg:mx-0" />
                <p className="text-[10px] font-black text-gray-400 uppercase">SLA 대응</p>
                <p className="text-lg font-black text-gray-900">1시간내</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <Users size={20} className="text-[#2E7D32] mb-2 mx-auto lg:mx-0" />
                <p className="text-[10px] font-black text-gray-400 uppercase">참여 시민</p>
                <p className="text-lg font-black text-gray-900">1.2k+</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <Shield size={20} className="text-[#FF6F00] mb-2 mx-auto lg:mx-0" />
                <p className="text-[10px] font-black text-gray-400 uppercase">안전지수</p>
                <p className="text-lg font-black text-gray-900">98%</p>
              </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={() => setStep('upload')}
                className="w-full sm:w-auto px-10 py-5 bg-[#FF6F00] text-white font-black text-xl rounded-2xl shadow-2xl shadow-orange-100 hover:bg-[#E65100] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
              >
                신고 시작하기 <ArrowRight size={24} />
              </button>
            </div>
          </div>

          {/* Visual Area */}
          <div className="w-full relative animate-in fade-in zoom-in duration-1000 delay-200">
            <div className="aspect-square bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[3rem] lg:rounded-[5rem] overflow-hidden shadow-2xl relative">
              <img 
                src="https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?q=80&w=1200&auto=format&fit=crop" 
                className="w-full h-full object-cover opacity-60 mix-blend-overlay" 
                alt="Smart City Gyeongsan"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/10 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/20 shadow-2xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
                    <span className="text-white font-black text-lg">AI 관제 시스템 가동 중</span>
                  </div>
                  <p className="text-white/80 text-sm font-medium">현재 중방동, 하양읍 일대 민원 집중 관리</p>
                </div>
              </div>
            </div>
            {/* Floating Badges */}
            <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 animate-bounce duration-[3000ms]">
              <BellRing className="text-[#FF6F00]" />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-[#2E7D32] text-white p-5 rounded-2xl shadow-2xl border border-white/20">
              <p className="text-[10px] font-black opacity-70">실시간 조치</p>
              <p className="text-base font-black">환경 정비 완료 +1</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-start py-4 sm:py-8">
          
          {/* Media / Preview Card */}
          <div className="w-full bg-white rounded-[2.5rem] lg:rounded-[3.5rem] shadow-2xl overflow-hidden border border-gray-100 lg:sticky lg:top-24 transition-all duration-500">
            {step === 'upload' ? (
              <div className="p-8 sm:p-12">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative aspect-square bg-gray-50 border-4 border-dashed border-gray-100 rounded-[2.5rem] lg:rounded-[3rem] flex flex-col items-center justify-center gap-8 hover:border-[#1565C0] hover:bg-blue-50/50 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="bg-[#1565C0] text-white p-8 rounded-3xl shadow-2xl shadow-blue-100 group-hover:scale-110 transition duration-500">
                    <Camera className="w-12 h-12" strokeWidth={2.5} />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-2xl font-black text-gray-800 tracking-tight">현장 사진 업로드</p>
                    <p className="text-sm text-gray-400 font-bold">터치하여 카메라를 실행하세요</p>
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
              <div className="relative aspect-square bg-gray-100">
                <img src={image!} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <button 
                  onClick={() => setStep('upload')}
                  className="absolute top-8 right-8 bg-white/90 backdrop-blur-2xl text-gray-900 p-4 rounded-2xl hover:bg-white transition shadow-2xl active:scale-90"
                >
                  <X size={24} strokeWidth={3} />
                </button>
                <div className="absolute bottom-8 left-8 space-y-2">
                  <div className="flex items-center gap-2 bg-[#1565C0]/90 backdrop-blur px-4 py-2 rounded-xl text-white">
                    <MapPin size={16} />
                    <span className="text-xs font-black tracking-tight">정밀 위치 확인됨</span>
                  </div>
                  <p className="text-white/90 text-[13px] font-bold pl-1 max-w-[300px] leading-relaxed">{location?.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Form Content */}
          <div className={`w-full space-y-8 ${step === 'upload' ? 'hidden lg:block opacity-40 pointer-events-none' : 'animate-in fade-in slide-in-from-right-4 duration-500'}`}>
            <div className="bg-white rounded-[2.5rem] lg:rounded-[3.5rem] p-8 lg:p-14 shadow-2xl border border-gray-100 space-y-12">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Occurrence Location</label>
                  {location?.accuracy && (
                    <span className="text-[10px] font-bold text-[#2E7D32] flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-[#2E7D32] rounded-full animate-pulse"></div> Precision: {location.accuracy}m
                    </span>
                  )}
                </div>
                <div className="bg-gray-50 p-6 rounded-[1.5rem] flex items-center justify-between border border-gray-100">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="bg-white p-3 rounded-xl shadow-sm text-[#1565C0] shrink-0">
                      <MapPin size={24} />
                    </div>
                    <div className="truncate">
                      <span className="text-sm sm:text-base font-black text-gray-800 block truncate leading-tight">
                        {isLocating ? '위치 분석 중...' : location?.address || '위치 데이터를 불러오고 있습니다.'}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 italic">경북 경산시 {location?.admin_area || '...'}</span>
                    </div>
                  </div>
                  <button onClick={handleGetLocation} className="shrink-0 p-3 text-[#1565C0] hover:bg-blue-50 rounded-xl transition-all active:scale-90">
                    <Zap size={22} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Incident Details</label>
                <textarea 
                  className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] p-6 sm:p-8 text-sm sm:text-lg font-bold text-gray-800 placeholder:text-gray-300 focus:ring-4 focus:ring-blue-500/5 focus:border-[#1565C0] transition-all resize-none shadow-inner min-h-[160px]"
                  placeholder="현장 상황을 간단히 입력해주세요. (예: 도로 포트홀 때문에 사고 위험이 커요.)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="pt-4">
                <button 
                  disabled={isSubmitting || step === 'upload'}
                  onClick={handleSubmit}
                  className={`w-full flex items-center justify-center gap-4 py-6 rounded-[1.5rem] font-black text-xl text-white shadow-2xl transition-all transform active:scale-95 ${
                    isSubmitting 
                      ? 'bg-gray-200 cursor-not-allowed shadow-none' 
                      : 'bg-[#FF6F00] hover:bg-[#E65100] shadow-orange-100'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={28} strokeWidth={3} />
                      <span>AI 판독 및 부서 배정 중...</span>
                    </>
                  ) : (
                    <>
                      <Send size={24} strokeWidth={3} />
                      <span>민원 즉시 접수하기</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-[#1565C0] rounded-[2.5rem] p-8 lg:p-12 text-white relative overflow-hidden shadow-2xl group">
              <ShieldCheck className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition duration-1000" />
              <div className="relative z-10 flex flex-col sm:flex-row items-start gap-8">
                <div className="bg-white/10 p-5 rounded-2xl shrink-0 backdrop-blur-md">
                  <Info className="text-[#80d8ff]" size={32} />
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-[#80d8ff] uppercase tracking-[0.2em] leading-none">Security & AI Policy</h4>
                  <p className="text-[14px] font-medium text-white/90 leading-relaxed">
                    시민의 신고 데이터는 **경산시 실시간 안전 지도**에 즉시 반영됩니다. 허위 신고 시 행정력이 낭비될 수 있으니 신중하게 접수해 주시기 바랍니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportForm;
