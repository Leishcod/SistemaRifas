import React, { useState } from 'react';
import type { SessionUser } from '../types';
import { loginUser } from '../utils/auth';

interface Props {
  targetPanel?: 'admin' | 'delegados' | 'panel';
  onLoginSuccess?: (user: SessionUser) => void;
}

export const LoginForm: React.FC<Props> = ({ targetPanel = 'panel', onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await loginUser(identifier, password);
      if (res.success && res.user) {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        } else {
          // Redirección inteligente según el rol
          if (res.user.role === 'ceiis') {
            window.location.href = '/admin';
          } else if (res.user.role === 'delegado') {
            window.location.href = '/delegados';
          } else {
            setErrorMessage('Acceso denegado: No tienes permisos para ingresar a este panel.');
          }
        }
      } else {
        setErrorMessage(res.error || 'Credenciales inválidas.');
      }
    } catch {
      setErrorMessage('Ocurrió un error al procesar el ingreso. Inténtalo nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="glass-panel p-8 sm:p-10 rounded-2xl border border-cyan-500/25 relative overflow-hidden shadow-2xl">
        {/* Glow de fondo */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(0,240,255,0.35)]">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.7}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h2 className="font-heading font-black text-2xl text-white">
            {targetPanel === 'admin'
              ? 'Acceso Administrador CEIIS'
              : targetPanel === 'delegados'
                ? 'Acceso Delegados FIIS'
                : 'Acceso al Panel Oficial'}
          </h2>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fade-in">
            <svg className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="flex-1">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Código UNI
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Ej. 20244517G"
              className="w-full bg-[#030617] border border-cyan-500/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 placeholder:text-slate-600 font-mono transition-all uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#030617] border border-cyan-500/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 placeholder:text-slate-600 font-mono transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 hover:from-blue-600 hover:via-indigo-600 hover:to-cyan-600 border border-cyan-500/30 text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(0,240,255,0.25)] transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Comprobando credenciales...' : 'Acceder'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/5 text-center text-[11px] text-slate-400">
          <p>
            ¿Eres delegado o directivo y no tienes contraseña?{' '}
            <span className="text-cyan-400 block sm:inline font-medium">
              Comunícate con el CEIIS.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
