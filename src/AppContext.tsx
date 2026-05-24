import React, { createContext, useContext, useState, useEffect } from 'react';
import { Article, Comment, User, Reply, Patient } from './types';
import { INITIAL_USERS, INITIAL_ARTICLES, INITIAL_COMMENTS } from './mockData';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDocs, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, cleanUndefined } from './firebase';

export const getKSTTimestamp = () => {
  try {
    // Generates format: "2026-05-24 13:40 KT"
    return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 16) + ' KT';
  } catch (err) {
    const date = new Date();
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const kst = new Date(utc + (9 * 60 * 60 * 1000));
    return kst.toISOString().slice(0, 16).replace('T', ' ') + ' KT';
  }
};

interface AppContextType {
  view: 'home' | 'login' | 'join' | 'list' | 'write' | 'detail' | 'mypage';
  setView: (view: 'home' | 'login' | 'join' | 'list' | 'write' | 'detail' | 'mypage') => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  updateUsersList: (newUsers: User[]) => void;
  updateUserProfile: (user: User) => Promise<void>;
  registerUser: (user: User) => Promise<boolean>;
  loginUser: (id: string, pw: string) => User | null;
  
  articles: Article[];
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>;
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  
  activeTab: '전체일보' | '원내소식' | '업데이트' | '단체소식';
  setActiveTab: (tab: '전체일보' | '원내소식' | '업데이트' | '단체소식') => void;
  
  selectedSidebarFilter: string | null;
  setSelectedSidebarFilter: (filter: string | null) => void;
  
  selectedArticleId: string | null;
  setSelectedArticleId: (id: string | null) => void;
  
  editingArticleId: string | null;
  setEditingArticleId: (id: string | null) => void;
  
  addArticle: (title: string, content: string, opts: {
    category: '전체일보' | '원내소식' | '업데이트' | '단체소식';
    subCategory?: '해솔' | '청송대';
    isDraft: boolean;
    isPrivate: boolean;
    isPreRelease?: boolean;
    password?: string;
    imageUrl?: string;
  }) => Promise<Article>;
  
  updateArticle: (id: string, title: string, content: string, opts: {
    category: '전체일보' | '원내소식' | '업데이트' | '단체소식';
    subCategory?: '해솔' | '청송대';
    isDraft: boolean;
    isPrivate: boolean;
    isPreRelease?: boolean;
    password?: string;
    imageUrl?: string;
  }) => Promise<void>;
  
  deleteArticle: (id: string) => Promise<void>;
  
  incrementViews: (id: string) => void;
  
  addComment: (articleId: string, content: string) => void;
  addReply: (commentId: string, content: string) => void;

  // Patient CRUD
  patients: Patient[];
  addPatient: (name: string, birthdate: string, contact: string, affiliation: '일반' | '해솔병원' | '청송대병원', notes?: string) => Promise<Patient>;
  updatePatient: (id: string, name: string, birthdate: string, contact: string, affiliation: '일반' | '해솔병원' | '청송대병원', notes?: string) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<AppContextType['view']>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  const [activeTab, setActiveTab] = useState<AppContextType['activeTab']>('전체일보');
  const [selectedSidebarFilter, setSelectedSidebarFilter] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  // Load local currentUser session on mount
  useEffect(() => {
    const cachedCurrentUser = localStorage.getItem('maplus_current_user');
    if (cachedCurrentUser) {
      setCurrentUser(JSON.parse(cachedCurrentUser));
    }
  }, []);

