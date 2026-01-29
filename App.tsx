
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Camera, ClipboardList, Menu, X, Bell, User, ShieldCheck, MessageSquare, LayoutGrid } from 'lucide-react';
import ReportForm from './components/ReportForm';
import AdminDashboard from './components/AdminDashboard';
import ReportList from './components/ReportList';
import { ComplaintReport, ComplaintStatus } from './types';
import { MOCK_REPORTS } from './constants';

const NavContent = ({ isMenuOpen, setIsMenuOpen }: { isMenuOpen: boolean, setIsMenuOpen: (v: boolean) => void }) => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${isAdminPath ? 'bg-slate-900 border-b border-white/10' : 'bg-[#1565C0] border-b border-blue-400/20'} text-white shadow-xl`}>
      <div className="container mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="bg-white p-1.5 sm:p-2 rounded-xl group-hover:scale-105 transition shadow-lg flex items-center justify-center min-w-[80px] sm:min-w-[100px] h-8 sm:h-10 border border-white/20">
            <img 
              src="https://www.gbgs.go.kr/common/images/logo_top.png" 
              alt="경산시 로고" 
              className="h-full w-auto object-contain block contrast-110"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-black text-lg sm:text-2xl tracking-tighter leading-none text-white">경산안심톡</span>
              <MessageSquare size={16} className="text-[#80d8ff] hidden sm:block" />
            </div>
            <span className="text-[8px] sm:text-[10px] font-black opacity-80 uppercase tracking-[0.1em] sm:tracking-[0.2em] text-[#E3F2FD]">AI CITY CARE</span>
          </div>
        </Link>

        {/* PC Navigation */}
        <nav className="hidden lg:flex space-x-8 items-center">
          <Link to="/" className={`text-sm font-black transition-all hover:text-white ${location.pathname === '/' ? 'text-white border-b-2 border-white pb-1' : 'text-white/70'}`}>민원신고</Link>
          <Link to="/reports" className={`text-sm font-black transition-all hover:text-white ${location.pathname === '/reports' ? 'text-white border-b-2 border-white pb-1' : 'text-white/70'}`}>나의신고</Link>
          <Link to="/admin" className={`flex items-center gap-2 text-sm font-black transition-all hover:bg-white/20 bg-white/10 px-4 py-2 rounded-xl ${isAdminPath ? 'ring-2 ring-white/50 bg-white/20' : 'text-white/70'}`}>
            <ShieldCheck size={18} /> 통합관제
          </Link>
        </nav>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <button className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 transition rounded-xl sm:rounded-2xl relative group border border-white/5">
            <Bell size={20} className="sm:w-[22px] sm:h-[22px]" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF6F00] rounded-full border border-[#1565C0]"></span>
          </button>
          <div className="hidden sm:flex w-10 h-10 rounded-2xl bg-white/10 items-center justify-center border border-white/10 overflow-hidden">
            <User size={20} className="opacity-80" />
          </div>
          <button 
            className="lg:hidden p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 rounded-xl sm:rounded-2xl transition"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Menu */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-[#0D47A1]/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="flex flex-col h-full p-6">
            <div className="flex justify-end mb-8">
              <button onClick={() => setIsMenuOpen(false)} className="p-3 bg-white/10 rounded-2xl">
                <X size={32} />
              </button>
            </div>
            <div className="space-y-6">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-4 text-2xl font-black text-white border-b border-white/10">
                <Camera className="text-[#80d8ff]" /> 민원신고
              </Link>
              <Link to="/reports" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-4 text-2xl font-black text-white border-b border-white/10">
                <ClipboardList className="text-[#80d8ff]" /> 나의신고 내역
              </Link>
              <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-4 text-2xl font-black text-white border-b border-white/10">
                <ShieldCheck className="text-[#80d8ff]" /> 통합관제 센터
              </Link>
            </div>
            <div className="mt-auto pt-10 text-center opacity-40">
              <p className="text-xs font-bold uppercase tracking-widest">Gyeongsan AnsimTalk</p>
              <p className="text-[10px] mt-1">Smart City Solution</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

const App: React.FC = () => {
  const [reports, setReports] = useState<ComplaintReport[]>(() => {
    const saved = localStorage.getItem('gyongsan_reports');
    return saved ? JSON.parse(saved) : MOCK_REPORTS;
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('gyongsan_reports', JSON.stringify(reports));
  }, [reports]);

  const addReport = (newReport: ComplaintReport) => {
    setReports(prev => [newReport, ...prev]);
  };

  const updateReportStatus = (id: string, status: ComplaintStatus) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen font-pretendard selection:bg-blue-100 selection:text-[#1565C0]">
        <NavContent isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

        <main className="flex-grow">
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10">
            <Routes>
              <Route path="/" element={<ReportForm onReportSubmitted={addReport} />} />
              <Route path="/reports" element={<ReportList reports={reports} />} />
              <Route path="/admin" element={<AdminDashboard reports={reports} onUpdateStatus={updateReportStatus} />} />
            </Routes>
          </div>
        </main>

        {/* Footer for PC */}
        <footer className="bg-white border-t border-[#E0E0E0] py-12 hidden lg:block">
          <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-xl border border-gray-100 flex items-center justify-center min-w-[90px] h-9 shadow-sm">
                <img src="https://www.gbgs.go.kr/common/images/logo_top.png" alt="경산시" className="h-full w-auto object-contain grayscale opacity-60 hover:grayscale-0 transition duration-300" />
              </div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">
                Gyeongsan AnsimTalk AI Civic Platform<br/>
                &copy; 2025 Gyeongsan City Hall. All rights reserved.
              </div>
            </div>
            <div className="flex gap-8 text-[11px] font-black text-gray-400 uppercase tracking-widest">
              <a href="#" className="hover:text-[#1565C0] transition">Privacy Policy</a>
              <a href="#" className="hover:text-[#1565C0] transition">Terms of Service</a>
              <a href="#" className="hover:text-[#1565C0] transition">Help Center</a>
            </div>
          </div>
        </footer>

        {/* Bottom Navigation for Mobile (Citizen) */}
        <nav className="lg:hidden sticky bottom-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-100 flex justify-around items-center h-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
          <Link to="/" className={`flex flex-col items-center gap-1.5 transition-all ${useLocation().pathname === '/' ? 'text-[#1565C0]' : 'text-gray-400'}`}>
            <Camera size={26} strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-widest">신고하기</span>
          </Link>
          <Link to="/reports" className={`flex flex-col items-center gap-1.5 transition-all ${useLocation().pathname === '/reports' ? 'text-[#1565C0]' : 'text-gray-400'}`}>
            <ClipboardList size={26} strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-widest">나의내역</span>
          </Link>
          <Link to="/admin" className={`flex flex-col items-center gap-1.5 transition-all ${useLocation().pathname === '/admin' ? 'text-[#1565C0]' : 'text-gray-400'}`}>
            <LayoutGrid size={26} strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-widest">관제현황</span>
          </Link>
        </nav>
      </div>
    </Router>
  );
};

export default App;
