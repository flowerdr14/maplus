import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { ShieldAlert, CheckCircle, Mail } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginUser, setView } = useApp();
  const [userid, setUserid] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!userid.trim() || !password.trim()) {
      setErrorMsg('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    const matched = loginUser(userid, password);
    if (matched) {
      setSuccessMsg(`${matched.name} 님, 환영합니다!`);
      setTimeout(() => {
        setView('home');
      }, 1000);
    } else {
      setErrorMsg('가입되지 않은 로그인 정보이거나 비밀번호가 일치하지 않습니다.');
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col items-center justify-center bg-gray-50 overflow-y-auto" id="login-view-panel">
      <div className="w-full max-w-xl bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        
        {/* LOGIN Title */}
        <h2 className="text-4xl font-extrabold tracking-[0.2em] text-center text-gray-900 mb-8 border-b-2 border-gray-100 pb-4 select-none">
          LOGIN
        </h2>

        {/* Messaging Area */}
        {errorMsg && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded border border-red-200 flex items-center gap-2 text-sm">
            <ShieldAlert size={16} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 bg-green-50 text-green-700 p-3 rounded border border-green-200 flex items-center gap-2 text-sm animate-pulse">
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center space-x-3">
            <label className="text-xl font-extrabold text-gray-800 w-16 text-right">ID:</label>
            <input
              type="text"
              value={userid}
              onChange={(e) => setUserid(e.target.value)}
              placeholder="아이디를 입력하세요"
              className="flex-1 border-2 border-black rounded-sm px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              id="login-id-field"
            />
          </div>

          <div className="flex items-center space-x-3">
            <label className="text-xl font-extrabold text-gray-800 w-16 text-right">PW:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="flex-1 border-2 border-black rounded-sm px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              id="login-pw-field"
            />
          </div>

          {/* Toggle buttons */}
          <div className="flex items-center justify-between pl-[76px]">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={keepLoggedIn}
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
                className="w-5 h-5 accent-orange-500 border-2 border-black rounded-sm"
              />
              <span className="text-base font-bold text-gray-900">로그인 유지</span>
            </label>
            
            <button
              type="submit"
              className="bg-black hover:bg-orange-600 text-white font-black text-lg px-6 py-2 rounded-sm transition duration-200 shadow-sm"
            >
              로그인
            </button>
          </div>
        </form>

        {/* Notice/Lost Accounts Area */}
        <div className="mt-8 bg-gray-200 p-5 rounded-sm border border-gray-300 text-sm text-gray-800 space-y-3" id="login-trouble-hint">
          <p className="font-bold text-gray-900 border-b border-gray-300 pb-1.5">
            만약 아이디나 비밀번호를 잊어버렸다면?
          </p>
          <ul className="space-y-2 text-xs md:text-sm font-medium">
            <li className="flex items-start">
              <span className="text-orange-600 mr-1">※</span>
              <span>아이디를 잊어버린 경우: 제작자 이메일로 성명, 소속을 보내고 답을 받으세요.</span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-600 mr-1">※</span>
              <span>비밀번호를 잊어버린 경우: 제작자 이메일로 성명, 아이디, 소속을 보내세요.</span>
            </li>
          </ul>
          <div className="pt-2 text-xs text-gray-500 border-t border-gray-300 flex items-center justify-end gap-1 font-semibold">
            <Mail size={12} />
            <span>제작자 이메일: xheepjaeone@gmail.com</span>
          </div>
        </div>

      </div>
    </div>
  );
};
