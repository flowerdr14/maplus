import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { 
  Search, 
  MapPin, 
  MessageSquare, 
  Calendar, 
  User, 
  BookOpen, 
  ExternalLink, 
  ChevronDown, 
  FileText, 
  Hospital, 
  ArrowLeft,
  CheckCircle,
  Clock,
  Check,
  AlertCircle
} from 'lucide-react';
import { getKSTTimestamp } from '../AppContext';

interface Appointment {
  id: string;
  department: string;
  doctor: string;
  time: string;
  date: string;
  status: '예약완료' | '진료대기' | '취소됨';
}

export const HospitalHomepage: React.FC = () => {
  const { setView, currentUser, articles, addArticle } = useApp();
  
  // Navigation tabs inside hospital-home: 'introduce' (의료진소개/Home) | 'reserve' (예약) | 'news' (병원소식) | 'info' (정보공개)
  const [activeSubTab, setActiveSubTab] = useState<'introduce' | 'reserve' | 'news' | 'info'>('introduce');

  // Interactive search state for medical staff finders
  const [searchDocDept, setSearchDocDept] = useState('전체');
  const [searchDocName, setSearchDocName] = useState('');
  const [docSearchResults, setDocSearchResults] = useState<Array<{ name: string; dept: string; title: string; age: number; spec: string; showHistory?: string }>>([]);

  // Reservation Form State
  const [reserveDept, setReserveDept] = useState('외과');
  const [reserveDocName, setReserveDocName] = useState('이익준');
  const [reserveTime, setReserveTime] = useState('11:00 am');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState('');

  // Hospital News Board State
  const [hospitalNews, setHospitalNews] = useState<Array<{ id: string; title: string; views: number; date: string }>>([
    { id: 'hn-1', title: '[공지] 해솔병원 신규 의료진 임용 안내 (이익준 전문의)', views: 142, date: '2026-05-20' },
    { id: 'hn-2', title: '[안내] 메이플 가상 단체 해솔병원 홍보 사이트 정식 오픈', views: 98, date: '2026-05-18' },
    { id: 'hn-3', title: '[공지] 메디 소프트웨어 및 에셋 정기 안전 및 위생 검진 시행', views: 76, date: '2026-05-15' },
    { id: 'hn-4', title: '[모집] 해솔병원 간호본부 및 행정지원 인턴 모집 공고', views: 112, date: '2026-05-10' }
  ]);
  const [isWritingNews, setIsWritingNews] = useState(false);
  const [newNewsTitle, setNewNewsTitle] = useState('');

  // Toast / Certificate Alert
  const [certificateAlert, setCertificateAlert] = useState(false);

  // Doctors database
  const DOCTORS_LIST = [
    { name: '이익준', dept: '외과', title: '공중부양의 마법사', age: 23, spec: '외과, 신경외과, 흉부외과 전문의', showHistory: '슬기로운 의사생활 1, 2 / 언젠가는 슬기로운 전공의생활' },
    { name: '채송화', dept: '신경외과', title: '우주최강 정밀브레인', age: 25, spec: '신경외과 분과 전문 지도교수', showHistory: '슬기로운 의사생활 1, 2' },
    { name: '안정원', dept: '소아외과', title: '천사같은 소아의 신', age: 24, spec: '소아 복강경 및 일반외과 정전문의', showHistory: '슬기로운 의사생활 1, 2' },
    { name: '김준완', dept: '흉부외과', title: '카리스마 심장 장인', age: 26, spec: '심장 판막 및 흉부 외래 책임전문의', showHistory: '슬기로운 의사생활 1, 2' }
  ];

  // Dynamic booking grid status matching the mockup
  const TIMETABLE_ROWS = [
    { time: '11:00 am', col1: 'X', col2: 'X', col3: 'X' },
    { time: '01:00 pm', col1: 'O', col2: 'O', col3: 'O' },
    { time: '03:00 pm', col1: 'O', col2: 'O', col3: 'X' },
    { time: '05:00 pm', col1: 'X', col2: 'O', col3: 'O' },
    { time: '07:00 pm', col1: 'O', col2: 'O', col3: 'X' }
  ];

  useEffect(() => {
    // Load existing appointments from localStorage
    const saved = localStorage.getItem('haesol_hospital_appointments');
    if (saved) {
      setAppointments(JSON.parse(saved));
    } else {
      // Default initial mock bookings
      const defaultBookings: Appointment[] = [
        { id: 'b-1', department: '외과', doctor: '이익준', time: '01:00 pm', date: '2026-05-28', status: '진료대기' }
      ];
      setAppointments(defaultBookings);
      localStorage.setItem('haesol_hospital_appointments', JSON.stringify(defaultBookings));
    }
  }, []);

  const saveAppointments = (list: Appointment[]) => {
    setAppointments(list);
    localStorage.setItem('haesol_hospital_appointments', JSON.stringify(list));
  };

  // Perform search
  const handleSearchDocs = () => {
    let filtered = DOCTORS_LIST;
    if (searchDocDept !== '전체') {
      filtered = filtered.filter(d => d.dept === searchDocDept);
    }
    if (searchDocName.trim() !== '') {
      filtered = filtered.filter(d => d.name.includes(searchDocName.trim()));
    }
    setDocSearchResults(filtered);
  };

  const handleMakeReservation = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccessMsg('');

    if (!currentUser) {
      alert('예약을 진행하려면 메이플러스 일보에 먼저 로그인하셔야 합니다.');
      return;
    }

    const matchedDoc = DOCTORS_LIST.find(d => d.name.includes(reserveDocName)) || DOCTORS_LIST[0];

    const newAppt: Appointment = {
      id: `appt-${Date.now()}`,
      department: reserveDept,
      doctor: matchedDoc.name,
      time: reserveTime,
      date: new Date().toISOString().split('T')[0], // today
      status: '예약완료'
    };

    const updated = [newAppt, ...appointments];
    saveAppointments(updated);
    setBookingSuccessMsg(`진료 예약이 정상적으로 완료되었습니다! (${matchedDoc.name} 의료진 / ${reserveTime})`);

    // clear fields
    setTimeout(() => {
      setBookingSuccessMsg('');
    }, 4000);
  };

  const handleCancelReservation = (id: string) => {
    if (window.confirm('선택하신 진료 예약을 정말 취소하시겠습니까?')) {
      const updated = appointments.map(a => a.id === id ? { ...a, status: '취소됨' as const } : a);
      saveAppointments(updated);
    }
  };

  const handlePublishNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNewsTitle.trim()) return;

    if (currentUser?.role !== 'admin') {
      alert('Only 관리자만 병원소식 기사를 직접 게재할 수 있습니다!');
      return;
    }

    const newPost = {
      id: `hn-${Date.now()}`,
      title: newNewsTitle,
      views: 1,
      date: new Date().toISOString().split('T')[0]
    };

    setHospitalNews([newPost, ...hospitalNews]);
    setNewNewsTitle('');
    setIsWritingNews(false);
    alert('새로운 병원소식 공지글이 성공적으로 발표되었습니다.');
  };

  // Quick menu actions helper
  const handleQuickMenuAction = (action: string) => {
    if (action === '예약하기') {
      setActiveSubTab('reserve');
    } else if (action === '의료진검색') {
      setActiveSubTab('introduce');
      // Scroll or focus to search area
      const el = document.getElementById('doctor-search-box');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (action === '병원장말씀') {
      setActiveSubTab('info');
    } else if (action === '칭찬합니다') {
      alert('칭찬합시다 게시판 연동 준비중입니다. 따뜻한 성원에 깊이 감사드립니다!');
    }
  };

  return (
    <div className="flex-1 bg-white min-h-screen text-gray-800 font-sans flex flex-col items-center pb-12" id="hospital-home-panel">
      <div className="w-full max-w-6xl px-4 mt-6 flex flex-col lg:flex-row gap-6">
        
        {/* Main Interface */}
        <div className="flex-1 bg-white border border-gray-300 shadow-sm flex flex-col">
          
          {/* Header section identical to the mockups */}
          <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b border-gray-300 bg-white gap-4">
            
            {/* Logo Layout */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveSubTab('introduce')}>
              <div className="w-12 h-12 bg-gradient-to-tr from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center text-white shadow-md relative group">
                <Hospital size={26} className="group-hover:rotate-6 transition duration-200" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border border-white flex items-center justify-center text-[8px] font-bold text-white">
                  +
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black text-cyan-800 tracking-tighter flex items-center gap-1 leading-none">
                  해솔병원
                </h1>
                <p className="text-[9px] text-cyan-600 font-bold uppercase tracking-wider mt-1">
                  HAESOL HOSPITAL
                </p>
              </div>
            </div>

            {/* Menu Navigation tabs based on active state */}
            <div className="flex items-center gap-1 sm:gap-3 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
              <button 
                onClick={() => setActiveSubTab('reserve')}
                className={`px-3 py-1.5 text-sm font-extrabold rounded-md shadow-sm transition duration-150 ${activeSubTab === 'reserve' ? 'bg-cyan-700 text-white' : 'text-gray-600 hover:bg-slate-200'}`}
              >
                예약
              </button>
              <span className="text-gray-300">|</span>
              <button 
                onClick={() => setActiveSubTab('introduce')}
                className={`px-3 py-1.5 text-sm font-extrabold rounded-md shadow-sm transition duration-150 ${activeSubTab === 'introduce' ? 'bg-cyan-700 text-white' : 'text-gray-600 hover:bg-slate-200'}`}
              >
                의료진소개
              </button>
              <span className="text-gray-300">|</span>
              <button 
                onClick={() => setActiveSubTab('news')}
                className={`px-3 py-1.5 text-sm font-extrabold rounded-md shadow-sm transition duration-150 ${activeSubTab === 'news' ? 'bg-cyan-700 text-white' : 'text-gray-600 hover:bg-slate-200'}`}
              >
                병원소식
              </button>
              <span className="text-gray-300">|</span>
              <button 
                onClick={() => setActiveSubTab('info')}
                className={`px-3 py-1.5 text-sm font-extrabold rounded-md shadow-sm transition duration-150 ${activeSubTab === 'info' ? 'bg-cyan-700 text-white' : 'text-gray-600 hover:bg-slate-200'}`}
              >
                정보공개
              </button>
            </div>

            {/* Header Right Sidebar Components */}
            <div className="flex flex-col items-end gap-1"/>
            <div className="flex flex-col items-end gap-1.5 min-w-[140px] text-xs">
              <div className="flex items-center gap-3">
                <a href="#kakaotalk" onClick={() => alert('병원민원 전담 온라인 카카오톡 채널로 가상 매칭됩니다.')} className="flex items-center gap-1 font-bold text-gray-700 hover:text-amber-500">
                  <span className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm text-amber-950">talk</span>
                  병원민원
                </a>
                <a href="#workplace" onClick={() => setActiveSubTab('info')} className="flex items-center gap-1 font-bold text-gray-700 hover:text-orange-500">
                  <span className="text-orange-500 text-sm">🍁</span>
                  근무지
                </a>
              </div>
              <div className="flex items-center border border-gray-400 rounded shadow-xs bg-white overflow-hidden p-0.5 max-w-[150px]">
                <input 
                  type="text" 
                  placeholder="의료진 검색..." 
                  className="w-full text-xs px-1.5 py-0.5 outline-none " 
                  value={searchDocName}
                  onChange={(e) => setSearchDocName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearchDocs(); }}
                />
                <button onClick={handleSearchDocs} className="px-1 text-cyan-800 hover:scale-110 active:scale-95 transition">
                  <Search size={13} />
                </button>
              </div>
            </div>

          </div>

          {/* Dynamic Content Panel depends on subTab state */}
          <div className="p-4 bg-slate-50 flex-1">
            
            {/* 1. 의료진소개 Tab Content (Image 1 Layout) */}
            {activeSubTab === 'introduce' && (
              <div className="space-y-6" id="introduce-tab">
                {/* Green Banner matching Image 1 */}
                <div className="bg-[#77cc88] p-5 rounded border border-green-700 grid grid-cols-1 md:grid-cols-12 gap-4 items-center overflow-hidden shadow-sm relative">
                  <div className="md:col-span-7 space-y-4">
                    <h2 className="text-xl sm:text-2xl font-black text-green-950 leading-tight">
                      해솔의 새로운 의료진을 <br />
                      <span className="inline-block mt-1 bg-white text-green-700 border border-green-700 px-3 py-1 rounded font-black text-2xl sm:text-3xl tracking-widest shadow-xs">
                        소개합니다!
                      </span>
                    </h2>
                    
                    <div className="space-y-1 block md:hidden text-green-950 text-xs mt-3 bg-green-100/50 p-2 rounded">
                      <span className="font-extrabold bg-green-800 text-white px-1.5 py-0.5 rounded text-[10px] mr-1">신임 교원</span>
                      <strong>이익준 (23세)</strong> / 공중부양의 마법사
                      <div className="text-[10px]">외과, 신경외과, 흉부외과 전문의</div>
                    </div>

                    <div className="text-xs sm:text-sm text-green-905 font-bold leading-relaxed pt-2">
                      <p className="bg-green-800/10 inline-block px-2 py-0.5 rounded text-[10px] text-green-900 mb-1">
                        출연 정보 및 이력사항
                      </p>
                      <p>프로그램 출연 내역: 슬기로운 의사생활 1, 2 / 언젠가는 슬기로운 전공의생활</p>
                    </div>
                  </div>

                  {/* Doctor Profile Card matching lego roblox look */}
                  <div className="md:col-span-5 bg-green-50/70 rounded-lg p-3 border border-green-600 flex flex-col items-center text-center relative shadow-sm">
                    {/* Roblox doctor avatar styled in css */}
                    <div className="w-24 h-24 bg-gray-200 rounded-lg border-2 border-green-750 flex items-center justify-center overflow-hidden shadow-inner mb-2 relative bg-gradient-to-b from-cyan-100 to-sky-200">
                      {/* Stylized face avatar inside */}
                      <div className="relative flex flex-col items-center">
                        <div className="w-10 h-10 bg-yellow-350 rounded border-2 border-gray-700 flex flex-col justify-space-between p-1">
                          <div className="flex justify-between w-full mt-0.5">
                            <div className="w-2 h-2 bg-black rounded-full" />
                            <div className="w-2 h-2 bg-black rounded-full" />
                          </div>
                          <div className="w-4 h-1 bg-red-400 rounded-sm mx-auto mt-2 border-b border-gray-750" />
                        </div>
                        {/* Doctor's White Coat & Stethoscope */}
                        <div className="w-14 h-12 bg-white rounded-t-lg border-x border-t border-gray-700 mt-1 relative flex justify-center">
                          <div className="absolute top-0 w-3 h-4 bg-teal-600 border-x border-gray-700" /> {/* Teal medical scrubs */}
                          <div className="absolute top-1/3 w-8 h-0.5 bg-gray-500" /> {/* stethoscope wrap */}
                        </div>
                      </div>
                      <span className="absolute bottom-1 right-1 text-[8px] bg-sky-600 text-white px-1.5 py-0.2 rounded font-mono">ROBLOX</span>
                    </div>

                    <h3 className="text-base font-extrabold text-green-950">이익준 (23세)</h3>
                    <p className="text-xs font-bold text-green-800 mt-0.5">공중부양의 마법사</p>
                    <p className="text-[10px] text-green-700 mt-1 font-semibold">외과, 신경외과, 흉부외과 전문의</p>
                  </div>
                </div>

                {/* Sub row widgets matching Image 1 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="home-widgets-grid">
                  
                  {/* Column 1: 의료진 찾기 */}
                  <div className="bg-white rounded border border-gray-300 p-4 shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-cyan-900 border-b border-cyan-100 pb-2 mb-3 flex items-center justify-between">
                        의료진 찾기
                        <span className="text-xs text-cyan-600 font-bold">DEPARTMENT SEARCH</span>
                      </h3>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 mb-1">진료과 선택</label>
                          <div className="relative">
                            <select 
                              value={searchDocDept}
                              onChange={(e) => setSearchDocDept(e.target.value)}
                              className="w-full text-xs font-bold border border-gray-400 rounded px-2 py-1.5 bg-slate-50 outline-none appearance-none"
                            >
                              <option value="전체">진료과 전체</option>
                              <option value="외과">외과</option>
                              <option value="신경외과">신경외과</option>
                              <option value="소아외과">소아외과</option>
                              <option value="흉부외과">흉부외과</option>
                            </select>
                            <span className="absolute right-2.5 top-2 py-0.5 pointer-events-none text-gray-500 text-[9px]">▼</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 mb-1">의료진 성명</label>
                          <div className="flex items-center border border-gray-400 rounded bg-white overflow-hidden p-0.5">
                            <input 
                              type="text" 
                              placeholder="검색할 성명 기입" 
                              value={searchDocName}
                              onChange={(e) => setSearchDocName(e.target.value)}
                              className="w-full text-xs px-2 py-1 outline-none font-semibold text-gray-800" 
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSearchDocs(); }}
                            />
                            <button onClick={handleSearchDocs} className="px-2 text-cyan-800 font-bold hover:scale-105 active:scale-95 transition">
                              🔍
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Display Search results if performed */}
                      {searchDocName || searchDocDept !== '전체' ? (
                        <div className="mt-4 bg-slate-50 p-2.5 rounded border border-gray-200 space-y-2 max-h-[140px] overflow-y-auto">
                          <p className="text-[10px] font-bold text-cyan-800">검색결과 목록 ({docSearchResults.length}명)</p>
                          {docSearchResults.length === 0 ? (
                            <p className="text-[10px] text-gray-400 text-center py-2">검색 결과가 존재하지 않습니다.</p>
                          ) : (
                            docSearchResults.map((doc, idx) => (
                              <div key={idx} className="bg-white p-1.5 rounded border border-gray-100 flex items-center justify-between text-xs hover:border-cyan-300">
                                <div>
                                  <span className="font-extrabold text-gray-800">{doc.name}</span>{' '}
                                  <span className="text-[10px] bg-cyan-100 text-cyan-700 px-1 rounded">{doc.dept}</span>
                                </div>
                                <button 
                                  onClick={() => {
                                    setReserveDept(doc.dept);
                                    setReserveDocName(doc.name);
                                    setActiveSubTab('reserve');
                                  }}
                                  className="text-[9px] bg-cyan-700 text-white px-1.5 py-0.5 rounded hover:bg-cyan-800"
                                >
                                  조율예약
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 p-2.5 bg-cyan-50/50 rounded border border-dashed border-cyan-200 text-center">
                          <p className="text-[10px] text-cyan-700 leading-relaxed font-semibold">
                            원하시는 의료진의 이름이나 과를 선택하시면 <br />정밀 진료 연동을 빠르게 도출해 드립니다.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Orange certificate link banner matching Image 1 layout */}
                    <div 
                      onClick={() => {
                        setCertificateAlert(true);
                        setTimeout(() => setCertificateAlert(false), 3000);
                      }}
                      className="mt-4 bg-[#f2a879] hover:bg-[#eb9661] text-white p-2.5 rounded text-center cursor-pointer transition shadow-xs border border-orange-400"
                    >
                      <h4 className="text-xs sm:text-sm font-extrabold tracking-tight">
                        증명서 발급은? <br className="hidden sm:block md:hidden" />
                        <span className="text-white font-black text-lg underline sm:no-underline sm:text-base sm:font-black">메드서티!</span>
                      </h4>
                    </div>
                  </div>

                  {/* Column 2: 온라인 예약하기 */}
                  <div className="bg-white rounded border border-gray-300 overflow-hidden shadow-xs flex flex-col justify-between">
                    <div>
                      {/* Blue header mimicking header */}
                      <div className="bg-[#4a90e2] px-3 py-2 text-white font-black text-sm flex items-center justify-between">
                        <span>온라인 예약하기</span>
                        <Calendar size={13} />
                      </div>

                      <div className="p-3">
                        {/* Tab sub options mimics mockup */}
                        <div className="flex gap-1 mb-3">
                          <button 
                            onClick={() => setActiveSubTab('reserve')}
                            className="text-[11px] font-black bg-[#4a90e2] text-white border border-[#4a90e2] px-2.5 py-1 rounded shadow-xs"
                          >
                            진료 예약
                          </button>
                          <button 
                            onClick={() => setActiveSubTab('reserve')}
                            className="text-[11px] font-extrabold bg-slate-150 text-gray-600 border border-gray-300 px-2.5 py-1 rounded hover:bg-gray-100"
                          >
                            내 예약조회
                          </button>
                        </div>

                        <form onSubmit={handleMakeReservation} className="space-y-2.5">
                          <div>
                            <select 
                              value={reserveDept}
                              onChange={(e) => setReserveDept(e.target.value)}
                              className="w-full text-xs font-bold border border-gray-400 rounded px-2 py-1.5 bg-slate-50 outline-none appearance-none"
                            >
                              <option value="외과">외과</option>
                              <option value="신경외과">신경외과</option>
                              <option value="소아외과">소아외과</option>
                              <option value="흉부외과">흉부외과</option>
                            </select>
                          </div>

                          <div className="flex items-center border border-gray-400 rounded bg-white overflow-hidden p-0.5">
                            <input 
                              type="text" 
                              placeholder="의료진 성명"
                              value={reserveDocName}
                              onChange={(e) => setReserveDocName(e.target.value)}
                              className="w-full text-xs px-2 py-1 outline-none font-semibold" 
                              required
                            />
                            <span className="px-1.5 text-gray-400 text-xs">🔍</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap bg-slate-100 border border-gray-300 px-2 py-1.5 rounded">진료 타임</span>
                            <input 
                              type="text" 
                              value={reserveTime}
                              onChange={(e) => setReserveTime(e.target.value)}
                              placeholder="예: 11:00 am" 
                              className="w-full text-xs px-2 py-1.5 border border-gray-400 rounded font-semibold outline-none"
                              required
                            />
                          </div>

                          {bookingSuccessMsg && (
                            <div className="p-2 text-[10px] text-green-700 bg-green-50 rounded border border-green-200">
                              {bookingSuccessMsg}
                            </div>
                          )}

                          <div className="flex justify-end pt-1">
                            <button 
                              type="submit"
                              className="bg-[#4a90e2] hover:bg-[#357abd] text-white text-xs font-black px-4 py-1.5 rounded shadow-xs tracking-wider transition-all"
                            >
                              예약하기
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: 패밀리 사이트 */}
                  <div className="bg-white rounded border border-gray-300 overflow-hidden shadow-xs flex flex-col justify-between">
                    <div>
                      {/* Family banner title */}
                      <div className="bg-[#4889cb] px-3 py-2 text-white font-black text-sm flex items-center justify-between">
                        <span>패밀리 사이트</span>
                        <ExternalLink size={13} />
                      </div>

                      <div className="p-4 space-y-3">
                        <a 
                          href="https://www.roblox.com" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-2 text-xs font-extrabold text-gray-700 hover:text-blue-500 border border-gray-200 hover:border-blue-300 p-2 rounded bg-slate-50 transition"
                        >
                          <span className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-[10px] font-mono text-white tracking-widest font-black uppercase">R</span>
                          Roblox (로블록스)
                        </a>

                        <a 
                          href="#maple-hospital"
                          onClick={() => alert('본 가상 단체 해솔병원의 주요 기지인 메이플로블록스 롤플레잉 Maple Hospital입니다.')}
                          className="flex items-center gap-2 text-xs font-extrabold text-gray-700 hover:text-orange-500 border border-gray-200 hover:border-orange-300 p-2 rounded bg-slate-50 transition"
                        >
                          <span className="text-sm rounded flex items-center justify-center">🍁</span>
                          Maple Hospital
                        </a>

                        <a 
                          href="#medi-software"
                          onClick={() => alert('해솔병원 특용 메디 시스템 및 진단 시스템 제공 소프트웨어사')}
                          className="flex items-center gap-2 text-xs font-extrabold text-gray-700 hover:text-red-500 border border-gray-200 hover:border-red-300 p-2 rounded bg-slate-50 transition"
                        >
                          <span className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-[12px] font-bold">+</span>
                          Medi Software
                        </a>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-100 border-t border-gray-200">
                      <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                        본 사이트는 로블록스 내 가상 의료 단체인 해솔병원을 홍보하기 위해 제작된 사이트 입니다.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 2. 예약 Tab Content (Image 2 Layout) */}
            {activeSubTab === 'reserve' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="reserve-tab">
                
                {/* Left reservation console */}
                <div className="bg-white rounded border border-gray-300 overflow-hidden shadow-sm">
                  <div className="bg-[#4a90e2] px-4 py-2.5 text-white font-black text-sm flex justify-between items-center">
                    <span>온라인 예약하기</span>
                    <span className="text-xs bg-cyan-800 text-white px-2 py-0.5 rounded leading-none">진료 예약</span>
                  </div>

                  <form onSubmit={handleMakeReservation} className="p-4 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">진료과 선택 *</label>
                      <select 
                        value={reserveDept}
                        onChange={(e) => setReserveDept(e.target.value)}
                        className="w-full text-xs font-bold border border-gray-400 rounded px-3 py-2 bg-slate-50 outline-none appearance-none"
                      >
                        <option value="외과">외과</option>
                        <option value="신경외과">신경외과</option>
                        <option value="소아외과">소아외과</option>
                        <option value="흉부외과">흉부외과</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">의료진 성명 *</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="원하시는 의료진명 입력"
                          value={reserveDocName}
                          onChange={(e) => setReserveDocName(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-gray-400 rounded font-semibold focus:border-cyan-500 outline-none" 
                          required
                        />
                        <span className="absolute right-3 top-2.5 font-bold">🔍</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-700 whitespace-nowrap bg-slate-100 border border-gray-300 px-3 py-2 rounded">
                        진료 타임
                      </span>
                      <input 
                        type="text" 
                        placeholder="예: 11:00 am 또는 01:00 pm" 
                        value={reserveTime}
                        onChange={(e) => setReserveTime(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-gray-400 rounded font-semibold outline-none focus:border-cyan-500"
                        required
                      />
                    </div>

                    {/* Booking Timestable Grid matching Image 2 mockup */}
                    <div className="mt-4 border border-gray-300 rounded overflow-hidden">
                      <table className="w-full text-center text-xs text-gray-700 bg-white">
                        <thead>
                          <tr className="bg-cyan-700 text-white font-extrabold border-b border-gray-350">
                            <th className="py-2 px-1 border-r border-gray-300">시간 / 여부</th>
                            <th className="py-2 px-1 border-r border-gray-300">진료</th>
                            <th className="py-2 px-1 border-r border-gray-300">진료</th>
                            <th className="py-2 px-1">진료</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {TIMETABLE_ROWS.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 font-semibold">
                              <td className="py-1.5 px-2 bg-slate-50 border-r border-gray-300 font-bold">{row.time}</td>
                              <td className="py-1.5 border-r border-gray-300 font-extrabold text-[13px]">{row.col1}</td>
                              <td className="py-1.5 border-r border-gray-300 font-extrabold text-[13px]">{row.col2}</td>
                              <td className="py-1.5 font-extrabold text-[13px]">{row.col3}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <p className="text-[10px] text-orange-600 font-extrabold bg-orange-50 p-2 border border-orange-100 rounded">
                      ※ 본 의료진은 시간 당 3번 외래를 진행합니다.
                    </p>

                    {bookingSuccessMsg && (
                      <div className="p-2.5 text-xs text-green-700 bg-green-50 rounded border border-green-200 font-bold">
                        {bookingSuccessMsg}
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button 
                        type="submit"
                        className="bg-[#4a90e2] hover:bg-[#357abd] text-white text-xs font-black px-5 py-2 rounded shadow-sm tracking-wider transition-all"
                      >
                        예약하기
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Reservation History Record list */}
                <div className="bg-white rounded border border-gray-300 overflow-hidden shadow-sm flex flex-col">
                  <div className="bg-[#4a90e2] px-4 py-2.5 text-white font-black text-sm">
                    내 예약 기록
                  </div>
                  
                  <div className="p-4 flex-1 overflow-y-auto space-y-3 min-h-[300px]" id="my-reservations">
                    {!currentUser ? (
                      <div className="text-gray-400 text-center py-20 text-xs">
                        <AlertCircle className="mx-auto text-gray-300 mb-2" size={32} />
                        예약 조회를 기피하려면 로그인 세션 확인이 필요합니다.
                      </div>
                    ) : appointments.length === 0 ? (
                      <div className="text-gray-400 text-center py-20 text-xs">
                        접수 완료되었거나 대기 중인 진료 내역이 없습니다.
                      </div>
                    ) : (
                      appointments.map((appt) => (
                        <div key={appt.id} className="p-3 border border-gray-200 rounded-lg hover:border-cyan-300 transition flex flex-col justify-between bg-slate-50 relative group">
                          <div>
                            <div className="flex justify-between items-start mb-1.5">
                              <span className="text-[10px] bg-cyan-700 text-white font-black px-1.5 py-0.5 rounded">
                                {appt.department}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${appt.status === '취소됨' ? 'bg-red-100 text-red-600' : 'bg-green-150 text-green-700 border border-green-200'}`}>
                                {appt.status}
                              </span>
                            </div>
                            <h4 className="text-sm font-extrabold text-gray-800">
                              {appt.doctor} 전임의 진료진
                            </h4>
                            <div className="text-xs text-gray-500 mt-1 space-y-1">
                              <div className="flex items-center gap-1">
                                <Clock size={11} /> <strong>예약 시간:</strong> {appt.time}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar size={11} /> <strong>신청일:</strong> {appt.date}
                              </div>
                            </div>
                          </div>

                          {appt.status !== '취소됨' && (
                            <button 
                              onClick={() => handleCancelReservation(appt.id)}
                              className="mt-3 text-[10px] text-red-500 font-extrabold hover:underline block text-right"
                            >
                              진료 예약 취소 요청
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* 3. 병원소식 Tab Content (Image 3 Layout) */}
            {activeSubTab === 'news' && (
              <div className="bg-white rounded border border-gray-300 overflow-hidden shadow-sm" id="news-tab">
                {/* News Table Headers */}
                <table className="w-full text-left text-xs sm:text-sm text-gray-700">
                  <thead>
                    <tr className="bg-slate-100 border-b border-gray-350 text-gray-900 font-black text-center">
                      <th className="py-2.5 px-3 border-r border-gray-350 w-16 select-none font-bold text-stone-800">No.</th>
                      <th className="py-2.5 px-4 border-r border-gray-350 text-stone-800">제목</th>
                      <th className="py-2.5 px-3 w-24 select-none font-bold text-stone-800">조회수</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-255 font-bold">
                    {hospitalNews.map((news, idx) => (
                      <tr key={news.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => alert(`신문글: "${news.title}" 기사를 열람합니다.`)}>
                        <td className="py-3 px-3 text-center border-r border-gray-250 text-gray-500 font-mono">
                          {hospitalNews.length - idx}
                        </td>
                        <td className="py-3 px-4 border-r border-gray-250 text-cyan-900 hover:underline">
                          {news.title}
                          <span className="text-[10px] text-gray-400 font-normal ml-2 block sm:inline">
                            등록자: 해솔본부 ({news.date})
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-gray-600">
                          {news.views}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* News write capability (Only Admin) matching Image 3 button label */}
                <div className="p-3 bg-slate-50 border-t border-gray-300 flex justify-end">
                  {isWritingNews ? (
                    <form onSubmit={handlePublishNews} className="w-full bg-white p-3 border border-gray-300 rounded space-y-3">
                      <h4 className="text-xs font-bold text-cyan-800">새 병원소식 게재</h4>
                      <div>
                        <input 
                          type="text" 
                          placeholder="소식 글의 제목을 기입해주세요" 
                          value={newNewsTitle}
                          onChange={(e) => setNewNewsTitle(e.target.value)}
                          className="w-full text-xs p-2 border border-gray-300 rounded outline-none focus:border-cyan-500 font-bold"
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-2 text-xs">
                        <button 
                          type="button" 
                          onClick={() => setIsWritingNews(false)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          취소
                        </button>
                        <button 
                          type="submit" 
                          className="px-4 py-1 bg-cyan-700 text-white rounded font-bold hover:bg-cyan-800"
                        >
                          발표하기
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button 
                      onClick={() => {
                        if (currentUser?.role === 'admin') {
                          setIsWritingNews(true);
                        } else {
                          alert('해당 기능은 "Only 관리자" 가입 권한만 접근할 수 있는 제한사항입니다.');
                        }
                      }}
                      className="bg-[#4a90e2] hover:bg-[#357abd] text-white text-xs font-black px-4 py-2 rounded shadow-xs uppercase transition-all"
                    >
                      작성하기 <br className="xs:hidden" />
                      <span className="text-[10px] font-bold opacity-90">(Only 관리자)</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 4. 정보공개 Tab Content (Image 4 Layout Description Card) */}
            {activeSubTab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="info-tab">
                
                {/* Left Column: 병원장 인사말 */}
                <div className="bg-white rounded border border-gray-300 shadow-sm overflow-hidden flex flex-col justify-between">
                  <div className="bg-[#4a90e2] px-4 py-2.5 text-white font-black text-sm">
                    병원장 인사말
                  </div>

                  <div className="p-4 space-y-4 text-xs sm:text-sm text-gray-800 leading-relaxed font-semibold">
                    <p>안녕하세요.</p>
                    <p className="font-extrabold text-cyan-900 border-l-4 border-cyan-500 pl-2">
                      해솔병원장입니다.
                    </p>
                    <p>
                      언제나 사람들은 잘하고 싶고 멋지고 싶어 합니다. 
                      저희 병원에서는 그런 최소한의 가식은 넣어두고, 
                      환자 진료에만 집중하는 병원이 되도록 하겠습니다.
                    </p>
                    <p>
                      본 병원에서는 아프면 아프다, 힘들면 힘들다 등 
                      말은 모두 들어 줄 수 있습니다.
                    </p>
                    <p>
                      엄청 아프다가도 주변 사람들이 알아준다면 이상하게 안 아파지게 하는 사람들만 모아 놓은 곳이 이 병원이고 의료진입니다. 
                      의료진을 존중하고 감사하는 사람이 되어 주시면 감사하겠습니다.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-slate-50 border-t border-gray-200">
                    <p className="text-[10px] text-right font-bold text-gray-500">
                      해솔병원 전임 병원장 배상
                    </p>
                  </div>
                </div>

                {/* Right Column: 병원 위치 */}
                <div className="bg-white rounded border border-gray-300 shadow-sm overflow-hidden flex flex-col justify-between">
                  <div className="bg-[#4a90e2] px-4 py-2.5 text-white font-black text-sm">
                    병원 위치
                  </div>

                  <div className="p-4 whitespace-pre-line">
                    {/* Top-down aesthetic vector map representation of Roblox Maple Hospital */}
                    <div className="w-full h-56 bg-slate-100 rounded-lg border border-gray-300 relative overflow-hidden flex flex-col justify-between shadow-inner">
                      
                      {/* Grid representation */}
                      <div className="absolute inset-0 bg-grid-slate-200 bg-[size:20px_20px] opacity-30 select-none pointer-events-none" />

                      {/* Map Labels representing regions from image */}
                      <div className="absolute top-4 left-1/3 bg-slate-200 border border-slate-450 px-2 py-0.5 rounded text-[10px] font-extrabold text-slate-700 shadow-2xs">
                        메이플주농장
                      </div>

                      <div className="absolute top-1/4 right-3 bg-slate-200 border border-slate-450 px-2 py-0.5 rounded text-[10px] font-extrabold text-slate-700 shadow-2xs">
                        메이플해
                      </div>

                      <div className="absolute top-10 left-3 bg-slate-200 border border-slate-450 text-[10px] font-extrabold text-slate-700 p-1 rounded rotate-90 tracking-widest leading-none">
                        메이플특별시
                      </div>

                      <div className="absolute bottom-4 left-12 bg-slate-200 border border-slate-450 px-2 py-0.5 rounded text-[10px] font-extrabold text-slate-700 shadow-2xs">
                        메이통합마트
                      </div>

                      <div className="absolute bottom-1/4 right-8 bg-slate-200 border border-slate-450 px-2 py-0.5 rounded text-[10px] font-extrabold text-slate-700 shadow-2xs">
                        메이플호수
                      </div>

                      <div className="absolute top-[40%] left-[28%] bg-slate-150 border border-slate-350 p-1 rounded text-[8px] font-extrabold text-slate-500 max-w-[50px] leading-tight text-center rotate-3">
                        메이플 시노 놀이터
                      </div>

                      {/* RED Flashing Dot indicating Hospital location */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative flex flex-col items-center">
                          {/* Flashing ripple effect */}
                          <div className="absolute w-6 h-6 bg-red-400 rounded-full animate-ping opacity-60" />
                          <div className="w-4 h-4 bg-red-600 rounded-full z-10 border border-white flex items-center justify-center shadow-xs">
                            <span className="text-[8px] text-white">★</span>
                          </div>
                          
                          {/* Label mockup EXACTLY like image 4 layout */}
                          <div className="mt-1 bg-black/80 text-red-450 px-2.5 py-1 rounded text-[11px] font-extrabold whitespace-nowrap shadow-md z-15 border border-red-500">
                            메이플병원 <br />
                            <span className="text-[9px] text-white">[해솔병원 근무지]</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* text block beneath indicating hospital location exactly */}
                    <div className="mt-3 text-center">
                      <p className="text-sm font-extrabold text-red-600 border-2 border-red-200 bg-red-50 p-2 rounded tracking-wide inline-block">
                        해솔병원 (빨간색 글씨)
                      </p>
                    </div>

                  </div>

                  <div className="p-3 bg-slate-50 border-t border-gray-200">
                    <p className="text-[9.5px] text-gray-500 font-bold leading-none">
                      ※ 로블록스 내 랜드마크 중심 교차로 연동 정보입니다.
                    </p>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

        {/* Right Sidebar ("Quick Menu") identical to the mockups */}
        <div className="w-full lg:w-56 bg-white border border-gray-300 shadow-sm flex flex-col overflow-hidden" id="quick-menu-sidebar">
          
          {/* Blue menu title heading */}
          <div className="bg-[#80d4f7] px-4 py-2.5 text-[#0c4068] text-base font-black tracking-wider text-center border-b border-gray-300">
            Quick Menu
          </div>

          <div className="p-4 flex flex-col items-center border-b border-gray-200 bg-slate-50/50">
            {/* Round grey profile photo */}
            <div className="w-24 h-24 bg-gray-300 rounded-full border-2 border-gray-150 shadow-inner flex items-center justify-center text-gray-400 font-mono text-xs overflow-hidden relative">
              {currentUser ? (
                <div className="w-full h-full bg-cyan-100 flex flex-col items-center justify-center">
                  <User size={36} className="text-cyan-700" />
                </div>
              ) : (
                <div className="w-full h-full bg-gray-250 flex items-center justify-center font-bold">
                  프로필
                </div>
              )}
            </div>

            {/* Profile field descriptions with values */}
            <div className="mt-4 text-center space-y-1 w-full border-t border-slate-200 pt-3">
              <div className="text-xs text-gray-700 font-extrabold flex justify-center items-center gap-1.5">
                <span className="text-gray-400 font-medium">성 명:</span>
                <span className="text-gray-900 font-black">{currentUser ? currentUser.name : '비회원 (의사)'}</span>
              </div>
              <div className="text-xs text-gray-700 font-extrabold flex justify-center items-center gap-1.5">
                <span className="text-gray-400 font-medium">직 급:</span>
                <span className="text-gray-900 font-extrabold">
                  {currentUser ? (
                    currentUser.role === 'admin' ? '관리자/원장' : 
                    currentUser.role === 'writer' ? '전임의' : '임상강사'
                  ) : '미인증 관람객'}
                </span>
              </div>
            </div>
          </div>

          {/* Vertical Menu options */}
          <div className="flex flex-col divide-y divide-gray-200 font-extrabold">
            <button 
              onClick={() => handleQuickMenuAction('예약하기')}
              className="w-full py-3 px-4 text-left text-xs text-gray-800 hover:bg-slate-50 hover:text-cyan-800 flex items-center justify-between group transition-all"
            >
              <span>예약하기</span>
              <span className="text-gray-350 group-hover:translate-x-1 transition-transform">→</span>
            </button>
            <button 
              onClick={() => handleQuickMenuAction('의료진검색')}
              className="w-full py-3 px-4 text-left text-xs text-gray-800 hover:bg-slate-50 hover:text-cyan-800 flex items-center justify-between group transition-all"
            >
              <span>의료진검색</span>
              <span className="text-gray-350 group-hover:translate-x-1 transition-transform">→</span>
            </button>
            <button 
              onClick={() => handleQuickMenuAction('병원장말씀')}
              className="w-full py-3 px-4 text-left text-xs text-gray-800 hover:bg-slate-50 hover:text-cyan-800 flex items-center justify-between group transition-all"
            >
              <span>병원장말씀</span>
              <span className="text-gray-350 group-hover:translate-x-1 transition-transform">→</span>
            </button>
            <button 
              onClick={() => handleQuickMenuAction('칭찬합니다')}
              className="w-full py-3 px-4 text-left text-xs text-gray-800 hover:bg-slate-50 hover:text-cyan-800 flex items-center justify-between group transition-all"
            >
              <span>칭찬합니다</span>
              <span className="text-gray-350 group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {/* Plain blue block on bottom */}
          <div className="bg-[#80d4f7] h-12 flex items-center justify-center text-xs text-cyan-900 font-black tracking-wide border-t border-gray-300">
            해솔병원 신뢰치유
          </div>

        </div>

      </div>

      {/* Toast Alert Modal */}
      {certificateAlert && (
         <div className="fixed bottom-6 left-6 bg-slate-900 text-white p-3.5 rounded-lg shadow-xl flex items-center gap-2 text-xs font-bold border border-slate-700 animate-bounce z-50">
           <span className="text-amber-500">🔖</span>
           <span>가상 증명서 발급사 '메드서티' 포털 서비스에 연결하는 도식입니다. (가상)</span>
         </div>
      )}

    </div>
  );
};
