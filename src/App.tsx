/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { LoginView } from './components/LoginView';
import { JoinView } from './components/JoinView';
import { ArticleListView } from './components/ArticleListView';
import { ArticleEditorView } from './components/ArticleEditorView';
import { ArticleDetailView } from './components/ArticleDetailView';
import { MyPageView } from './components/MyPageView';

function AppContent() {
  const { view } = useApp();

  const renderActiveView = () => {
    switch (view) {
      case 'home':
        return <Dashboard />;
      case 'login':
        return <LoginView />;
      case 'join':
        return <JoinView />;
      case 'list':
        return <ArticleListView />;
      case 'write':
        return <ArticleEditorView />;
      case 'detail':
        return <ArticleDetailView />;
      case 'mypage':
        return <MyPageView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-text select-all-default" id="main-app-layout">
      {/* Shared Header Navigation */}
      <Header />

      <div className="flex flex-col md:flex-row flex-1">
        {/* Shared sidebar representing dynamic filters, drafts or related items depends on view */}
        <Sidebar aria-label="메이플러스 사이드바" />

        {/* Dynamic primary content page panel */}
        <main className="flex-1 flex flex-col min-w-0" id="primary-view-container">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
