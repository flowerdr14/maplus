import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  ArrowLeft, Calendar, User, Eye, MessageSquare, Send, Reply as ReplyIcon, 
  Trash, ShieldAlert, Sparkles, AlertCircle 
} from 'lucide-react';

interface TextToken {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

function parseTextToTokens(input: string): TextToken[] {
  let tokens: TextToken[] = [{ text: input, bold: false, italic: false, underline: false }];

  // 1. Process Underline: __under__
  tokens = tokens.flatMap(token => {
    if (token.underline) return [token];
    const parts = token.text.split(/__(.*?)__/g);
    return parts.map((part, index) => ({
      text: part,
      bold: token.bold,
      italic: token.italic,
      underline: token.underline || (index % 2 === 1)
    }));
  });

  // 2. Process Bold: **bold**
  tokens = tokens.flatMap(token => {
    if (token.bold) return [token];
    const parts = token.text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) => ({
      text: part,
      bold: token.bold || (index % 2 === 1),
      italic: token.italic,
      underline: token.underline
    }));
  });

  // 3. Process Italic: *italic*
  tokens = tokens.flatMap(token => {
    if (token.italic) return [token];
    const parts = token.text.split(/\*(.*?)\*/g);
    return parts.map((part, index) => ({
      text: part,
      bold: token.bold,
      italic: token.italic || (index % 2 === 1),
      underline: token.underline
    }));
  });

  return tokens.filter(tok => tok.text !== '');
}

const renderFormattedContent = (content: string) => {
  if (!content) return null;
  const lines = content.split('\n');
  return lines.map((line, idx) => {
    let isHeading1 = false;
    let isHeading2 = false;
    let isQuote = false;
    let text = line;

    if (line.startsWith('# ')) {
      isHeading1 = true;
      text = line.substring(2);
    } else if (line.startsWith('## ')) {
      isHeading2 = true;
      text = line.substring(3);
    } else if (line.startsWith('> ')) {
      isQuote = true;
      text = line.substring(2);
    }

    const tokens = parseTextToTokens(text);
    const inlineElements = tokens.map((tok, tIdx) => {
      let classes = "";
      if (tok.bold) classes += " font-extrabold text-black";
      if (tok.italic) classes += " italic text-gray-900";
      if (tok.underline) classes += " underline decoration-orange-500 underline-offset-4 decoration-2";
      
      if (classes) {
        return (
          <span key={tIdx} className={classes}>
            {tok.text}
          </span>
        );
      }
      return tok.text;
    });

    if (isHeading1) {
      return (
        <h1 key={idx} className="text-2xl font-black text-gray-900 mt-6 mb-3 border-b border-gray-250 pb-1">
          {inlineElements}
        </h1>
      );
    }
    if (isHeading2) {
      return (
        <h2 key={idx} className="text-xl font-extrabold text-gray-900 mt-5 mb-2">
          {inlineElements}
        </h2>
      );
    }
    if (isQuote) {
      return (
        <blockquote key={idx} className="border-l-4 border-orange-500 pl-4 py-2 italic bg-orange-50/50 my-3 text-gray-800 rounded-r-md">
          {inlineElements}
        </blockquote>
      );
    }

    return (
      <div key={idx} className="min-h-[1.5rem] leading-relaxed my-1">
        {inlineElements}
      </div>
    );
  });
};

