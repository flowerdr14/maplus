import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Search, User, ShieldAlert, FileText, CheckCircle, Check, X, ShieldCheck, Users, Plus, Trash2, Edit } from 'lucide-react';
import { Patient, User as UserType } from '../types';

export const MyPageView: React.FC = () => {
  const { 
    currentUser, 
    setCurrentUser, 
    articles, 
    setView, 
    setSelectedArticleId, 
    users, 
    updateUsersList, 
    updateUserProfile,
    patients,
    addPatient,
    updatePatient,
    deletePatient
  } = useApp();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // User Profile fields edit state
  const [name, setName] = useState(currentUser?.name || '');
  const [birthdate, setBirthdate] = useState(currentUser?.birthdate || '');
  const [contact, setContact] = useState(currentUser?.contact || currentUser?.phone || '');
  const [joinPath, setJoinPath] = useState(currentUser?.joinPath || '');
  const [pw, setPw] = useState(currentUser?.password || '');
  
  const [savedSuccessAlert, setSavedSuccessAlert] = useState(false);

  // Patient Sub-Panel States (For Developer Admin Only)
  const [patientSearch, setPatientSearch] = useState('');
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  
  const [patName, setPatName] = useState('');
  const [patBirthdate, setPatBirthdate] = useState('');
  const [patContact, setPatContact] = useState('');
  const [patAffiliation, setPatAffiliation] = useState<'일반' | '해솔병원' | '청송대병원'>('일반');
  const [patNotes, setPatNotes] = useState('');
  const [patientAlert, setPatientAlert] = useState('');

  if (!currentUser) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center bg-gray-50" id="mypage-not-logged-in">
        <ShieldAlert size={48} className="text-red-500 mb-2" />
        <h3 className="text-xl font-bold text-gray-850">로그인이 필요한 페이지입니다</h3>
        <p className="text-sm text-gray-400 mt-1">회원으로 가전 정보를 조율하려면 로그인을 마저 행해주십시오.</p>
        <button
          onClick={() => setView('login')}
          className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-5 py-2 rounded shadow-sm text-sm"
        >
          로그인하러 가기
        </button>
      </div>
    );
  }

  // Filter posts written by current user
  let userArticles = articles.filter(art => art.authorId === currentUser.id);

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    userArticles = userArticles.filter(art => 
      art.title.toLowerCase().includes(q) || 
      art.content.toLowerCase().includes(q)
    );
  }

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccessAlert(false);

    const updatedUser = {
      ...currentUser,
      name,
      birthdate,
      phone: contact, // compatibility fallback
      contact,
      joinPath,
      password: pw
    };

    try {
      await updateUserProfile(updatedUser);
      setSavedSuccessAlert(true);
      setTimeout(() => {
        setSavedSuccessAlert(false);
      }, 2500);
    } catch (err) {
      alert("데이터베이스에 프로필을 저장하는 도중 오류가 발생했습니다.");
    }
  };

  const handleRowClick = (id: string) => {
    setSelectedArticleId(id);
    setView('detail');
  };

  const handleApproveAdmin = (userId: string) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          role: u.requestedRole || 'admin',
          adminRequest: 'approved' as const
        };
      }
      return u;
    });
    updateUsersList(updatedUsers);
  };

  const handleRejectAdmin = (userId: string) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          role: 'reader' as const,
          adminRequest: 'rejected' as const
        };
      }
      return u;
    });
    updateUsersList(updatedUsers);
  };

  const handleDemoteToReader = (userId: string) => {
    if (userId === currentUser.id) {
      alert("자기 자신의 권한은 낮출 수 없습니다!");
      return;
    }
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          role: 'reader' as const,
          adminRequest: undefined
        };
      }
      return u;
    });
    updateUsersList(updatedUsers);
  };

  const handlePromoteToWriter = (userId: string) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          role: 'writer' as const,
          adminRequest: 'approved' as const
        };
      }
      return u;
    });
    updateUsersList(updatedUsers);
  };

  const handlePromoteToAdmin = (userId: string) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          role: 'admin' as const,
          adminRequest: 'approved' as const
        };
      }
      return u;
    });
    updateUsersList(updatedUsers);
  };

  // Patients Form Submissions
  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patName.trim() || !patBirthdate.trim() || !patContact.trim()) {
      alert("환자의 이름, 생년월일, 연락처는 필수 입력 필요 사항입니다.");
      return;
    }

    try {
      if (editingPatientId) {
        await updatePatient(editingPatientId, patName.trim(), patBirthdate, patContact.trim(), patAffiliation, patNotes.trim());
        setPatientAlert("환자 정보가 안전하게 갱신되었습니다!");
        setEditingPatientId(null);
      } else {
        await addPatient(patName.trim(), patBirthdate, patContact.trim(), patAffiliation, patNotes.trim());
        setPatientAlert("새로운 환자 레코드가 정상적으로 등록되었습니다!");
      }
      // Reset
      setPatName('');
      setPatBirthdate('');
      setPatContact('');
      setPatAffiliation('일반');
      setPatNotes('');
      setTimeout(() => setPatientAlert(''), 2500);
    } catch (err) {
      alert("환자 정보를 데이터베이스에 반영하는 단계에서 에러가 발생하였습니다.");
    }
  };

  const handleTriggerEditPatient = (pat: Patient) => {
    setEditingPatientId(pat.id);
    setPatName(pat.name);
    setPatBirthdate(pat.birthdate);
    setPatContact(pat.contact);
    setPatAffiliation(pat.affiliation);
    setPatNotes(pat.notes || '');
  };

  const handleTriggerDeletePatient = async (id: string) => {
    if (confirm("정말로 이 환자의 원부 및 치료 로그를 영구 삭제하시겠습니까?")) {
      try {
        await deletePatient(id);
        setPatientAlert("환자 원부가 정상적으로 삭제 처리되었습니다.");
        setTimeout(() => setPatientAlert(''), 2500);
      } catch (err) {
        alert("처리에 실패하였습니다.");
      }
    }
  };

  // Affiliation Specific User Authority Filtering
  // 1. "해솔병원" Admin manages only users signed up with "해솔병원"
  // 2. "청송대병원" Admin manages only users signed up with "청송대병원"
  // 3. "일반" Admin manages only users signed up with "일반"
  // 4. "개발자" (id = 'admin') superadmin manages ALL users!
  const filteredUsersList = users.filter((u: UserType) => {
    if (currentUser.id === 'admin') return true; // Master developer manages everyone
    return (u.affiliation || '일반') === (currentUser.affiliation || '일반');
  });

  // Patient List filtering according to search query
  const filteredPatientsList = patients.filter((pat: Patient) => {
    if (!patientSearch.trim()) return true;
    const q = patientSearch.toLowerCase();
    return (
      pat.name.toLowerCase().includes(q) ||
      pat.contact.toLowerCase().includes(q) ||
      pat.affiliation.toLowerCase().includes(q) ||
      (pat.notes && pat.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 p-6 bg-gray-50 overflow-y-auto" id="mypage-view-panel">
      
      {/* Title Header */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200" id="mypage-header">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-500 text-white p-2.5 rounded-full shadow">
            <User size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              {currentUser.name} 님의 전용 연구실 (내 정보)
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              소속 전용 정보를 수정하고 그동안 게재/보장한 신문 기사들을 총괄 검토하십시오.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: 내 정보 (Profile Form Layout) */}
        <form onSubmit={handleUpdateProfileSubmit} className="bg-white p-6 rounded-lg border border-gray-300 shadow-sm xl:col-span-5 space-y-4" id="mypage-info-box">
          <h3 className="text-2xl font-black text-gray-900 border-b-2 border-black pb-2 mb-4 select-none">
            내 정보
          </h3>

          {savedSuccessAlert && (
            <div className="bg-green-100/80 border border-green-300 text-green-800 p-2.5 rounded text-xs font-bold flex items-center gap-1">
              <CheckCircle size={14} />
              인적사항이 안전하게 업데이트되었습니다!
            </div>
          )}

          {/* 성명 */}
          <div className="flex items-center">
            <label className="text-sm font-bold text-gray-800 w-24 text-right pr-3">성명:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold text-gray-900 text-sm"
            />
          </div>

          {/* 생년월일 */}
          <div className="flex items-center">
            <label className="text-sm font-bold text-gray-800 w-24 text-right pr-3">생년월일:</label>
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-800 font-semibold text-sm"
            />
          </div>

          {/* ID */}
          <div className="flex items-center">
            <label className="text-sm font-bold text-gray-800 w-24 text-right pr-3">ID:</label>
            <input
              type="text"
              readOnly
              value={currentUser.id}
              title="아이디는 변경할 수 없습니다"
              className="flex-1 border border-gray-200 bg-neutral-100 rounded px-2.5 py-1.5 text-gray-500 font-semibold text-sm cursor-not-allowed"
            />
          </div>

          {/* PW */}
          <div className="flex items-center">
            <label className="text-sm font-bold text-gray-800 w-24 text-right pr-3">PW:</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="패스워드 입력"
              className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold text-sm"
            />
          </div>

          {/* 연락처 */}
          <div className="flex items-center">
            <label className="text-sm font-bold text-gray-800 w-24 text-right pr-3">연락처:</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="연락처 기입 (전화번호 또는 이메일)"
              className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold text-gray-900 text-sm"
            />
          </div>

          {/* 소속 */}
          <div className="flex items-center">
            <label className="text-sm font-bold text-gray-800 w-24 text-right pr-3">소속:</label>
            <input
              type="text"
              readOnly
              value={currentUser.affiliation || '일반'}
              title="소속 정보는 변경이 불가합니다"
              className="flex-1 border border-gray-200 bg-neutral-100 rounded px-2.5 py-1.5 text-gray-650 font-semibold text-sm cursor-not-allowed"
            />
          </div>

          {/* 회원유형 (Read only) */}
          <div className="flex items-center py-1">
            <label className="text-sm font-bold text-gray-800 w-24 text-right pr-3">회원유형:</label>
            <div className="flex items-center space-x-6 pl-2">
              <label className="flex items-center space-x-1.5 opacity-80 cursor-not-allowed">
                <input
                  type="radio"
                  readOnly
                  checked={currentUser.role === 'reader'}
                  className="w-4 h-4 accent-gray-500"
                />
                <span className="text-gray-900 font-bold text-sm">열람자</span>
              </label>
              <label className="flex items-center space-x-1.5 opacity-80 cursor-not-allowed">
                <input
                  type="radio"
                  readOnly
                  checked={currentUser.role === 'writer'}
                  className="w-4 h-4 accent-gray-500"
                />
                <span className="text-gray-900 font-bold text-sm">작성자</span>
              </label>
              <label className="flex items-center space-x-1.5 opacity-80 cursor-not-allowed">
                <input
                  type="radio"
                  readOnly
                  checked={currentUser.role === 'admin'}
                  className="w-4 h-4 accent-gray-500"
                />
                <span className="text-gray-900 font-bold text-sm">관리자</span>
              </label>
            </div>
          </div>

          {/* 가입경로 */}
          <div className="flex items-center">
            <label className="text-sm font-bold text-gray-800 w-24 text-right pr-3">가입경로:</label>
            <input
              type="text"
              value={joinPath}
              onChange={(e) => setJoinPath(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold text-gray-900 text-sm"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-black text-white hover:bg-orange-600 font-bold py-2 px-6 rounded text-sm transition shadow-sm"
              id="mypage-info-save-btn"
            >
              수정 내역 저장
            </button>
          </div>
        </form>

        {/* Right Side: - 내가 쓴 글 (My Articles list with search) */}
        <div className="bg-white p-6 rounded-lg border border-gray-300 shadow-sm xl:col-span-7 flex flex-col justify-between min-h-[460px]" id="mypage-posts-box">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-black pb-2 mb-4 gap-2">
              <h3 className="text-xl font-bold text-gray-900">
                - 내가 쓴 글
              </h3>
              
              {/* Internal search bar layout */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="내가 쓴 글 검색..."
                  className="border border-gray-300 rounded px-2.5 py-1 text-xs font-semibold w-full sm:w-48 pr-8 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <Search size={14} className="absolute right-2.5 top-2 text-gray-400" />
              </div>
            </div>

            {currentUser.role === 'reader' ? (
              <div className="text-center py-16 px-4 bg-gray-50 rounded border border-dashed text-gray-400 font-semibold text-sm">
                <FileText className="mx-auto mb-1 text-gray-300" size={36} />
                보유하신 열람자 자격으로는 일보 기사를 작성할 수 없습니다.<br />
                작성자 혹은 관리자 권한을 취득하신 후 일보를 전파해주십시오.
              </div>
            ) : userArticles.length === 0 ? (
              <div className="text-center py-16 px-4 text-gray-400 font-medium text-xs">
                그동안 직접 게재 및 임시저장하신 신문 기사가 없습니다.<br />
                우측 상단 탭에서 일보를 신규 발제해 보세요.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-[11px] font-bold text-gray-800 border-b border-gray-200">
                      <th className="py-2 px-3 text-center w-12">No.</th>
                      <th className="py-2 px-3">제목</th>
                      <th className="py-2 px-3 text-center w-20">조회수</th>
                      <th className="py-2 px-3 text-center w-24">작성일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {userArticles.map((art, idx) => (
                      <tr
                        key={art.id}
                        onClick={() => handleRowClick(art.id)}
                        className="hover:bg-neutral-50 cursor-pointer transition"
                      >
                        <td className="py-2.5 px-3 text-center text-gray-500 font-bold">{userArticles.length - idx}</td>
                        <td className="py-2.5 px-3 font-semibold text-gray-805">
                           <div className="flex items-center space-x-1">
                            {art.isDraft && (
                              <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-[9px] font-bold">임시저장</span>
                            )}
                            {art.isPrivate && (
                              <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[9px] font-bold">비공개</span>
                            )}
                            <span className="truncate max-w-[240px] hover:underline hover:text-orange-600">{art.title}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-gray-600">{art.views}</td>
                        <td className="py-2.5 px-3 text-center text-gray-400 text-[10px]">{art.createdAt.split(' ')[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {(currentUser.role === 'admin' || currentUser.role === 'writer') && (
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setView('write')}
                className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs px-4 py-2 rounded shadow-xs"
              >
                새 기사 작성하러 가기
              </button>
            </div>
          )}

        </div>

        {/* Administrator Approval and User Management Area */}
        {currentUser.role === 'admin' && (
          <div className="bg-white p-6 rounded-lg border border-gray-300 shadow-sm xl:col-span-12 space-y-4" id="mypage-admin-users-panel">
            <div className="border-b-2 border-black pb-2 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="text-orange-500" size={22} />
                  [관리자 전용] {currentUser.id === 'admin' ? '총괄 ' : `${currentUser.affiliation || '일반'} `} 회원 권한 승인 및 관리
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {currentUser.id === 'admin' 
                    ? '플랫폼의 모든 회원을 관리하고 등급을 조율할 수 있습니다.' 
                    : `소속(${currentUser.affiliation || '일반'}) 회원들의 가입 및 등급 승인 신청을 전담하여 승인할 수 있습니다.`}
                </p>
              </div>
              <div className="bg-black text-white px-3 py-1 rounded text-[11px] font-extrabold self-start sm:self-center flex items-center gap-1">
                <Users size={12} />
                관리 대상 회원 수: {filteredUsersList.length}명
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-[11px] font-extrabold text-gray-800 border-b border-gray-200">
                    <th className="py-2.5 px-3">이름</th>
                    <th className="py-2.5 px-3">아이디(ID)</th>
                    <th className="py-2.5 px-3 font-medium">소속</th>
                    <th className="py-2.5 px-3 font-medium">생년월일</th>
                    <th className="py-2.5 px-3 font-medium">연락처</th>
                    <th className="py-2.5 px-3 font-medium">가입경로</th>
                    <th className="py-2.5 px-3 text-center">현재 등급</th>
                    <th className="py-2.5 px-3 text-center">승인 신청 상태</th>
                    <th className="py-2.5 px-3 text-center w-40">권한 부여/관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredUsersList.map((u) => {
                    const isPending = u.adminRequest === 'pending';
                    const originalContact = u.contact || u.phone || '-';
                    return (
                      <tr key={u.id} className={`hover:bg-neutral-50 transition ${isPending ? 'bg-orange-50/40' : ''}`}>
                        <td className="py-3 px-3 font-extrabold text-gray-900">{u.name}</td>
                        <td className="py-3 px-3 font-mono text-gray-650 font-bold">{u.id}</td>
                        <td className="py-3 px-3">
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-200">
                            {u.affiliation || '일반'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-500 font-medium">{u.birthdate}</td>
                        <td className="py-3 px-3 text-gray-650 font-semibold">{originalContact}</td>
                        <td className="py-3 px-3 text-gray-500 font-medium">{u.joinPath}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            u.role === 'admin' 
                              ? 'bg-orange-100 text-orange-900 border border-orange-200' 
                              : u.role === 'writer'
                                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                : 'bg-neutral-100 text-neutral-600'
                          }`}>
                            {u.role === 'admin' ? '관리자' : u.role === 'writer' ? '작성자' : '열람자'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {u.adminRequest === 'pending' && (
                            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[9px] font-extrabold border border-amber-300 animate-pulse block">
                              승인 대기중 {u.requestedRole && `(${u.requestedRole === 'admin' ? '관리자' : '작성자'})`}
                            </span>
                          )}
                          {u.adminRequest === 'approved' && (
                            <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-[9px] font-extrabold border border-green-200">
                              승인 완료
                            </span>
                          )}
                          {u.adminRequest === 'rejected' && (
                            <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded text-[9px] font-extrabold border border-rose-200 animate-none">
                              반려처리
                            </span>
                          )}
                          {!u.adminRequest && (
                            <span className="text-gray-300 text-[10px]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            {isPending ? (
                              <>
                                <button
                                  onClick={() => handleApproveAdmin(u.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-[10px] px-2 py-1 rounded shadow-xs flex items-center gap-0.5 transition"
                                  title="신청 접수 승인"
                                >
                                  <Check size={11} />
                                  승인
                                </button>
                                <button
                                  onClick={() => handleRejectAdmin(u.id)}
                                  className="bg-white hover:bg-gray-100 text-red-600 border border-red-300 font-extrabold text-[10px] px-2 py-1 rounded shadow-xs flex items-center gap-0.5 transition"
                                  title="신청 반려"
                                >
                                  <X size={11} />
                                  반려
                                </button>
                              </>
                            ) : u.role !== 'reader' ? (
                              <button
                                onClick={() => handleDemoteToReader(u.id)}
                                disabled={u.id === currentUser.id}
                                className={`text-[10px] font-extrabold px-2 py-1 rounded border shadow-xs transition ${
                                  u.id === currentUser.id
                                    ? 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed'
                                    : 'bg-white hover:bg-red-50 text-red-600 border-red-300'
                                }`}
                                title="열람자 등급으로 권한 축소"
                              >
                                {u.id === currentUser.id ? '본인 계정' : '열람자로 하방'}
                              </button>
                            ) : (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handlePromoteToWriter(u.id)}
                                  className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-300 font-extrabold text-[10px] px-2 py-1 rounded shadow-xs transition"
                                  title="작성자 등급으로 직위 승격"
                                >
                                  작성자 승격
                                </button>
                                <button
                                  onClick={() => handlePromoteToAdmin(u.id)}
                                  className="bg-white hover:bg-orange-50 text-orange-600 border border-orange-300 font-extrabold text-[10px] px-2 py-1 rounded shadow-xs transition"
                                  title="관리자 등급으로 직위 승격"
                                >
                                  관리자 승격
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Developer Exclusive Patient Management System */}
        {currentUser.id === 'admin' && (
          <div className="bg-white p-6 rounded-lg border border-red-200 bg-red-50/10 shadow-sm xl:col-span-12 space-y-6" id="mypage-developer-patients-panel">
            
            {/* Title Block */}
            <div className="border-b-2 border-red-500 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xl font-black text-rose-950 flex items-center gap-2">
                  <span className="bg-red-650 text-white rounded-full p-1 leading-none text-xs">HOT</span>
                  [관리 개발자 전용] 환자 원부 정보 관리 센터 (Patient DB)
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  병원의 환자 기본 정보와 의료 참고사항(특이사항)을 통합 및 전용 보장하는 관리 화면입니다. 다른 일반/병원 관리자는 일체 접근할 수 없습니다.
                </p>
              </div>
              <div className="bg-red-600 text-white px-3 py-1 rounded text-[11px] font-extrabold self-start sm:self-center flex items-center gap-1">
                <Users size={12} />
                등록된 환자 수: {patients.length}명
              </div>
            </div>

            {patientAlert && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded text-xs font-bold animate-pulse">
                {patientAlert}
              </div>
            )}

            {/* Inner Bento Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Form: 등록 및 수정 양식 */}
              <form onSubmit={handlePatientSubmit} className="lg:col-span-4 bg-white p-5 rounded-lg border border-gray-300 shadow-xs space-y-4">
                <h4 className="text-base font-bold text-red-950 border-b border-lightgray pb-1">
                  {editingPatientId ? "◆ 환자 정보 수정" : "◆ 신규 환자 등록"}
                </h4>

                {/* 이름 Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">이름 *</label>
                  <input
                    type="text"
                    value={patName}
                    onChange={(e) => setPatName(e.target.value)}
                    placeholder="환자 성명 기입"
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs font-semibold"
                    required
                  />
                </div>

                {/* 생년월일 Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">생년월일 *</label>
                  <input
                    type="date"
                    value={patBirthdate}
                    onChange={(e) => setPatBirthdate(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs text-gray-800 font-semibold"
                    required
                  />
                </div>

                {/* 연락처 Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">연락처 * (전화번호 혹은 이메일)</label>
                  <input
                    type="text"
                    value={patContact}
                    onChange={(e) => setPatContact(e.target.value)}
                    placeholder="예: 010-1234-5678 또는 contact@mail.com"
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs font-semibold"
                    required
                  />
                </div>

                {/* 소속 선택 */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">환자 소속 의료기관 *</label>
                  <select
                    value={patAffiliation}
                    onChange={(e) => setPatAffiliation(e.target.value as any)}
                    className="w-full border border-gray-300 rounded px-2 bg-white py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs font-bold text-gray-850"
                  >
                    <option value="일반">일반 / 개인</option>
                    <option value="해솔병원">해솔병원</option>
                    <option value="청송대병원">청송대병원</option>
                  </select>
                </div>

                {/* 특이사항 Notes */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">특이사항 / 진단의 소견 및 참고 메모</label>
                  <textarea
                    value={patNotes}
                    onChange={(e) => setPatNotes(e.target.value)}
                    placeholder="환자의 주요 증세나 진료 조율 일정 등을 적어주세요."
                    rows={4}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs text-gray-750 font-normal leading-relaxed"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-red-650 hover:bg-red-750 text-white font-extrabold text-xs py-2 rounded shadow-sm text-center flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    {editingPatientId ? "정보 수정 완료" : "환자 등록하기"}
                  </button>
                  {editingPatientId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPatientId(null);
                        setPatName('');
                        setPatBirthdate('');
                        setPatContact('');
                        setPatAffiliation('일반');
                        setPatNotes('');
                      }}
                      className="bg-gray-100 hover:bg-gray-250 border border-gray-300 text-gray-700 font-bold text-xs px-3 rounded"
                    >
                      취소
                    </button>
                  )}
                </div>
              </form>

              {/* Right Table: 환자 명단 및 명 검색 */}
              <div className="lg:col-span-8 bg-white p-5 rounded-lg border border-gray-300 shadow-xs flex flex-col justify-between min-h-[460px]">
                <div>
                  {/* Search Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b pb-2">
                    <h4 className="text-sm font-bold text-gray-900">- 환자 마스터 데이터베이스</h4>
                    <div className="relative">
                      <input
                        type="text"
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        placeholder="이름, 병원, 특이사항 검색..."
                        className="border border-gray-300 rounded px-2.5 py-1 text-xs font-semibold w-full sm:w-56 pr-8 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                      <Search size={14} className="absolute right-2.5 top-2 text-gray-400" />
                    </div>
                  </div>

                  {/* List Grid / Table */}
                  {filteredPatientsList.length === 0 ? (
                    <div className="text-center py-24 text-gray-400 font-medium text-xs">
                      검색 조건에 부합되거나 수집된 환자 데이터가 없습니다.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-red-50/50 text-[11px] font-bold text-red-950 border-b border-gray-250">
                            <th className="py-2 px-3">환자명</th>
                            <th className="py-2 px-3">생년월일</th>
                            <th className="py-2 px-3">소속</th>
                            <th className="py-2 px-3">연락처 (전화/이메일)</th>
                            <th className="py-2 px-3">특이사항/메모</th>
                            <th className="py-2 px-3 text-center w-24">작업</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-[11px]">
                          {filteredPatientsList.map((pat) => (
                            <tr key={pat.id} className="hover:bg-red-50/10 transition">
                              <td className="py-2.5 px-3 font-extrabold text-gray-900">{pat.name}</td>
                              <td className="py-2.5 px-3 text-gray-600 font-semibold">{pat.birthdate}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                  pat.affiliation === '해솔병원'
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                    : pat.affiliation === '청송대병원'
                                      ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                      : 'bg-neutral-50 text-neutral-800 border border-neutral-200'
                                }`}>
                                  {pat.affiliation}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-gray-800 font-mono font-semibold">{pat.contact}</td>
                              <td className="py-2.5 px-3 text-gray-600 font-medium max-w-[160px] truncate" title={pat.notes}>
                                {pat.notes || '-'}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    onClick={() => handleTriggerEditPatient(pat)}
                                    className="p-1 hover:bg-neutral-100 text-blue-600 rounded"
                                    title="환자 수정"
                                  >
                                    <Edit size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleTriggerDeletePatient(pat.id)}
                                    className="p-1 hover:bg-red-50 text-rose-600 rounded"
                                    title="환자 삭제"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
