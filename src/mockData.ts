import { Article, Comment, User } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'admin',
    name: '개발자',
    birthdate: '1995-04-12',
    password: 'admin',
    phone: '010-1234-5678',
    contact: '010-1234-5678',
    role: 'admin',
    joinPath: '제작자 가입',
    affiliation: '일반',
  },
  {
    id: 'haesol_admin',
    name: '해솔 관리자',
    birthdate: '1987-11-20',
    password: '1234',
    phone: '010-9876-5432',
    contact: '010-9876-5432',
    role: 'admin',
    joinPath: '지인 소개',
    affiliation: '해솔병원',
  },
  {
    id: 'cheongsong_admin',
    name: '청송 관리자',
    birthdate: '1991-05-15',
    password: '1234',
    phone: '010-2222-3333',
    contact: '010-2222-3333',
    role: 'admin',
    joinPath: '인터넷 검색',
    affiliation: '청송대병원',
  }
];

export const INITIAL_ARTICLES: Article[] = [];

export const INITIAL_COMMENTS: Comment[] = [];
