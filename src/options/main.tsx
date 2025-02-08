import React, { useState } from 'react';
import * as ReactDOM from 'react-dom/client';
import './index.css';
import SettingsLayout from './components/SettingsLayout';
import ProfileRegistration from './components/ProfileRegistration';
import ApiKeyForm, { ApiKey } from './components/ApiKeyForm';

const App = () => {
  const [currentPage, setCurrentPage] = useState<'profile' | 'apiKey'>('profile');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <h1 className="text-2xl font-bold text-gray-900">
            LLM Autofill - 設定
          </h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4">
        <SettingsLayout currentPage={currentPage} onPageChange={setCurrentPage}>
          {currentPage === 'apiKey' && (
            <section>
              <h2 className="text-xl font-semibold mb-4">APIキー設定</h2>
              <ApiKeyForm onSubmit={(apiKey: ApiKey) => {
                console.log('APIキーが更新されました:', apiKey);
                // TODO: APIキーの保存処理を実装
              }} />
            </section>
          )}

          {currentPage === 'profile' && (
            <section>
              <h2 className="text-xl font-semibold mb-4">プロフィール設定</h2>
              <ProfileRegistration />
            </section>
          )}
        </SettingsLayout>
      </main>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
