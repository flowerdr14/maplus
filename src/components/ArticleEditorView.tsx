import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../AppContext';
import { 
  Lock, EyeOff, Save, CheckCircle, Trash, Image as ImageIcon, 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, 
  Type, Link as LinkIcon, Sparkles, FolderOpen
} from 'lucide-react';

export const ArticleEditorView: React.FC = () => {
  const {
    setView,
    activeTab,
    addArticle,
    updateArticle,
    deleteArticle,
    articles,
    editingArticleId,
    setEditingArticleId,
    setSelectedArticleId,
  } = useApp();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'전체일보' | '원내소식' | '업데이트' | '단체소식'>('원내소식');
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState('');
  
  // Custom hospital subcategory for 단체소식 tab (Image 11)
  const [subCategory, setSubCategory] = useState<'해솔' | '청송대'>('해솔');
  
  // Custom state for adding base64 images
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Load existing article details if we are in edit/draft mode
  useEffect(() => {
    if (editingArticleId) {
      const art = articles.find(a => a.id === editingArticleId);
      if (art) {
        setTitle(art.title);
        setContent(art.content);
        setImageUrl(art.imageUrl || '');
        setCategory(art.category);
        if (art.password) {
          setIsLocked(true);
          setPassword(art.password);
        } else {
          setIsLocked(false);
          setPassword('');
        }
        if (art.subCategory) {
          setSubCategory(art.subCategory);
        }
      }
    } else {
      // Clear all fields for new post
      setTitle('');
      setContent('');
      setImageUrl('');
      setIsLocked(false);
      setPassword('');
      setSubCategory('해솔');
      // Set default category based on activeTab
      if (activeTab === '전체일보') {
        setCategory('원내소식');
      } else {
        setCategory(activeTab);
      }
    }
  }, [editingArticleId, articles, activeTab]);

  const triggerAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => {
      setAlertMsg({ type: '', text: '' });
    }, 2500);
  };

  // Base64 file upload reader
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        triggerAlert('success', '이미지가 원고에 성공적으로 동봉되었습니다!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAction = async (mode: 'draft' | 'private' | 'prerelease' | 'publish') => {
    if (!title.trim()) {
      triggerAlert('error', '제목을 기입해주시기 바랍니다.');
      return;
    }

    const opts = {
      category: category,
      subCategory: category === '단체소식' ? subCategory : undefined,
      isDraft: mode === 'draft',
      isPrivate: mode === 'private',
      isPreRelease: mode === 'prerelease',
      password: isLocked ? password : '',
      imageUrl: imageUrl,
    };

    if (editingArticleId) {
      await updateArticle(editingArticleId, title, content, opts);
      triggerAlert('success', `성공적으로 업데이트되었습니다! (${mode})`);
    } else {
      const newArt = await addArticle(title, content, opts);
      // If we saved as draft, set editing id so we can keep updating
      if (mode === 'draft') {
        setEditingArticleId(newArt.id);
      }
    }

    if (mode !== 'draft') {
      setTimeout(() => {
        setView('list');
      }, 1000);
    }
  };

  // Helper formatting for editor content (Simulates real WYSIWYG adding markdown or text structures)
  const applyFormatting = (format: string) => {
    if (format === 'bold') setContent(prev => prev + ' **굵은글씨**');
    else if (format === 'italic') setContent(prev => prev + ' *기울임*');
    else if (format === 'underline') setContent(prev => prev + ' __밑줄__');
    else if (format === 'h1') setContent(prev => prev + '\n# 제목 1');
    else if (format === 'h2') setContent(prev => prev + '\n## 제목 2');
    else if (format === 'quote') setContent(prev => prev + '\n> 인용구 문맥');
  };

  const handleDelete = async () => {
    if (editingArticleId) {
      if (confirm('정말로 이 기사 혹은 초안을 삭제하시겠습니까?')) {
        const idToDelete = editingArticleId;
        try {
          await deleteArticle(idToDelete);
          setSelectedArticleId(null);
          setEditingArticleId(null);
          setView('list');
        } catch (err) {
          alert("기사를 삭제하는 중 오류가 발생했습니다.");
        }
      }
    } else {
      // Clear fields for new
      setTitle('');
      setContent('');
      setImageUrl('');
      setIsLocked(false);
      setPassword('');
    }
  };

  return (
    <div className="flex-1 p-6 bg-white overflow-y-auto" id="article-editor-panel">
      {/* Dynamic alerts */}
      {alertMsg.text && (
        <div className={`mb-4 px-4 py-3 rounded text-sm font-bold flex items-center gap-2 shadow-sm ${
          alertMsg.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 'bg-red-100 text-red-800 border-l-4 border-red-500'
        }`} id="editor-alert">
          <CheckCircle size={16} />
          <span>{alertMsg.text}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Main Composition Panel */}
        <div className="flex-1 space-y-4">
          
          {/* Active Category Selector Buttons */}
          <div className="border border-black bg-orange-50/50 p-4 rounded-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-gray-900 select-none">
                발제 일보 분류 선택 {editingArticleId ? '-(수정 편집 중)' : '-(신규 원고 작성)'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingArticleId(null);
                  setTitle('');
                  setContent('');
                  setImageUrl('');
                  setIsLocked(false);
                  setPassword('');
                }}
                className="text-xs font-black text-gray-600 hover:text-black py-1 px-2 border-2 border-black rounded-sm bg-white hover:bg-gray-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
              >
                신규 글로 새작성 전환
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['전체일보', '원내소식', '업데이트', '단체소식'] as const).map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 rounded-sm border-2 font-black text-xs text-center transition-all ${
                      isSelected
                        ? 'border-black bg-orange-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'border-gray-300 bg-white hover:border-black text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subcategory selection (Hospital choice): Only visible if 단체소식 tab is chosen */}
          {category === '단체소식' && (
            <div className="bg-gray-50 p-3 rounded border border-gray-200 flex items-center space-x-6">
              <span className="text-sm font-bold text-gray-800">소속 병원 선택:</span>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-1.5 cursor-pointer selection:bg-transparent">
                  <input
                    type="radio"
                    name="hospitalSub"
                    value="해솔"
                    checked={subCategory === '해솔'}
                    onChange={() => setSubCategory('해솔')}
                    className="w-4 h-4 accent-orange-500"
                  />
                  <span className="text-gray-900 font-bold text-sm">해솔병원</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer selection:bg-transparent">
                  <input
                    type="radio"
                    name="hospitalSub"
                    value="청송대"
                    checked={subCategory === '청송대'}
                    onChange={() => setSubCategory('청송대')}
                    className="w-4 h-4 accent-orange-500"
                  />
                  <span className="text-gray-900 font-bold text-sm">청송대병원</span>
                </label>
              </div>
            </div>
          )}

          {/* Title Composition Wrapper (Matches Image 6 Title block with text length meter) */}
          <div className="flex items-center space-x-4">
            <span className="text-xl font-bold text-gray-900 w-16 select-none">제목</span>
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 기입하십시오"
                maxLength={100}
                className="w-full border-2 border-black rounded-sm px-4 py-2 font-bold text-lg focus:outline-none focus:ring-1 focus:ring-orange-500 pr-24 text-gray-900"
                id="editor-title-input"
              />
              <span className="absolute right-4 text-sm font-bold text-gray-400 select-none bg-white px-2">
                {title.length}/100 type
              </span>
            </div>
          </div>

          {/* WYSIWYG Mockup Toolbar (Matches Image 6 styling) */}
          <div className="border border-gray-300 rounded overflow-hidden shadow-sm bg-white">
            <div className="bg-gray-100 hover:bg-gray-50 border-b border-gray-300 px-3 py-2 flex flex-wrap gap-2 items-center text-gray-700 select-none">
              
              {/* Font style dropdown helper */}
              <select className="border border-gray-300 bg-white text-xs px-2 py-1 rounded font-medium focus:outline-none">
                <option>sans-serif</option>
                <option>monospace</option>
                <option>serif</option>
              </select>

              <span className="text-gray-300">|</span>

              {/* Basic stylings */}
              <button onClick={() => applyFormatting('bold')} title="Bold" className="p-1 hover:bg-gray-200 rounded">
                <Bold size={16} />
              </button>
              <button onClick={() => applyFormatting('italic')} title="Italic" className="p-1 hover:bg-gray-200 rounded animate-none">
                <Italic size={16} />
              </button>
              <button onClick={() => applyFormatting('underline')} title="Underline" className="p-1 hover:bg-gray-200 rounded">
                <Underline size={16} />
              </button>

              <span className="text-gray-300">|</span>

              {/* FontSize */}
              <select 
                onChange={(e) => applyFormatting(e.target.value)}
                className="border border-gray-300 bg-white text-xs px-2 py-1 rounded font-medium focus:outline-none"
              >
                <option value="h1">제목 1</option>
                <option value="h2">제목 2</option>
                <option value="quote">인용구</option>
              </select>

              <span className="text-gray-300">|</span>

              <button onClick={() => applyFormatting('bold')} className="p-1 hover:bg-gray-200 rounded">
                <AlignLeft size={16} />
              </button>
              <button onClick={() => applyFormatting('bold')} className="p-1 hover:bg-gray-200 rounded">
                <AlignCenter size={16} />
              </button>
              <button onClick={() => applyFormatting('bold')} className="p-1 hover:bg-gray-200 rounded">
                <AlignRight size={16} />
              </button>

              <span className="text-gray-300">|</span>

              {/* Image attachment file input trigger */}
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="이미지 첨부" 
                className="p-1 text-orange-600 hover:text-orange-850 hover:bg-orange-50 rounded flex items-center gap-1 font-bold text-xs"
              >
                <ImageIcon size={16} />
                <span>이미지 첨부</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* Content Textarea */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="본문 내용을 기입하세요..."
              className="w-full h-96 p-4 focus:outline-none text-base leading-relaxed resize-y font-medium text-gray-850"
              id="editor-body-textarea"
            />
          </div>

          {/* Attached Image Preview container */}
          {imageUrl && (
            <div className="border border-dashed border-gray-300 rounded p-3 bg-neutral-50 relative group">
              <div className="absolute right-3 top-3 opacity-80 hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="bg-red-500 text-white p-1 rounded-full shadow-sm text-xs hover:bg-red-600"
                >
                  <Trash size={14} />
                </button>
              </div>
              <p className="text-xs text-gray-400 font-bold mb-1.5 flex items-center gap-1">
                <ImageIcon size={12} />
                첨부된 이미지 미리보기
              </p>
              <img
                src={imageUrl}
                alt="Uploaded media"
                referrerPolicy="no-referrer"
                className="max-h-48 object-contain rounded border border-gray-200 bg-white"
              />
            </div>
          )}

        </div>

        {/* Right Actions Pane (Styled exactly with mockup colorful actions) */}
        <div className="w-full lg:w-60 shrink-0 space-y-4" id="editor-actions-pane">
          <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm space-y-3">
            <h4 className="text-sm font-black text-gray-900 border-b border-gray-200 pb-1.5 mb-2 select-none">
              기 사 설 정
            </h4>

            {/* 1. 잠금 활성 (Purple button and input) */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setIsLocked(!isLocked)}
                className={`w-full py-2.5 px-4 font-black rounded-sm border-2 border-black transition flex items-center justify-center gap-1.5 ${
                  isLocked ? 'bg-purple-600 text-white shadow-inner' : 'bg-purple-200 hover:bg-purple-300 text-purple-955'
                }`}
              >
                <Lock size={15} />
                잠금 {isLocked ? '해제' : '활성'}
              </button>
              {isLocked && (
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="잠금 비번을 입력하세요."
                  className="w-full border-2 border-black px-2 py-1 text-center font-bold text-xs rounded-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              )}
            </div>

            {/* 2. 비공개 (Red Button) */}
            <button
              type="button"
              onClick={() => handleSaveAction('private')}
              className="w-full py-2.5 px-4 bg-[#ff4d4d] hover:bg-[#ff1a1a] text-white font-extrabold rounded-sm border-2 border-black shadow transition flex items-center justify-center gap-2"
            >
              <EyeOff size={15} />
              비공개 보관
            </button>

            {/* 3. 선공개 (Light Blue Button) */}
            <button
              type="button"
              onClick={() => handleSaveAction('prerelease')}
              className="w-full py-2.5 px-4 bg-[#99ccff] hover:bg-[#66b3ff] text-black font-extrabold rounded-sm border-2 border-black shadow transition flex items-center justify-center gap-2"
            >
              <Sparkles size={15} className="text-blue-900" />
              선공개 발행
            </button>

            {/* 4. 임시저장 (Yellow Button) */}
            <button
              type="button"
              onClick={() => handleSaveAction('draft')}
              className="w-full py-2.5 px-4 bg-[#ffff00] hover:bg-[#e6e600] text-black font-extrabold rounded-sm border-2 border-black shadow transition flex items-center justify-center gap-2"
            >
              <Save size={15} />
              임시저장
            </button>

            {/* 5. 작성/게시 (Green Button) */}
            <button
              type="button"
              onClick={() => handleSaveAction('publish')}
              className="w-full py-3 px-4 bg-[#70db70] hover:bg-[#47d147] text-black font-black rounded-sm border-2 border-black shadow transition flex items-center justify-center gap-2 text-base"
            >
              <CheckCircle size={17} />
              일보 작성완료
            </button>

            {/* Delete button (only visible if we are editing existing item) */}
            {editingArticleId && (
              <button
                type="button"
                onClick={handleDelete}
                className="w-full py-2 px-4 bg-gray-100 hover:bg-red-50 text-red-600 font-extrabold rounded-sm border border-red-300 text-xs transition mt-4"
              >
                삭제하기
              </button>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
};
