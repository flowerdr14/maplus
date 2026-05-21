import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Search, ChevronDown, PenTool, LayoutList, Hospital, EyeOff, Lock } from 'lucide-react';
import { Article } from '../types';

export const ArticleListView: React.FC = () => {
  const {
    setView,
    articles,
    activeTab,
    selectedSidebarFilter,
    setSelectedSidebarFilter,
    setSelectedArticleId,
    incrementViews,
    currentUser,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'views' | 'date'>('latest');
  
  // Dynamic Hospital subcategory filter when activeTab is "단체소식"
  // As shown in Image 10, a dropdown with "해솔병원" etc is there
  const [hospitalSubFilter, setHospitalSubFilter] = useState<'all' | '해솔' | '청송대'>('all');
  const [showSubFilterDropdown, setShowSubFilterDropdown] = useState(false);

  // Filter articles based on activeTab, sidebar category, search queries and permissions
  let filtered = articles.filter(art => {
    // 1. Never show pure drafts unless of course we are the author
    if (art.isDraft) {
      return currentUser && art.authorId === currentUser.id;
    }
    return true;
  });

  // Filter based on active tab
  if (activeTab === '원내소식') {
    filtered = filtered.filter(art => art.category === '원내소식');
  } else if (activeTab === '업데이트') {
    filtered = filtered.filter(art => art.category === '업데이트');
  } else if (activeTab === '단체소식') {
    filtered = filtered.filter(art => art.category === '단체소식');
    
    // Subcategory hospital filter
    if (hospitalSubFilter === '해솔') {
      filtered = filtered.filter(art => art.subCategory === '해솔');
    } else if (hospitalSubFilter === '청송대') {
      filtered = filtered.filter(art => art.subCategory === '청송대');
    }
  }
  // '전체일보' shows all articles

  // Filter based on selected sidebar item
  if (selectedSidebarFilter) {
    if (selectedSidebarFilter === '해솔병원 소식') {
      filtered = filtered.filter(art => art.sidebarCategory === '해솔병원 소식');
    } else if (selectedSidebarFilter === '청송대병원 소식') {
      filtered = filtered.filter(art => art.sidebarCategory === '청송대병원 소식');
    } else if (selectedSidebarFilter === '병원 업데이트') {
      filtered = filtered.filter(art => art.sidebarCategory === '병원 업데이트');
    } else if (selectedSidebarFilter === '원내 소식') {
      filtered = filtered.filter(art => art.sidebarCategory === '원내 소식');
    } else if (selectedSidebarFilter === 'BEST 소식') {
      filtered = filtered.filter(art => art.views >= 300);
    }
  }

  // Filter based on search query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(art => 
      art.title.toLowerCase().includes(q) || 
      art.content.toLowerCase().includes(q) ||
      art.author.toLowerCase().includes(q)
    );
  }

  // Sort articles
  if (sortBy === 'latest') {
    filtered.sort((a, b) => b.id.localeCompare(a.id));
  } else if (sortBy === 'views') {
    filtered.sort((a, b) => b.views - a.views);
  } else if (sortBy === 'date') {
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const handleRowClick = (art: Article) => {
    // If password-locked and user isn't the author
    if (art.password && (!currentUser || currentUser.id !== art.authorId)) {
      const entered = prompt('이 기사는 비밀번호로 보관되어 있습니다. 암호를 입력하십시오:');
      if (entered !== art.password) {
        alert('비밀번호가 올바르지 않아 기사를 열람할 수 없습니다.');
        return;
      }
    }

    setSelectedArticleId(art.id);
    incrementViews(art.id);
    setView('detail');
  };

  const getSubcategoryName = () => {
    if (hospitalSubFilter === 'all') return '전체 병원';
    if (hospitalSubFilter === '해솔') return '해솔병원 소식';
    return '청송대병원 소식';
  };

  return (
    <div className="flex-1 p-6 bg-white overflow-y-auto" id="article-list-view-panel">
      
      {/* Header toolbar layout matching images exactly */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4" id="list-toolbar">
        
        {/* Left Side: Hospital Dropdown if 단체소식 tab is selected (Image 10) */}
        <div className="flex items-center gap-2">
          {activeTab === '단체소식' && (
            <div className="relative">
              <button
                onClick={() => setShowSubFilterDropdown(!showSubFilterDropdown)}
                className="flex items-center space-x-2 border-2 border-black rounded-sm px-4 py-1.5 font-bold hover:bg-gray-50 transition"
                id="hospital-subfilter-dropdown-btn"
              >
                <span>{getSubcategoryName()}</span>
                <ChevronDown size={16} />
              </button>
              {showSubFilterDropdown && (
                <div className="absolute left-0 mt-1 w-48 bg-white border-2 border-black shadow-lg z-10 rounded-sm">
                  <button
                    onClick={() => { setHospitalSubFilter('all'); setShowSubFilterDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-gray-100 border-b border-gray-100"
                  >
                    전체 병원 소식
                  </button>
                  <button
                    onClick={() => { setHospitalSubFilter('해솔'); setShowSubFilterDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-gray-100 border-b border-gray-100"
                  >
                    해솔병원
                  </button>
                  <button
                    onClick={() => { setHospitalSubFilter('청송대'); setShowSubFilterDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-gray-100"
                  >
                    청송대병원
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Heading state breadcrumb */}
          <div className="text-sm font-semibold text-gray-500">
            {activeTab} {selectedSidebarFilter ? `> ${selectedSidebarFilter}` : ''} ({filtered.length}건)
          </div>
        </div>

        {/* Right Side: Sorting select and Search input (Exactly matching images layout) */}
        <div className="flex items-center space-x-2 self-end w-full md:w-auto">
          {/* Sorting Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'latest' | 'views' | 'date')}
              className="appearance-none bg-white border-2 border-black rounded-sm py-1.5 pl-3 pr-8 font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
              id="list-sort-select"
            >
              <option value="latest">최신순</option>
              <option value="views">인기순</option>
              <option value="date">날짜순</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ChevronDown size={16} />
            </div>
          </div>

          {/* Search Bar Input */}
          <div className="relative flex-1 md:flex-initial">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색어를 입력하세요..."
              className="border-2 border-black rounded-sm px-3 py-1.5 text-sm font-medium w-full md:w-64 pr-10 focus:outline-none focus:ring-1 focus:ring-orange-500"
              id="list-search-input"
            />
            <Search className="absolute right-3 top-2.5 text-gray-800" size={17} />
          </div>
        </div>
      </div>

      {/* Main Table Content - Swaps Title header column dynamically for '업데이트' */}
      <div className="overflow-x-auto border border-gray-200 shadow-sm rounded-sm" id="table-wrapper">
        <table className="w-full border-collapse text-left">
          
          {/* Table Gray Header */}
          <thead>
            <tr className="bg-[#c0c0c0] font-sans font-bold text-gray-900 border-b-2 border-gray-400 text-sm md:text-base">
              <th className="py-2.5 px-4 text-center border-r border-gray-300 w-16">No.</th>
              <th className="py-2.5 px-4 border-r border-gray-300">
                {activeTab === '업데이트' ? '업데이트 내용' : '제목'}
              </th>
              <th className="py-2.5 px-4 text-center border-r border-gray-300 w-24">조회수</th>
              <th className="py-2.5 px-4 text-center border-r border-gray-300 w-32">작성자</th>
              <th className="py-2.5 px-4 text-center w-28">작성일</th>
            </tr>
          </thead>

          {/* Table Body Content rows */}
          <tbody className="divide-y divide-gray-200 text-xs md:text-sm">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400 italic">
                  해당 카테고리에 일치하는 신문 기사가 존재하지 않습니다.
                </td>
              </tr>
            ) : (
              filtered.map((art, idx) => (
                <tr
                  key={art.id}
                  onClick={() => handleRowClick(art)}
                  className="hover:bg-neutral-50 cursor-pointer transition duration-150 group"
                >
                  {/* Ranked Index / No */}
                  <td className="py-3 px-4 text-center text-gray-500 font-semibold border-r border-gray-100">
                    {filtered.length - idx}
                  </td>

                  {/* Title or Update description */}
                  <td className="py-3 px-4 font-medium text-gray-900 border-r border-gray-100 max-w-lg">
                    <div className="flex items-center space-x-2">
                      {art.subCategory && (
                        <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded text-[11px] font-bold border border-orange-100">
                          {art.subCategory}
                        </span>
                      )}
                      
                      {/* Privacy / Locked Indicators */}
                      {art.isPrivate && (
                        <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[11px] font-bold border border-red-100 flex items-center gap-0.5">
                          <EyeOff size={10} />
                          비공개
                        </span>
                      )}

                      {art.password && (
                        <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[11px] font-bold border border-purple-200 inline-flex items-center gap-0.5">
                          <Lock size={10} />
                          잠금
                        </span>
                      )}

                      <span className="group-hover:text-orange-600 group-hover:underline line-clamp-1">
                        {art.title}
                      </span>

                      {art.commentsCount > 0 && (
                        <span className="text-orange-600 font-bold ml-1 text-xs">
                          [{art.commentsCount}]
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Views */}
                  <td className="py-3 px-4 text-center font-bold text-gray-700 border-r border-gray-100">
                    {art.views}
                  </td>

                  {/* Author */}
                  <td className="py-3 px-4 text-center text-gray-800 font-semibold border-r border-gray-100 max-w-[120px] truncate">
                    {art.author}
                  </td>

                  {/* Creation Date */}
                  <td className="py-3 px-4 text-center text-gray-500 text-[11px] md:text-xs">
                    {art.createdAt.split(' ')[0]}
                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>

      {/* Styled Submit / Write button matching images ('작성' on bottom right) */}
      {currentUser && (currentUser.role === 'admin' || currentUser.role === 'writer') && (
        <div className="flex justify-end mt-6">
          <button
            onClick={() => setView('write')}
            className="border-2 border-black hover:bg-orange-50 rounded-sm py-1.5 px-6 font-bold text-[15px] cursor-pointer transition flex items-center gap-1 bg-white shadow-sm"
            id="list-write-nav-btn"
          >
            <PenTool size={16} />
            작성
          </button>
        </div>
      )}

    </div>
  );
};
