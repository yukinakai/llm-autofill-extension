import React from 'react';
import * as ReactDOM from 'react-dom/client';
import './index.css';
import ProfileRegistration from './components/ProfileRegistration';

const App = () => {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">LLM Autofill - プロフィール設定</h1>
      <ProfileRegistration />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
