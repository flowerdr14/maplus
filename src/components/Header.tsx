import React from 'react';
import { useApp } from '../AppContext';
import { LogIn, UserPlus, LogOut, User as UserIcon, Plus } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    view,
    setView,
    currentUser,
    setCurrentUser,
    activeTab,
    setActiveTab,
    setSelectedSidebarFilter,
  } = useApp();

  const categories: Array<'전체일보' | '원내소식' | '업데이트' | '단체소식'> = [
    '전체일보',
    '원내소식',
    '업데이트',
    '단체소식',
  ];

  const handleCategoryClick = (cat: '전체일보' | '원내소식' | '업데이트' | '단체소식') => {
    setActiveTab(cat);
    setSelectedSidebarFilter(null);
    setView('list');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('home');
  };

  return (
    <header className="w-full bg-[#f4f4f4] border-b-2 border-[#b0b0b0] px-4 py-3 flex flex-wrap items-center justify-between shadow-sm">
      {/* Logo Section */}
      <div 
        onClick={() => { setView('home'); setSelectedSidebarFilter(null); }}
        className="flex items-center space-x-2 cursor-pointer select-none group"
        id="header-logo-section"
      >
        <div className="flex flex-col">
          <div className="flex items-baseline leading-none">
            <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 to-amber-600 bg-clip-text text-transparent group-hover:opacity-90">
              MaplUS
            </span>
            <span className="text-2xl font-black text-amber-500 ml-1 drop-shadow-sm">+</span>
          </div>
          <span className="text-[10px] font-bold text-orange-600 tracking-wider leading-none mt-1">
            메이플러스 일보
          </span>
        </div>
      </div>

      {/* Main Horizontal Tab Menu */}
      <nav className="flex items-center space-x-1 md:space-x-4 font-sans text-lg md:text-xl font-bold text-gray-800" id="main-nav-menu">
        {categories.map((cat, idx) => {
          const isSelected = activeTab === cat && (view === 'list' || view === 'write' || view === 'detail');
          return (
            <React.Fragment key={cat}>
              {idx > 0 && <span className="text-gray-400 font-medium px-1">|</span>}
              <button
                onClick={() => handleCategoryClick(cat)}
                className={`py-1 px-3 md:px-4 rounded-md transition duration-200 hover:text-orange-600 ${
                  isSelected ? 'bg-gray-300 text-black border-b-2 border-gray-600' : 'text-gray-800'
                }`}
                id={`tab-btn-${cat}`}
              >
                {cat}
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Right Side Buttons: Auth / User info */}
      <div className="flex items-center space-x-3 md:space-x-4 text-sm font-semibold text-gray-600" id="header-auth-section">
        {currentUser ? (
          <div className="flex items-center space-x-2 md:space-x-3">
            <span className="text-gray-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 text-xs md:text-sm flex items-center gap-1">
              <UserIcon size={14} className="text-amber-600" />
              <strong className="text-amber-800">{currentUser.name}</strong> 님
            </span>
            <button
              onClick={() => setView('mypage')}
              className={`hover:text-amber-600 flex items-center gap-1 py-1 px-2 rounded-md ${view === 'mypage' ? 'bg-amber-100 text-amber-700' : ''}`}
              id="header-mypage-btn"
            >
              내 정보
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleLogout}
              className="hover:text-red-500 flex items-center gap-1 py-1 px-2 hover:bg-red-50 rounded-md transition duration-150"
              id="header-logout-btn"
            >
              <LogOut size={14} />
              로그아웃
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 md:space-x-3">
            <button
              onClick={() => setView('login')}
              className={`hover:text-orange-600 hover:bg-orange-50 px-2.5 py-1.5 rounded-md flex items-center gap-1 transition duration-150 ${view === 'login' ? 'text-orange-600 bg-orange-50 font-bold' : ''}`}
              id="header-login-btn"
            >
              <LogIn size={14} />
              LOGIN
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => setView('join')}
              className={`hover:text-orange-600 hover:bg-orange-50 px-2.5 py-1.5 rounded-md flex items-center gap-1 transition duration-150 ${view === 'join' ? 'text-orange-600 bg-orange-50 font-bold font-semibold' : ''}`}
              id="header-join-btn"
            >
              <UserPlus size={14} />
              JOIN IN
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