  // Real-time synchronization listeners for Firestore database
  useEffect(() => {
    // 1. Users real-time feed
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: User[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...doc.data() } as User);
      });
      setUsers(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // 2. Articles real-time feed
    const unsubArticles = onSnapshot(collection(db, 'articles'), (snapshot) => {
      const list: Article[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...doc.data() } as Article);
      });
      setArticles(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'articles');
    });

    // 3. Comments real-time feed
    const unsubComments = onSnapshot(collection(db, 'comments'), (snapshot) => {
      const list: Comment[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...doc.data() } as Comment);
      });
      setComments(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'comments');
    });

    // 4. Patients real-time feed
    const unsubPatients = onSnapshot(collection(db, 'patients'), (snapshot) => {
      const list: Patient[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...doc.data() } as Patient);
      });
      setPatients(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'patients');
    });

    return () => {
      unsubUsers();
      unsubArticles();
      unsubComments();
      unsubPatients();
    };
  }, []);

  // Bootstrapping: Auto-seed and MIGRATE local storage data to Firestore so no information is lost!
  useEffect(() => {
    const migrateAndSeed = async () => {
      try {
        // 1. Seed & Migrate Users
        const localUsersStr = localStorage.getItem('maplus_users');
        const localUsers: User[] = localUsersStr ? JSON.parse(localUsersStr) : [];
        const combinedUsers = [...INITIAL_USERS];
        
        for (const lu of localUsers) {
          if (!combinedUsers.some(u => u.id === lu.id)) {
            combinedUsers.push(lu);
          }
        }

        const usersSnap = await getDocs(collection(db, 'users'));
        if (usersSnap.empty) {
          for (const u of combinedUsers) {
            await setDoc(doc(db, 'users', u.id), cleanUndefined(u));
          }
        } else {
          const existingIds = new Set(usersSnap.docs.map(d => d.id));
          for (const u of combinedUsers) {
            if (!existingIds.has(u.id)) {
              await setDoc(doc(db, 'users', u.id), cleanUndefined(u));
            }
          }
        }

        // 2. Seed & Migrate Articles
        const localArticlesStr = localStorage.getItem('maplus_articles');
        const localArticles: Article[] = localArticlesStr ? JSON.parse(localArticlesStr) : [];
        if (localArticles.length > 0) {
          const articlesSnap = await getDocs(collection(db, 'articles'));
          const existingArtIds = new Set(articlesSnap.docs.map(d => d.id));
          
          for (const art of localArticles) {
            if (!existingArtIds.has(art.id)) {
              await setDoc(doc(db, 'articles', art.id), cleanUndefined(art));
            }
          }
        }

        // 3. Seed & Migrate Comments
        const localCommentsStr = localStorage.getItem('maplus_comments');
        const localComments: Comment[] = localCommentsStr ? JSON.parse(localCommentsStr) : [];
        if (localComments.length > 0) {
          const commentsSnap = await getDocs(collection(db, 'comments'));
          const existingCmtIds = new Set(commentsSnap.docs.map(d => d.id));

          for (const cmt of localComments) {
            if (!existingCmtIds.has(cmt.id)) {
              await setDoc(doc(db, 'comments', cmt.id), cleanUndefined(cmt));
            }
          }
        }

        // 4. Seed Patients if empty
        const patientsSnap = await getDocs(collection(db, 'patients'));
        if (patientsSnap.empty) {
          const mockPatients: Patient[] = [
            {
              id: 'pat-1',
              name: '김태희',
              birthdate: '1980-03-29',
              contact: '010-4444-5555',
              affiliation: '해솔병원',
              notes: '매주 목요일 오전 외래 진료 예정',
              createdAt: getKSTTimestamp()
            },
            {
              id: 'pat-2',
              name: '이순신',
              birthdate: '1975-08-15',
              contact: '010-7777-8888',
              affiliation: '청송대병원',
              notes: '정밀 영상 검사 대기중',
              createdAt: getKSTTimestamp()
            },
            {
              id: 'pat-3',
              name: '홍길동',
              birthdate: '1992-12-25',
              contact: 'hong@gmail.com',
              affiliation: '일반',
              notes: '건강검진 접수 대기',
              createdAt: getKSTTimestamp()
            }
          ];
          for (const pat of mockPatients) {
            await setDoc(doc(db, 'patients', pat.id), cleanUndefined(pat));
          }
        }
      } catch (err) {
        console.error('Failed to migrate/seed Firestore data:', err);
      }
    };
    migrateAndSeed();
  }, []);

  // Synchronize dynamic currentUser properties (such as adminRequest approvals) in real-time
  useEffect(() => {
    if (currentUser) {
      const matched = users.find(u => u.id === currentUser.id);
      if (matched && JSON.stringify(matched) !== JSON.stringify(currentUser)) {
        setCurrentUser(matched);
        localStorage.setItem('maplus_current_user', JSON.stringify(matched));
      }
    }
  }, [users, currentUser]);

  // Save changes to localStorage helper (kept for back-compatibility)
  const saveToLocal = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const updateUsersList = async (newUsers: User[]) => {
    try {
      for (const u of newUsers) {
        await setDoc(doc(db, 'users', u.id), cleanUndefined(u));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
    }
  };

  const updateUserProfile = async (updatedUser: User) => {
    try {
      await setDoc(doc(db, 'users', updatedUser.id), cleanUndefined(updatedUser));
      setCurrentUser(updatedUser);
      saveToLocal('maplus_current_user', updatedUser);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${updatedUser.id}`);
    }
  };

  const registerUser = async (user: User): Promise<boolean> => {
    try {
      const userRef = doc(db, 'users', user.id);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return false;
      }
      await setDoc(userRef, cleanUndefined(user));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
      return false;
    }
  };

  const loginUser = (id: string, pw: string): User | null => {
    const user = users.find(u => u.id === id && u.password === pw);
    if (user) {
      setCurrentUser(user);
      saveToLocal('maplus_current_user', user);
      return user;
    }
    return null;
  };

  const addArticle = async (title: string, content: string, opts: {
    category: '전체일보' | '원내소식' | '업데이트' | '단체소식';
    subCategory?: '해솔' | '청송대';
    isDraft: boolean;
    isPrivate: boolean;
    isPreRelease?: boolean;
    password?: string;
    imageUrl?: string;
  }): Promise<Article> => {
    // Deduce default display tags for filtering sidebar
    let sidebarCategory: Article['sidebarCategory'] = undefined;
    if (opts.category === '원내소식') sidebarCategory = '원내 소식';
    else if (opts.category === '업데이트') sidebarCategory = '병원 업데이트';
    else if (opts.category === '단체소식') {
      if (opts.subCategory === '해솔') sidebarCategory = '해솔병원 소식';
      else if (opts.subCategory === '청송대') sidebarCategory = '청송대병원 소식';
    }

    const artId = `art-${Date.now()}`;
    const newArticle: Article = {
      id: artId,
      title,
      content,
      category: opts.category,
      subCategory: opts.subCategory || undefined,
      sidebarCategory,
      views: 0,
      author: currentUser ? currentUser.name : '방문자',
      authorId: currentUser ? currentUser.id : 'guest',
      createdAt: getKSTTimestamp(),
      isDraft: opts.isDraft,
      isPrivate: opts.isPrivate,
      isPreRelease: opts.isPreRelease || false,
      password: opts.password || '',
      imageUrl: opts.imageUrl || '',
      commentsCount: 0
    };

    try {
      await setDoc(doc(db, 'articles', artId), cleanUndefined(newArticle));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `articles/${artId}`);
    }
    return newArticle;
  };

  const updateArticle = async (id: string, title: string, content: string, opts: {
    category: '전체일보' | '원내소식' | '업데이트' | '단체소식';
    subCategory?: '해솔' | '청송대';
    isDraft: boolean;
    isPrivate: boolean;
    isPreRelease?: boolean;
    password?: string;
    imageUrl?: string;
  }) => {
    let sidebarCategory: Article['sidebarCategory'] = undefined;
    if (opts.category === '원내소식') sidebarCategory = '원내 소식';
    else if (opts.category === '업데이트') sidebarCategory = '병원 업데이트';
    else if (opts.category === '단체소식') {
      if (opts.subCategory === '해솔') sidebarCategory = '해솔병원 소식';
      else if (opts.subCategory === '청송대') sidebarCategory = '청송대병원 소식';
    }

    try {
      const artRef = doc(db, 'articles', id);
      const updateData: any = {
        title,
        content,
        category: opts.category,
        isDraft: opts.isDraft,
        isPrivate: opts.isPrivate,
      };
      if (opts.subCategory) updateData.subCategory = opts.subCategory;
      if (sidebarCategory) updateData.sidebarCategory = sidebarCategory;
      if (opts.isPreRelease !== undefined) updateData.isPreRelease = opts.isPreRelease;
      if (opts.password !== undefined) updateData.password = opts.password;
      if (opts.imageUrl !== undefined) updateData.imageUrl = opts.imageUrl;

      await updateDoc(artRef, cleanUndefined(updateData));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `articles/${id}`);
    }
  };

  const deleteArticle = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'articles', id));
      // Clean up linked comments for database cleanliness
      const list = comments.filter(c => c.articleId === id);
      for (const comment of list) {
        await deleteDoc(doc(db, 'comments', comment.id));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `articles/${id}`);
    }
  };

  const incrementViews = async (id: string) => {
    try {
      const target = articles.find(a => a.id === id);
      if (target) {
        await updateDoc(doc(db, 'articles', id), {
          views: target.views + 1
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `articles/${id}`);
    }
  };

  const addComment = async (articleId: string, content: string) => {
    const cmtId = `cmt-${Date.now()}`;
    const newComment: Comment = {
      id: cmtId,
      articleId,
      author: currentUser ? currentUser.name : '방문자',
      authorId: currentUser ? currentUser.id : 'guest',
      content,
      createdAt: getKSTTimestamp(),
      replies: []
    };

    try {
      await setDoc(doc(db, 'comments', cmtId), cleanUndefined(newComment));

      const matchedArt = articles.find(a => a.id === articleId);
      const currentCount = matchedArt ? (matchedArt.commentsCount || 0) : 0;
      await updateDoc(doc(db, 'articles', articleId), {
        commentsCount: currentCount + 1
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `comments/${cmtId}`);
    }
  };

  const addReply = async (commentId: string, content: string) => {
    const newReply: Reply = {
      id: `rep-${Date.now()}`,
      author: currentUser ? currentUser.name : '방문자',
      authorId: currentUser ? currentUser.id : 'guest',
      content,
      createdAt: getKSTTimestamp()
    };

    try {
      const targetComment = comments.find(c => c.id === commentId);
      if (targetComment) {
        const updatedReplies = [...(targetComment.replies || []), newReply];
        await updateDoc(doc(db, 'comments', commentId), cleanUndefined({
          replies: updatedReplies
        }));

        const matchedArt = articles.find(a => a.id === targetComment.articleId);
        const currentCount = matchedArt ? (matchedArt.commentsCount || 0) : 0;
        await updateDoc(doc(db, 'articles', targetComment.articleId), {
          commentsCount: currentCount + 1
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `comments/${commentId}`);
    }
  };

  // Patients CRUD implementation
  const addPatient = async (
    name: string,
    birthdate: string,
    contact: string,
    affiliation: '일반' | '해솔병원' | '청송대병원',
    notes?: string
  ): Promise<Patient> => {
    const patId = `pat-${Date.now()}`;
    const newPatient: Patient = {
      id: patId,
      name,
      birthdate,
      contact,
      affiliation,
      notes: notes || '',
      createdAt: getKSTTimestamp()
    };

    try {
      await setDoc(doc(db, 'patients', patId), cleanUndefined(newPatient));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `patients/${patId}`);
    }
    return newPatient;
  };

  const updatePatient = async (
    id: string,
    name: string,
    birthdate: string,
    contact: string,
    affiliation: '일반' | '해솔병원' | '청송대병원',
    notes?: string
  ) => {
    try {
      const patRef = doc(db, 'patients', id);
      const updateData: Partial<Patient> = {
        name,
        birthdate,
        contact,
        affiliation,
        notes: notes || ''
      };
      await updateDoc(patRef, cleanUndefined(updateData));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `patients/${id}`);
    }
  };

  const deletePatient = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'patients', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `patients/${id}`);
    }
  };

  return (
    <AppContext.Provider
      value={{
        view,
        setView: (v) => {
          setView(v);
          // Auto-reset state helper when user navigates
          if (v !== 'write') setEditingArticleId(null);
        },
        currentUser,
        setCurrentUser: (u) => {
          setCurrentUser(u);
          if (u) saveToLocal('maplus_current_user', u);
          else localStorage.removeItem('maplus_current_user');
        },
        users,
        updateUsersList,
        updateUserProfile,
        registerUser,
        loginUser,
        articles,
        setArticles,
        comments,
        setComments,
        activeTab,
        setActiveTab,
        selectedSidebarFilter,
        setSelectedSidebarFilter,
        selectedArticleId,
        setSelectedArticleId,
        editingArticleId,
        setEditingArticleId,
        addArticle,
        updateArticle,
        deleteArticle,
        incrementViews,
        addComment,
        addReply,
        patients,
        addPatient,
        updatePatient,
        deletePatient,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
