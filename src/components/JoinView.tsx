import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { ShieldCheck, XCircle, CheckCircle } from 'lucide-react';

export const JoinView: React.FC = () => {
  const { registerUser, users, setView } = useApp();

  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [id, setId] = useState('');
  const [isIdChecked, setIsIdChecked] = useState(false);
  const [idCheckedMsg, setIdCheckedMsg] = useState('');
  const [idError, setIdError] = useState(false);
  const [pw, setPw] = useState('');
  const [contact, setContact] = useState('');
  const [role, setRole] = useState<'reader' | 'writer' | 'admin'>('reader');
  const [joinPath, setJoinPath] = useState('');
  const [affiliation, setAffiliation] = useState<'일반' | '해솔병원' | '청송대병원'>('일반');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleIdCheck = () => {
    setIdCheckedMsg('');
    setIdError(false);
    
    if (!id.trim()) {
      setIdError(true);
      setIdCheckedMsg('검사할 아이디를 입력해주세요.');
      return;
    }

    const EnglishAlphanumericRegex = /^[a-zA-Z0-9]+$/;
    if (!EnglishAlphanumericRegex.test(id)) {
      setIdError(true);
      setIdCheckedMsg('아이디는 영문(대소문자) 또는 숫자만 입력 가능합니다.');
      return;
    }

    const exists = users.some(u => u.id.toLowerCase() === id.trim().toLowerCase());
    setIsIdChecked(true);
    if (exists) {
      setIdError(true);
      setIdCheckedMsg('이미 등록된 아이디입니다.');
    } else {
      setIdError(false);
      setIdCheckedMsg('사용 가능한 아이디입니다.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim() || !birthdate.trim() || !id.trim() || !pw.trim() || !contact.trim() || !joinPath.trim()) {
      setErrorMsg('모든 필수 항목을 기입해주시기 바랍니다.');
      return;
    }

    if (!isIdChecked) {
      setErrorMsg('아이디 중복 검사를 진행해주십시오.');
      return;
    }

    if (idError) {
      setErrorMsg('사용 중인 아이디로는 가입할 수 없습니다.');
      return;
    }

    const newUser = {
      id: id.trim(),
      name: name.trim(),
      birthdate,
      password: pw,
      phone: contact.trim(), // for backward safety
      contact: contact.trim(),
      affiliation,
      role: 'reader' as const, // 일단 열람자로 가입
      joinPath: joinPath.trim(),
      ...(role !== 'reader' ? { adminRequest: 'pending' as const, requestedRole: role } : {})
    };

    const success = await registerUser(newUser);
    if (success) {
      if (role !== 'reader') {
        setSuccessMsg(`${role === 'admin' ? '관리자' : '작성자'} 권한 신청이 접수되었습니다! 승인 완료 전까지는 열람자 자격으로 로그인 가능합니다.`);
      } else {
        setSuccessMsg('회원가입이 정상적으로 완료되었습니다. 로그인 페이지로 이동합니다.');
      }
      setTimeout(() => {
        setView('login');
      }, 2500);
    } else {
      setErrorMsg('아이디 등록 처리에 실패했습니다. 중복 여부를 재확인해주십시오.');
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col items-center justify-center bg-gray-50 overflow-y-auto" id="join-view-panel">
      <div className="w-full max-w-xl bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        
        {/* Title */}
        <h2 className="text-4xl font-extrabold text-center text-gray-950 mb-8 border-b-2 border-gray-100 pb-4 select-none">
          회 원 가 입
        </h2>

        {/* System Logs / Messaging Banners */}
        {errorMsg && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded border border-red-200 flex items-center gap-2 text-sm">
            <XCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 bg-green-50 text-green-700 p-3 rounded border border-green-200 flex items-center gap-2 text-sm animate-pulse">
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          
          {/* 성명 */}
          <div className="flex items-center">
            <label className="text-lg font-bold text-gray-800 w-24 text-right pr-3">성명:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="성명을 기입하세요"
              className="flex-1 border border-gray-400 rounded-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-gray-850"
              id="join-name-input"
            />
          </div>

          {/* 생년월일 */}
          <div className="flex items-center">
            <label className="text-lg font-bold text-gray-800 w-24 text-right pr-3">생년월일:</label>
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="flex-1 border border-gray-400 rounded-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 font-medium"
              id="join-birth-input"
            />
          </div>

          {/* 아이디 & 중복확인 */}
          <div className="flex flex-col pl-24 mb-1">
            <div className="flex items-center w-full">
              <input
                type="text"
                value={id}
                onChange={(e) => {
                  const cleanedVal = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                  setId(cleanedVal);
                  setIsIdChecked(false);
                  setIdCheckedMsg('');
                }}
                placeholder="희망하는 아이디를 기입하세요 (영문/숫자)"
                className="flex-1 border border-gray-400 rounded-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-gray-850 mr-2"
                id="join-id-input"
              />
              <button
                type="button"
                onClick={handleIdCheck}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1.5 px-4 rounded-sm transition duration-150 text-sm whitespace-nowrap min-w-[90px]"
                id="join-id-check-btn"
              >
                중복확인
              </button>
            </div>
            {idCheckedMsg && (
              <span className={`text-xs font-semibold mt-1 ml-1 ${idError ? 'text-red-500' : 'text-green-600'}`}>
                {idCheckedMsg}
              </span>
            )}
          </div>

          {/* 비밀번호 */}
          <div className="flex items-center">
            <label className="text-lg font-bold text-gray-800 w-24 text-right pr-3">PW:</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="패스워드를 입력하세요"
              className="flex-1 border border-gray-400 rounded-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              id="join-pw-input"
            />
          </div>

          {/* 연락처 */}
          <div className="flex items-center">
            <label className="text-lg font-bold text-gray-800 w-24 text-right pr-3">연락처:</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="연락처를 입력하세요 (이메일 또는 전화번호 가능)"
              className="flex-1 border border-gray-400 rounded-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-gray-850"
              id="join-contact-input"
            />
          </div>

          {/* 소속 */}
          <div className="flex items-center">
            <label className="text-lg font-bold text-gray-800 w-24 text-right pr-3">소속:</label>
            <div className="flex items-center space-x-4 pl-2 flex-wrap gap-y-2">
              <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                <input
                  type="radio"
                  name="affiliation"
                  value="일반"
                  checked={affiliation === '일반'}
                  onChange={() => setAffiliation('일반')}
                  className="w-5 h-5 accent-orange-500 border border-black cursor-pointer"
                />
                <span className="text-gray-900 font-extrabold text-[17px] cursor-pointer">일반</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                <input
                  type="radio"
                  name="affiliation"
                  value="해솔병원"
                  checked={affiliation === '해솔병원'}
                  onChange={() => setAffiliation('해솔병원')}
                  className="w-5 h-5 accent-orange-500 border border-black cursor-pointer"
                />
                <span className="text-gray-900 font-extrabold text-[17px] cursor-pointer">해솔병원</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                <input
                  type="radio"
                  name="affiliation"
                  value="청송대병원"
                  checked={affiliation === '청송대병원'}
                  onChange={() => setAffiliation('청송대병원')}
                  className="w-5 h-5 accent-orange-500 border border-black cursor-pointer"
                />
                <span className="text-gray-900 font-extrabold text-[17px] cursor-pointer">청송대병원</span>
              </label>
            </div>
          </div>

          {/* 회원유형: 열람자 (reader) vs 작성자 (writer) vs 관리자 (admin) */}
          <div className="flex items-center py-1">
            <label className="text-lg font-bold text-gray-800 w-24 text-right pr-3">회원유형:</label>
            <div className="flex items-center space-x-6 pl-2">
              <label className="flex items-center space-x-1.5 cursor-pointer selection:bg-transparent">
                <input
                  type="radio"
                  name="userType"
                  value="reader"
                  checked={role === 'reader'}
                  onChange={() => setRole('reader')}
                  className="w-5 h-5 accent-orange-500 border border-black"
                />
                <span className="text-gray-900 font-extrabold text-[17px]">열람자</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer selection:bg-transparent">
                <input
                  type="radio"
                  name="userType"
                  value="writer"
                  checked={role === 'writer'}
                  onChange={() => setRole('writer')}
                  className="w-5 h-5 accent-orange-500 border border-black"
                />
                <span className="text-gray-900 font-extrabold text-[17px]">작성자</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer selection:bg-transparent">
                <input
                  type="radio"
                  name="userType"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={() => setRole('admin')}
                  className="w-5 h-5 accent-orange-500 border border-black"
                />
                <span className="text-gray-900 font-extrabold text-[17px]">관리자</span>
              </label>
            </div>
          </div>

          {role !== 'reader' && (
            <div className="pl-24 py-1">
              <div className="bg-red-50 border-2 border-red-200 text-red-700 text-xs font-bold p-3 rounded-sm flex items-start gap-1.5 leading-relaxed">
                <ShieldCheck size={16} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-extrabold text-red-800 mb-0.5">권한 승인 안내</p>
                  <p className="text-gray-700 font-medium font-sans">
                    {role === 'writer' ? '작성자' : '관리자'} 권한은 가입 완료 후 총괄 관리자의 승인이 필요합니다. <strong className="text-orange-600 underline text-sm">ns.0.yujin@gmail.com</strong> 으로 문의 바랍니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 가입경로 */}
          <div className="flex items-center">
            <label className="text-lg font-bold text-gray-800 w-24 text-right pr-3">가입경로:</label>
            <input
              type="text"
              value={joinPath}
              onChange={(e) => setJoinPath(e.target.value)}
              placeholder="가입 경로를 입력하세요 (예: 친구 소개, 검색 등)"
              className="flex-1 border border-gray-400 rounded-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-gray-850"
              id="join-path-input"
            />
          </div>

          {/* Submit button aligned to right bottom */}
          <div className="flex justify-end pt-6">
            <button
              type="submit"
              className="bg-gray-500 hover:bg-orange-600 text-white font-extrabold text-base py-2.5 px-6 rounded-sm shadow transition duration-200"
              id="join-submit-btn"
            >
              {role !== 'reader' ? '신청하기' : '회원가입 완료'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
