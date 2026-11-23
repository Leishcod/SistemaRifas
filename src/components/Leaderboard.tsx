import React, { useState, useEffect } from 'react';
import type { PromoStats } from '../types';
import { getPromoStats, computePromoStats, fetchSalesFromSupabase } from '../utils/storage';
import { TARGET_PER_PROMO, TOTAL_EXPECTED_TICKETS } from '../data/students';

export const Leaderboard: React.FC = () => {
  const [stats, setStats] = useState<PromoStats[]>([]);
  const [selectedPromoFilter, setSelectedPromoFilter] = useState<string>('all');

  useEffect(() => {
    loadStats();
    // Cargar ventas de Supabase
    fetchSalesFromSupabase().then((sales) => {
      const liveStats = computePromoStats(sales);
      liveStats.sort((a, b) => b.soldTickets - a.soldTickets);
      setStats(liveStats);
    });

    // Refresh continuo cada 5s para sincronizar en tiempo real
    const interval = setInterval(() => {
      fetchSalesFromSupabase().then((sales) => {
        const liveStats = computePromoStats(sales);
        liveStats.sort((a, b) => b.soldTickets - a.soldTickets);
        setStats(liveStats);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = () => {
    const data = getPromoStats();
    // Sort descending by soldTickets
    data.sort((a, b) => b.soldTickets - a.soldTickets);
    setStats(data);
  };

  const filteredStats = selectedPromoFilter === 'all'
    ? stats
    : stats.filter((s) => s.promoCode === selectedPromoFilter);

  const totalSoldAll = stats.reduce((acc, s) => acc + s.soldTickets, 0);
  const totalAmountAll = stats.reduce((acc, s) => acc + s.totalAmount, 0);
  const globalProgress = Math.round((totalSoldAll / TOTAL_EXPECTED_TICKETS) * 100);

  return (
    <div className="w-full space-y-6">
      {/* Global Progress Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyan-500/25 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
              Ranking General de Ventas
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Códigos y CEIIS participando en la recaudación. Meta referencial: 150 rifas por código.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 sm:gap-6 bg-[#030617]/70 p-3 sm:p-4 rounded-xl border border-white/5 w-fit">
            <div>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">Total Rifas</span>
              <div className="text-lg sm:text-2xl font-heading font-black text-white whitespace-nowrap">
                {totalSoldAll} <span className="text-[10px] sm:text-xs font-normal text-slate-400">/ ~{TOTAL_EXPECTED_TICKETS}</span>
              </div>
            </div>
            <div className="w-px h-8 sm:h-10 bg-white/10"></div>
            <div>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">Recaudado</span>
              <div className="text-lg sm:text-2xl font-heading font-black text-cyan-400 whitespace-nowrap">
                S/. {totalAmountAll.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-xs text-slate-300 font-semibold">
            <span>Avance general de la Facultad ({globalProgress}%)</span>
            <span className="font-mono text-cyan-300">{totalSoldAll} vendidas de ~{TOTAL_EXPECTED_TICKETS}</span>
          </div>
          <div className="w-full h-3 rounded-full bg-[#030617] p-0.5 border border-cyan-500/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 transition-all duration-700 shadow-[0_0_12px_rgba(0,240,255,0.4)]"
              style={{ width: `${Math.min(100, Math.max(3, globalProgress))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#030617] border border-cyan-500/20 text-xs">
          <button
            onClick={() => setSelectedPromoFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${selectedPromoFilter === 'all'
              ? 'bg-cyan-500 text-[#000c18] shadow-[0_0_10px_rgba(0,240,255,0.4)]'
              : 'text-slate-300 hover:text-white'
              }`}
          >
            Todos ({stats.length})
          </button>
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStats.map((item, index) => {
          const isCeiis = item.promoCode === 'CEIIS';
          // Para códigos regulares, el % puede superar 100% si sobrepasan la meta referencial de 150
          const percent = Math.round((item.soldTickets / item.targetTickets) * 100);

          return (
            <div
              key={item.promoCode}
              className={`glass-panel rounded-2xl p-5 border transition-all relative overflow-hidden group ${index === 0 && selectedPromoFilter === 'all'
                ? 'border-yellow-400/40 bg-gradient-to-b from-yellow-950/20 to-[#080f26]'
                : 'border-cyan-500/20 hover:border-cyan-400/40'
                }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-heading font-black text-lg ${index === 0
                    ? 'bg-gradient-to-tr from-yellow-500 to-amber-300 text-[#060621] shadow-[0_0_15px_rgba(250,204,21,0.4)]'
                    : index === 1
                      ? 'bg-gradient-to-tr from-slate-300 to-slate-100 text-[#060621]'
                      : index === 2
                        ? 'bg-gradient-to-tr from-amber-700 to-amber-500 text-white'
                        : 'bg-[#030617] border border-cyan-500/30 text-cyan-300'
                    }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-xl text-white group-hover:text-cyan-300 transition-colors">
                      {isCeiis ? 'CEIIS' : `Código ${item.promoCode}`}
                    </h3>
                    <span className="text-xs font-semibold text-slate-400">
                      Puesto #{index + 1}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-heading font-black text-cyan-300 font-mono">
                    {item.soldTickets}
                  </span>
                  {!isCeiis ? (
                    <span className="text-xs text-slate-400 block">/ {item.targetTickets}</span>
                  ) : (
                    <span className="text-xs text-cyan-400/80 block font-medium">rifas</span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {!isCeiis ? (
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-slate-400">Meta referencial</span>
                    <span className={`font-mono ${percent >= 100 ? 'text-emerald-300 font-bold' : 'text-cyan-300'}`}>
                      {percent}% {percent >= 100 && '🎯'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#030617] overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${percent >= 100
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-300 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                          : percent >= 80
                            ? 'bg-emerald-400'
                            : percent >= 40
                              ? 'bg-cyan-400'
                              : 'bg-blue-500'
                        }`}
                      style={{ width: `${Math.min(100, Math.max(4, percent))}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-slate-400">Ventas directas CEIIS</span>
                    <span className="text-cyan-300 font-mono">{item.soldTickets} rifas</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#030617] overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 transition-all duration-500 shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                      style={{ width: item.soldTickets > 0 ? '100%' : '4%' }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Stats Footer */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <div>
                  <span>Recaudado: </span>
                  <strong className="text-white font-mono">S/. {item.totalAmount.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Vendedores: </span>
                  <strong className="text-cyan-400 font-mono">{item.sellersCount}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
