import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useAuthStore } from './store/authStore';

const Racine = () => {
  const initialiser = useAuthStore((state) => state.initialiser);

  useEffect(() => {
    initialiser();
  }, [initialiser]);

  return <App />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Racine />
  </React.StrictMode>
);
