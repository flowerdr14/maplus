import React from 'react';
import { useApp } from '../AppContext';
import { FileText, Award, Layers, Clock, Hospital, HelpCircle } from 'lucide-react';
import { Article } from '../types';

export const Sidebar: React.FC = () => {
  const {
    view,
    setView,
    articles,
    selectedArticleId,
    setSelectedArticleId,
    setEditingArticleId,
    selectedSidebarFilter,
    setSelectedSidebarFilter,
    setActiveTab,
  } = useApp();

  // 1. Sidebar items for default mode
  const defaultSidebarItems = [
    { label: '해솔병원 소식', tab: '단체소식' as const },
    { label: '청송대병원 소식', tab: '단체소식' as const },
    { label: '병원 업데이트', tab: '업데이트' as const },
    { label: '원내 소식', tab: '원내소식' as const },
    { label: 'BEST 소식', tab: '전체일보' as const },
  ];

  const handleSidebarItemClick = (label: string, tab: '전체일보' | '원내소식' | '업데이트' | '단체소식') => {
    setActiveTab(tab);
    setSelectedSidebarFilter(label);
    setView('list');
  };

  // 2. Draft List Mode (For Editor 'write' view)
  const drafts = articles.filter(art => art.isDraft);

  const handleDraftClick = (draftId: string) => {
    setEditingArticleId(draftId);
    // Explicitly make sure we are on the editor view
    setView('write');
  };

  // 3. Related Articles Mode (For Article Detail 'detail' view)
  const currentArticle = articles.find(art => art.id === selectedArticleId);
  const relatedArticles = currentArticle
    ? articles.filter(art => 
        art.id !== currentArticle.id && 
        !art.isDraft &&
        (art.category === currentArticle.category || art.sidebarCategory === currentArticle.sidebarCategory)
      ).slice(0, 5)
    : [];

  const handleRelatedClick = (artId: string) => {
    setSelectedArticleId(artId);
    setView('detail');
  };

  return (
    <aside className="w-full md:w-64 bg-white border-r-2 border-[#b0b0b0] p-4 flex flex-col justify-between min-h-[calc(100vh-70px)]" id="sidebar-container">
      <div>
        {/* Dynamic Sidebar Header & Content */}
        {view === 'write' ? (
          // Write view -> Draft List Box
          <div id="sidebar-draft-list">
            <h3 className="text-xl font-bold text-gray-900 border-b-2 border-gray-400 pb-2 mb-4">
              - 임시저장 리스트
            </h3>
            {drafts.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-2">
                임시저장된 원고가 없습니다.
              </p>
            ) : (
              <ul className="space-y-2">
                {drafts.map(draft => (
                  <li key={draft.id}>
                    <button
                      onClick={() => handleDraftClick(draft.id)}
                      className="w-full text-left p-2 hover:bg-amber-50 rounded border border-transparent hover:border-amber-200 transition duration-150 group"
                    >
                      <div className="text-sm font-semibold text-gray-800 line-clamp-1 group-hover:text-amber-700">
                        {draft.title || '(제목 없음)'}
                      </div>
                      <div className="text-xs text-amber-600 mt-0.5">
                        {draft.createdAt}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : view === 'detail' ? (
          // Detail view -> Related Articles
          <div id="sidebar-related-list">
            <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-405 pb-2 mb-4">
              - 이 기사와 관련된 기사들
            </h3>
            {relatedArticles.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-2">
                관련 기사가 없습니다.
              </p>
            ) : (
              <ul className="space-y-3">
                {relatedArticles.map(art => (
                  <li key={art.id}>
                    <button
                      onClick={() => handleRelatedClick(art.id)}
                      className="w-full text-left p-2.5 rounded border border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 transition duration-150 text-xs text-gray-850"
                    >
                      <div className="font-semibold text-gray-800 mb-1 line-clamp-2">
                        {art.title}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-500">
                        <span>{art.author}</span>
                        <span>조회수 {art.views}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          // Normal layout -> Display Category filters
          <div id="sidebar-categories-list">
            <ul className="space-y-3 mt-4 text-xl font-bold text-gray-900">
              {defaultSidebarItems.map((item) => {
                const isSelected = selectedSidebarFilter === item.label;
                return (
                  <li key={item.label}>
                    <button
                      onClick={() => handleSidebarItemClick(item.label, item.tab)}
                      className={`w-full text-left py-2 px-3 rounded-md transition duration-150 flex items-center space-x-2 ${
                        isSelected 
                          ? 'bg-neutral-100 text-orange-600 font-extrabold border-l-4 border-orange-500 pl-2' 
                          : 'hover:bg-neutral-50 text-gray-800 hover:text-black'
                      }`}
                      id={`sidebar-item-${item.label.replace(/\s+/g, '-')}`}
                    >
                      <span className="text-gray-400 font-medium">-</span>
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Persistent Developer Information Footer at Sidebar Bottom */}
      <div className="pt-6 mt-6 border-t border-gray-200 text-xs text-gray-500 font-medium leading-relaxed" id="sidebar-dev-footer">
        <p className="text-gray-700 font-semibold mb-1">제작자: 전) 활동인 양재원</p>
        <p>Tel: <a href="mailto:xheepjaeone@gmail.com" className="text-blue-500 hover:underline">xheepjaeone@gmail.com</a></p>
      </div>
    </aside>
  );
};
