
import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Send, Loader2, Info, CheckCircle, X, ShieldCheck, ArrowRight, Smartphone, Zap, MessageSquare } from 'lucide-react';
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
  const [step, setStep] = useState<'upload' | 'confirm' | 'success'>('upload');
  
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

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 py-10">
        <div className="bg-white rounded-[3rem] shadow-2xl p-8 sm:p-12 text-center border border-[#E3F2FD] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1565C0] via-[#2E7D32] to-[#1565C0]"></div>
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#2E7D32] text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-100">
            {/* Fix: Replaced invalid sm:size with responsive Tailwind classes */}
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 tracking-tighter">접수 완료!</h2>
          <p className="text-sm sm:text-base text-gray-500 font-bold mb-10 leading-relaxed">
            AI가 민원을 분석하여 담당 부서에 <span className="text-[#1565C0]">즉각 전달</span>했습니다. 경산안심톡은 더 안전한 경산을 위해 함께합니다.
          </p>
          
          <div className="space-y-3 sm:space-y-4 mb-10">
            <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 flex items-center justify-between border border-gray-100">
              <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">관리번호</span>
              <span className="text-xs sm:text-sm font-black text-gray-900">#AS-{Math.floor(1000 + Math.random() * 9000)}</span>
            </div>
            <div className="bg-[#E8F5E9] rounded-2xl p-4 sm:p-5 flex items-center justify-between border border-[#C8E6C9]">
              <span className="text-[9px] sm:text-[10px] font-black text-[#2E7D32] uppercase tracking-widest">진행상태</span>
              <span className="text-xs sm:text-sm font-black text-[#2E7D32] flex items-center gap-1.5"><Zap size={14} /> 실시간 배정 완료</span>
            </div>
          </div>

          <button 
            onClick={() => { setStep('upload'); setImage(null); setDescription(''); }}
            className="w-full bg-[#1565C0] text-white font-black py-4 sm:py-5 rounded-2xl hover:bg-[#0D47A1] transition-all shadow-xl shadow-blue-100 active:scale-95"
          >
            추가 신고하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 lg:space-y-12 pb-24">
      
      {/* Page Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#E3F2FD] text-[#1565C0] rounded-full text-[10px] font-black tracking-[0.2em] border border-[#BBDEFB] mb-2">
          <MessageSquare size={14} /> GYEONGSAN ANSIMTALK HUB
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tighter">경산안심톡 생활민원</h1>
        <p className="text-gray-500 font-bold text-sm sm:text-base leading-relaxed">
          "찍고 보내면, 경산이 움직입니다"<br className="sm:hidden" />
          시민의 신고가 우리 동네를 더욱 안전하게 바꿉니다.
        </p>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
        
        {/* Left Column: Media Upload */}
        <div className="w-full bg-white rounded-[2rem] lg:rounded-[3.5rem] shadow-2xl overflow-hidden border border-gray-100 sticky top-24">
          {step === 'upload' ? (
            <div className="p-6 sm:p-10">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative aspect-square sm:aspect-video lg:aspect-square bg-gray-50 border-4 border-dashed border-gray-100 rounded-[2rem] lg:rounded-[3rem] flex flex-col items-center justify-center gap-6 hover:border-[#1565C0] hover:bg-blue-50/50 transition-all cursor-pointer overflow-hidden"
              >
                <div className="bg-[#FF6F00] text-white p-6 sm:p-8 rounded-3xl shadow-2xl shadow-orange-100 group-hover:scale-110 transition duration-500">
                  {/* Fix: Replaced invalid sm:size with responsive Tailwind classes */}
                  <Camera className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={2.5} />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">현장 사진 촬영</p>
                  <p className="text-xs sm:text-sm text-gray-400 font-bold">터치하여 카메라를 실행하세요</p>
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
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                 <div className="bg-[#E8F5E9] p-4 rounded-2xl flex items-center gap-3">
                    <ShieldCheck className="text-[#2E7D32]" size={20} />
                    <span className="text-[10px] sm:text-xs font-black text-[#1B5E20]">안심 신고</span>
                 </div>
                 <div className="bg-[#E3F2FD] p-4 rounded-2xl flex items-center gap-3">
                    <Zap className="text-[#1565C0]" size={20} />
                    <span className="text-[10px] sm:text-xs font-black text-[#0D47A1]">AI 즉시배정</span>
                 </div>
              </div>
            </div>
          ) : (
            <div className="relative aspect-square sm:aspect-video lg:aspect-square bg-gray-100">
              <img src={image!} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <button 
                onClick={() => setStep('upload')}
                className="absolute top-6 right-6 bg-white/90 backdrop-blur-2xl text-gray-900 p-3 rounded-xl hover:bg-white transition shadow-2xl active:scale-90"
              >
                <X size={24} strokeWidth={3} />
              </button>
              <div className="absolute bottom-6 left-6 space-y-1">
                <div className="flex items-center gap-2 bg-[#1565C0]/90 backdrop-blur px-3 py-1.5 rounded-lg text-white">
                  <MapPin size={14} />
                  <span className="text-[10px] font-bold tracking-tight">위치 확인됨</span>
                </div>
                <p className="text-white text-[11px] font-bold pl-1 max-w-[200px] sm:max-w-none truncate">{location?.address}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Form Data (Only visible if step confirm) */}
        <div className={`w-full space-y-8 ${step === 'upload' ? 'hidden lg:block opacity-30 pointer-events-none' : 'animate-in fade-in slide-in-from-right-4 duration-500'}`}>
          
          <div className="bg-white rounded-[2rem] lg:rounded-[3rem] p-8 lg:p-12 shadow-2xl border border-gray-100 space-y-10">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">발생 위치</label>
                {location?.accuracy && (
                  <span className="text-[10px] font-bold text-[#2E7D32] flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-[#2E7D32] rounded-full animate-pulse"></div> 정밀도 {location.accuracy}m
                  </span>
                )}
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl flex items-center justify-between border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm text-[#1565C0]">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <span className="text-sm sm:text-base font-black text-gray-800 block leading-tight">
                      {isLocating ? '위치 분석 중...' : location?.address || '위치 데이터를 불러오고 있습니다.'}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 italic">경북 경산시 {location?.admin_area || '...'}</span>
                  </div>
                </div>
                <button onClick={handleGetLocation} className="shrink-0 p-2 text-[#1565C0] hover:bg-blue-50 rounded-xl transition">
                  <Zap size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">민원 상세 설명</label>
              <textarea 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-6 sm:p-8 text-sm sm:text-base font-bold text-gray-800 placeholder:text-gray-300 focus:ring-4 focus:ring-blue-500/5 focus:border-[#1565C0] transition-all resize-none shadow-inner"
                placeholder="어떤 문제가 있나요? (예: 보도블럭이 파손되어 넘어질 위험이 있어요.)"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button 
              disabled={isSubmitting || step === 'upload'}
              onClick={handleSubmit}
              className={`w-full flex items-center justify-center gap-4 py-6 rounded-2xl font-black text-xl text-white shadow-2xl transition-all transform active:scale-95 ${
                isSubmitting 
                  ? 'bg-gray-200 cursor-not-allowed shadow-none' 
                  : 'bg-[#FF6F00] hover:bg-[#E65100] shadow-orange-100'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={28} strokeWidth={3} />
                  <span>AI 분석 중...</span>
                </>
              ) : (
                <>
                  <Send size={24} strokeWidth={3} />
                  <span>민원 접수하기</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-[#1565C0] rounded-[2rem] p-8 sm:p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
              <div className="bg-white/10 p-4 rounded-2xl shrink-0">
                <Info className="text-[#80d8ff]" size={28} />
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-black text-[#80d8ff] uppercase tracking-widest leading-none">Smart Policy</h4>
                <p className="text-[13px] font-medium text-white/90 leading-relaxed">
                  시민의 신고 데이터는 <span className="text-white font-bold underline decoration-2 underline-offset-4">경산시 안전 빅데이터</span>로 활용되어 도시 안전 등급을 높이는 소중한 자산이 됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Guide Card for initial step */}
      {step === 'upload' && (
         <div className="bg-white rounded-[2rem] p-10 lg:p-16 border border-gray-100 text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="max-w-2xl mx-auto space-y-6">
               <h3 className="text-2xl font-black text-gray-900 tracking-tight">어떻게 신고하나요?</h3>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { step: '01', title: '촬영', desc: '위험한 장소를 찍으세요' },
                    { step: '02', title: '확인', desc: '위치가 맞는지 보세요' },
                    { step: '03', title: '완료', desc: 'AI가 부서를 배정합니다' },
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                       <span className="text-2xl font-black text-[#1565C0]/20">{item.step}</span>
                       <p className="text-lg font-black text-gray-800">{item.title}</p>
                       <p className="text-sm font-bold text-gray-400">{item.desc}</p>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default ReportForm;
