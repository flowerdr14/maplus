import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Search, User, ShieldAlert, FileText, CheckCircle, Eye, Check, X, ShieldCheck, Users } from 'lucide-react';
import { Article } from '../types';

export const MyPageView: React.FC = () => {
  const { currentUser, setCurrentUser, articles, setView, setSelectedArticleId, users, updateUsersList, updateUserProfile } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  
  // User Profile fields edit state
  const [name, setName] = useState(currentUser?.name || '');
  const [birthdate, setBirthdate] = useState(currentUser?.birthdate || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [joinPath, setJoinPath] = useState(currentUser?.joinPath || '');
  const [pw, setPw] = useState(currentUser?.password || '');
  
  const [savedSuccessAlert, setSavedSuccessAlert] = useState(false);

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
      phone,
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

          {/* 전화번호 */}
          <div className="flex items-center">
            <label className="text-sm font-bold text-gray-800 w-24 text-right pr-3">전화번호:</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold text-gray-900 text-sm"
            />
          </div>

          {/* 회원유형 (Read only, styled like radio boxes as requested in Image 11) */}
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
                  [관리자 전용] 회원 권한 승인 및 관리
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  회원가입 완료 후 관리자 등급을 신청한 사용자들의 승인 처리를 조회 및 조율할 수 있습니다.
                </p>
              </div>
              <div className="bg-black text-white px-3 py-1 rounded text-[11px] font-extrabold self-start sm:self-center flex items-center gap-1">
                <Users size={12} />
                총 회원 수: {users.length}명
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-[11px] font-extrabold text-gray-800 border-b border-gray-200">
                    <th className="py-2.5 px-3">이름</th>
                    <th className="py-2.5 px-3">아이디(ID)</th>
                    <th className="py-2.5 px-3 font-medium">생년월일</th>
                    <th className="py-2.5 px-3 font-medium">전화번호</th>
                    <th className="py-2.5 px-3 font-medium">가입경로</th>
                    <th className="py-2.5 px-3 text-center">현재 등급</th>
                    <th className="py-2.5 px-3 text-center">승인 신청 상태</th>
                    <th className="py-2.5 px-3 text-center w-40">권한 부여/관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {users.map((u) => {
                    const isPending = u.adminRequest === 'pending';
                    return (
                      <tr key={u.id} className={`hover:bg-neutral-50 transition ${isPending ? 'bg-orange-50/40' : ''}`}>
                        <td className="py-3 px-3 font-extrabold text-gray-900">{u.name}</td>
                        <td className="py-3 px-3 font-mono text-gray-650 font-bold">{u.id}</td>
                        <td className="py-3 px-3 text-gray-500 font-medium">{u.birthdate}</td>
                        <td className="py-3 px-3 text-gray-500 font-medium">{u.phone}</td>
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

      </div>
    </div>
  );
};
