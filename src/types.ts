export interface Article {
  id: string;
  title: string;
  content: string;
  category: '전체일보' | '원내소식' | '업데이트' | '단체소식';
  subCategory?: '해솔' | '청송대'; // For 단체소식 subcategory
  sidebarCategory?: '해솔병원 소식' | '청송대병원 소식' | '병원 업데이트' | '원내 소식' | 'BEST 소식';
  views: number;
  author: string;
  authorId: string;
  createdAt: string;
  isDraft: boolean;
  isPrivate: boolean;
  isPreRelease?: boolean;
  password?: string; // Optional password lock
  imageUrl?: string;
  commentsCount: number;
}

export interface Comment {
  id: string;
  articleId: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: string;
  replies?: Reply[];
}

export interface Reply {
  id: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  birthdate: string;
  password?: string;
  phone?: string; // Backward compatibility fallback
  contact: string; // 연락처 (전화번호 혹은 이메일)
  role: 'reader' | 'writer' | 'admin'; // 'reader' = 열람자, 'writer' = 작성자, 'admin' = 관리자
  joinPath: string;
  adminRequest?: 'pending' | 'approved' | 'rejected';
  requestedRole?: 'writer' | 'admin';
  affiliation?: '일반' | '해솔병원' | '청송대병원'; // 소속: 일반, 해솔병원, 청송대병원
}

export interface Patient {
  id: string;
  name: string;
  birthdate: string;
  contact: string; // 연락처 (전화번호 혹은 이메일)
  affiliation: '일반' | '해솔병원' | '청송대병원';
  notes?: string;
  createdAt: string;
}

