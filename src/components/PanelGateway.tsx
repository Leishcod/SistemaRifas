import React, { useState, useEffect } from 'react';
import type { SessionUser } from '../types';
import { getAuthSession } from '../utils/auth';
import { LoginForm } from './LoginForm';

export const PanelGateway: React.FC = () => {
  const [authUser, setAuthUser] = useState<SessionUser | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const session = getAuthSession();
    if (session) {
      if (session.role === 'ceiis') {
        window.location.href = '/admin';
        return;
      } else if (session.role === 'delegado') {
        window.location.href = '/delegados';
        return;
      }
    }
    setAuthUser(session);
    setIsChecking(false);
  }, []);

  if (isChecking) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 mx-auto border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 mt-3">Verificando sesión activa...</p>
      </div>
    );
  }

  return (
    <LoginForm
      targetPanel="panel"
      onLoginSuccess={(user) => {
        if (user.role === 'ceiis') {
          window.location.href = '/admin';
        } else if (user.role === 'delegado') {
          window.location.href = '/delegados';
        }
      }}
    />
  );
};