export const ArticleDetailView: React.FC = () => {
  const {
    view,
    setView,
    selectedArticleId,
    setSelectedArticleId,
    articles,
    comments,
    setComments,
    addComment,
    addReply,
    currentUser,
    deleteArticle,
    setEditingArticleId
  } = useApp();

  const article = articles.find(art => art.id === selectedArticleId);
  const articleComments = comments.filter(cmt => cmt.articleId === selectedArticleId);

  // States
  const [newCommentText, setNewCommentText] = useState('');
  
  // Track which comment ID the reader is replying to
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  if (!article) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center bg-gray-50">
        <AlertCircle size={48} className="text-gray-400 mb-2" />
        <p className="text-gray-600 font-bold">기사를 찾을 수 없거나 이미 삭제되었습니다.</p>
        <button
          onClick={() => setView('list')}
          className="mt-4 px-4 py-2 bg-black text-white rounded text-sm font-bold"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const handleBack = () => {
    setView('list');
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    addComment(article.id, newCommentText.trim());
    setNewCommentText('');
  };

  const handleReplySubmit = (commentId: string) => {
    if (!replyText.trim()) return;
    addReply(commentId, replyText.trim());
    setReplyText('');
    setActiveReplyCommentId(null);
  };

  const handleArticleDelete = async () => {
    if (confirm('이 신문 기사를 완전히 삭제하시겠습니까?')) {
      const artId = article.id;
      setSelectedArticleId(null);
      setView('list');
      await deleteArticle(artId);
    }
  };

  const handleCommentDelete = async (cmtId: string, articleId: string) => {
    if (confirm('이 댓글을 정말 삭제하시겠습니까?')) {
      try {
        // Optimistically update comments UI instantly
        setComments(prev => prev.filter(c => c.id !== cmtId));
        await deleteDoc(doc(db, 'comments', cmtId));
        const matchedArt = articles.find(a => a.id === articleId);
        if (matchedArt) {
          const currentCount = matchedArt.commentsCount || 0;
          await updateDoc(doc(db, 'articles', articleId), {
            commentsCount: currentCount > 0 ? currentCount - 1 : 0
          });
        }
      } catch (err) {
        console.error('Failed to delete comment:', err);
      }
    }
  };

  return (
    <div className="flex-1 p-6 bg-white overflow-y-auto" id="article-detail-panel">
      
      {/* Return/Action bar */}
      <div className="md:flex items-center justify-between border-b pb-3 mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 font-bold text-gray-700 hover:text-orange-600 transition text-sm mb-2 md:mb-0 cursor-pointer"
          id="detail-back-btn"
        >
          <ArrowLeft size={16} />
          <span>기사 목록으로</span>
        </button>

        {/* Edit / Delete actions for Author or Admin */}
        {currentUser && (currentUser.id === article.authorId || currentUser.role === 'admin') && (
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setEditingArticleId(article.id);
                setView('write');
              }}
              className="text-xs font-bold text-blue-600 border border-blue-300 hover:bg-blue-50 py-1.5 px-3 rounded-md transition"
              id="detail-edit-btn"
            >
              기사 수정
            </button>
            <button
              onClick={handleArticleDelete}
              className="text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 py-1.5 px-3 rounded-md transition"
              id="detail-delete-btn"
            >
              기사 삭제
            </button>
          </div>
        )}
      </div>

      {/* Main Core Article View */}
      <article className="space-y-6" id="core-article-body">
        
        {/* Title, Category Header */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-extrabold bg-orange-100/80 text-orange-600 px-2.5 py-1 rounded border border-orange-200">
              {article.category} {article.subCategory ? `| ${article.subCategory}병원` : ''}
            </span>
            {article.isPrivate && (
              <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[11px] font-bold border border-red-200">비공개</span>
            )}
            {article.password && (
              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[11px] font-bold border border-purple-200">임시 잠금중</span>
            )}
          </div>
          
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-950 tracking-tight leading-tight">
            {article.title}
          </h1>

          {/* Subtitle - exactly matching: "작성자명 | YYYY-MM-DD HH:MM" */}
          <div className="text-sm font-semibold text-gray-500 py-1 border-y border-gray-100 flex flex-wrap justify-between items-center bg-gray-50/50 px-2 rounded">
            <div>
              <span>작성자: <strong className="text-gray-800 font-extrabold">{article.author}</strong></span>
              <span className="mx-2 text-gray-300">|</span>
              <span>{article.createdAt}</span>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1 mt-1 sm:mt-0">
              <Eye size={12} />
              <span>조회 수 {article.views}회</span>
            </div>
          </div>
        </div>

        {/* Content Paragraphs container */}
        <div className="text-base text-gray-800 leading-relaxed font-sans font-medium py-4 min-h-[150px]" id="formatted-article-content-wrapper">
          {renderFormattedContent(article.content)}
        </div>

        {/* Image display as required by Image 12: "이미지 (이미지 첨부 시)" */}
        {article.imageUrl ? (
          <div className="border border-dashed border-gray-300 rounded p-4 bg-gray-50/50 flex flex-col items-center">
            <div className="max-w-2xl w-full border-2 border-black rounded-sm overflow-hidden bg-white shadow-sm">
              <img
                src={article.imageUrl}
                alt="Article attached graphic"
                referrerPolicy="no-referrer"
                className="w-full h-auto object-contain max-h-[450px]"
              />
              <div className="bg-gray-100 p-2 text-center text-xs font-bold text-gray-500 border-t border-black select-none">
                이미지 (이미지 첨부 시)
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-gray-300 p-8 rounded bg-gray-50 text-center select-none text-xs text-gray-400 font-bold">
            선택된 첨부 이미지가 본 기사에 포함되어 있지 않습니다.
          </div>
        )}

      </article>

      {/* COMMENTS CONTAINER (Matches layout in Image 13 precisely) */}
      <section className="mt-12 space-y-6" id="comments-section-container">
        
        {/* Comment Count Header */}
        <h3 className="text-xl font-extrabold text-gray-900 border-b-2 border-black pb-2 flex items-center gap-2">
          <MessageSquare className="text-orange-500" size={20} />
          댓글 ({articleComments.length})
        </h3>

        {/* Comments Box Wrapping Block */}
        <div className="bg-gray-100 p-4 rounded-sm border border-gray-300 space-y-4" id="comments-background-frame">
          
          {articleComments.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center italic">
              첫 댓글을 장식해 보세요! 따뜻한 관심이 더 유용해집니다.
            </p>
          ) : (
            <div className="space-y-4">
              {articleComments.map(cmt => {
                const isCmtAuthor = currentUser && (cmt.authorId === currentUser.id || currentUser.role === 'admin');
                return (
                  <div key={cmt.id} className="border border-gray-200 bg-white p-3 rounded-sm shadow-xs space-y-2">
                    
                    {/* Comment SubHeader */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-extrabold text-gray-800">
                        {cmt.author} ({cmt.authorId})
                      </span>
                      {isCmtAuthor && (
                        <button
                          onClick={() => handleCommentDelete(cmt.id, article.id)}
                          className="hover:text-red-500 text-gray-400 cursor-pointer"
                        >
                          <Trash size={12} />
                        </button>
                      )}
                    </div>

                    {/* Comment Content body */}
                    <p className="text-sm text-gray-700 leading-relaxed font-sans font-medium">
                      {cmt.content}
                    </p>

                    {/* Footer bar exactly: YYYY-MM-DD | HH:MM and "답글" button */}
                    <div className="text-xs text-gray-400 flex items-center gap-3">
                      <span>{cmt.createdAt}</span>
                      <span>|</span>
                      <button
                        onClick={() => {
                          setActiveReplyCommentId(activeReplyCommentId === cmt.id ? null : cmt.id);
                        }}
                        className="text-orange-600 hover:underline font-bold flex items-center gap-1"
                      >
                        <ReplyIcon size={11} />
                        답글
                      </button>
                    </div>

                    {/* NESTED REPLIES */}
                    {cmt.replies && cmt.replies.length > 0 && (
                      <div className="mt-3 pl-6 border-l-2 border-orange-200 space-y-3 bg-orange-50/20 p-2 rounded">
                        {cmt.replies.map(rep => (
                          <div key={rep.id} className="text-xs space-y-1">
                            <div className="font-extrabold text-gray-800">
                              ↳ {rep.author} ({rep.authorId})
                            </div>
                            <p className="text-gray-700 font-medium pl-3">{rep.content}</p>
                            <div className="text-gray-400 pl-3">{rep.createdAt}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* REPLY INPUT COMPONENT INLINE */}
                    {activeReplyCommentId === cmt.id && (
                      <div className="mt-3 pl-6 border-l-2 border-orange-500">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="답글을 남겨보세요..."
                            className="flex-1 border-2 border-orange-300 rounded-sm px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                          <button
                            onClick={() => handleReplySubmit(cmt.id)}
                            className="bg-orange-500 text-white font-bold p-1.5 rounded-sm hover:bg-orange-600"
                          >
                            등록
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

          {/* Comment Write Box (Matches Image 13 text field) */}
          <form onSubmit={handleCommentSubmit} className="mt-4">
            <div className="relative flex items-center border-2 border-black rounded-sm bg-white overflow-hidden">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="댓글을 작성하세요."
                className="flex-1 px-4 py-2.5 text-sm font-medium focus:outline-none text-gray-900"
                id="comment-input-field"
              />
              <button
                type="submit"
                className="px-4 text-gray-800 hover:text-orange-600 cursor-pointer p-2 rounded-sm transition flex items-center justify-center bg-gray-100 hover:bg-orange-50"
                id="comment-submit-arrow-btn"
                title="댓글 전송"
              >
                <Send size={18} className="transform rotate-[-15deg]" />
              </button>
            </div>
          </form>

        </div>

      </section>

    </div>
  );
};
