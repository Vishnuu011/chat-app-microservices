import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';
import { AuthPage } from './pages/AuthPage';
import { MainLayout } from './components/layout/MainLayout';
import './index.css';

function App() {
  const { user, token } = useAuthStore();
  const isLoggedIn = !!(user && token);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#202c33',
            color: '#e9edef',
            border: '1px solid #2a3942',
            fontSize: '13px',
          },
        }}
      />
      {isLoggedIn ? <MainLayout /> : <AuthPage />}
    </>
  );
}

export default App;
