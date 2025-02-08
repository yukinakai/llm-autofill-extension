import React from 'react';

type SettingsPage = 'profile' | 'apiKey';

interface SettingsLayoutProps {
  children: React.ReactNode;
  currentPage: SettingsPage;
  onPageChange: (page: SettingsPage) => void;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children, currentPage, onPageChange }) => {
  return (
    <div className="flex h-full">
      {/* サイドメニュー */}
      <div className="w-64 bg-gray-100 p-4">
        <nav>
          <ul className="space-y-2">
            <li>
              <button
                className={`w-full text-left px-4 py-2 rounded ${
                  currentPage === 'profile'
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-200'
                }`}
                onClick={() => onPageChange('profile')}
              >
                プロフィール設定
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left px-4 py-2 rounded ${
                  currentPage === 'apiKey'
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-200'
                }`}
                onClick={() => onPageChange('apiKey')}
              >
                APIキー設定
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 p-4">
        {children}
      </div>
    </div>
  );
};

export default SettingsLayout;
