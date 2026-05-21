import React from 'react';
import { useApp } from '../AppContext';
import { Award, BookOpen, AlertCircle, Sparkles, Mail } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { articles, setView, setSelectedArticleId, incrementViews } = useApp();

  // Filter public (non-draft) articles and sort by views desc
  const publicArticles = articles.filter(art => !art.isDraft && !art.isPrivate);
  
  // Best 10 ranking list
  const best10 = [...publicArticles]
    .sort((a, b) => b.views - a.views)
    .slice(0, 4); // Show up to 4 in grid as per images

  // Custom Articles (맞춤기사)
  const customArticles = [...publicArticles]
    .filter(art => art.category === '단체소식' || art.category === '원내소식')
    .slice(0, 2); // Show 2 custom articles as in the mockup image

  const handleArticleClick = (id: string) => {
    setSelectedArticleId(id);
    incrementViews(id);
    setView('detail');
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-gray-50 overflow-y-auto" id="dashboard-view-panel">
      
      {/* Top Welcome Title Grid */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between" id="dashboard-welcome">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="text-orange-500" size={24} />
            안녕하세요! 메이플러스 일보에 오신 것을 환영합니다.
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            원내 최신 의료 정보, 병원 소식 및 다양한 의료진 전용 칼럼과 가이드를 빠르고 간편하게 확인해보세요.
          </p>
        </div>
        <button 
          onClick={() => setView('join')}
          className="bg-orange-500 text-white font-semibold text-sm px-4 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          지금 회원가입
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* BEST 10 Section */}
        <div className="bg-white p-5 rounded-lg border-2 border-gray-300 shadow-sm" id="best-10-section">
          <div className="border-b-4 border-gray-700 pb-2 mb-4">
            <h3 className="text-2xl font-black text-gray-900 tracking-wider flex items-center gap-2">
              <Award className="text-amber-500" size={24} />
              BEST 10
            </h3>
          </div>

          {best10.length === 0 ? (
            <div className="text-gray-400 text-center py-12">작성된 일보 기사가 아직 없습니다.</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {best10.map((art, idx) => (
                <div 
                  key={art.id}
                  onClick={() => handleArticleClick(art.id)}
                  className="cursor-pointer border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:border-orange-300 transition duration-200 group flex flex-col justify-between"
                >
                  <div className="p-3 bg-gray-100/80 border-b border-gray-100 flex justify-between items-center">
                    <span className="text-lg font-extrabold text-orange-600 text-[18px]">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] bg-white text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                      Views: {art.views}
                    </span>
                  </div>

                  {art.imageUrl ? (
                    <div className="w-full h-32 overflow-hidden relative bg-gray-200">
                      <img 
                        src={art.imageUrl} 
                        alt="Article Cover" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-orange-50/50 flex items-center justify-center text-xs text-gray-400 font-bold">
                      이미지
                    </div>
                  )}

                  <div className="p-3 bg-white flex-1 flex flex-col justify-between">
                    <h4 className="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-orange-600">
                      {art.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {art.content}
                    </p>
                    <div className="mt-2 text-[10px] text-gray-400 flex justify-between">
                      <span>{art.author}</span>
                      <span>{art.createdAt.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right side containers: 맞춤기사 & 관리자 생성방법 */}
        <div className="space-y-6">
          
          {/* 맞춤기사 Section */}
          <div className="bg-white p-5 rounded-lg border-2 border-gray-300 shadow-sm" id="custom-articles-section">
            <div className="border-b-4 border-gray-700 pb-2 mb-4">
              <h3 className="text-2xl font-black text-gray-900 tracking-wider flex items-center gap-2">
                <BookOpen className="text-orange-500" size={24} />
                맞춤기사
              </h3>
            </div>

            {customArticles.length === 0 ? (
              <div className="text-gray-400 text-center py-6">맞춤형으로 제공해드릴 소식이 없습니다.</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {customArticles.map((art, idx) => (
                  <div 
                    key={art.id}
                    onClick={() => handleArticleClick(art.id)}
                    className="cursor-pointer border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:border-orange-300 transition duration-200 group flex flex-col justify-between"
                  >
                    <div className="p-3 bg-gray-105 border-b border-gray-200 flex justify-between items-center font-bold text-gray-700 text-sm">
                      <span>추천 {idx + 1}</span>
                      <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                        {art.subCategory || '원내'}
                      </span>
                    </div>

                    {art.imageUrl ? (
                      <div className="w-full h-24 overflow-hidden relative bg-gray-250">
                        <img 
                          src={art.imageUrl} 
                          alt="Custom Post Cover"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                        />
                      </div>
                    ) : (
                      <div className="w-full h-24 bg-gray-100 flex items-center justify-center text-xs text-gray-400 font-bold">
                        이미지
                      </div>
                    )}

                    <div className="p-3 bg-white">
                      <h4 className="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-orange-600">
                        {art.title}
                      </h4>
                      <div className="mt-2 text-[10px] text-gray-400 flex justify-between">
                        <span>{art.author}</span>
                        <span>{art.createdAt.split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 관리자(작성) 계정 생성방법 Box */}
          <div className="bg-white p-5 rounded-lg border-2 border-gray-300 shadow-sm" id="admin-account-instruction-box">
            <div className="border-b-4 border-gray-751 pb-2 mb-4">
              <h3 className="text-2xl font-black text-gray-800 tracking-wider flex items-center gap-2">
                <AlertCircle className="text-slate-500" size={24} />
                관리자 (작성) 계정 생성방법
              </h3>
            </div>

            <div className="text-gray-800 space-y-4 font-sans text-[15px] leading-relaxed">
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  <span className="font-bold">제작자 이메일로 제안 넣기</span>
                  <div className="text-sm text-gray-500 ml-5 bg-gray-100 p-2 rounded mt-1 border border-gray-200">
                    - 제안 양식: 성명 / 소속 부서 / 생성 희망 ID / 연락처 / 작성 구분 (해솔/청송대)
                  </div>
                </li>
                <li>
                  <span className="font-bold">검토 후 제안 넣은 이메일로 소식 통보</span>
                </li>
                <li>
                  <span className="font-bold">통보된 아이디, 비밀번호로 로그인</span>
                </li>
              </ol>

              <div className="mt-4 bg-orange-50 border-l-4 border-orange-400 p-3 text-sm text-orange-850 rounded">
                <strong className="block text-orange-853 font-bold mb-1">※ 주의사항 ※</strong>
                검토에는 3~4일이 걸릴 수 있으며 승인 시 일보 작성 자격이 정상적으로 주어집니다.
              </div>

              <div className="text-xs text-gray-400 flex items-center gap-1 mt-2">
                <Mail size={13} />
                제작자 메일: xheepjaeone@gmail.com
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
