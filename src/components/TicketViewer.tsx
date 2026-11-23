import React, { useState, useEffect } from 'react';
import type { Sale } from '../types';
import { getSales } from '../utils/storage';
import { VirtualTicketCard } from './VirtualTicketCard';

interface Props {
  initialSaleId?: string;
}

export const TicketViewer: React.FC<Props> = ({ initialSaleId }) => {
  const [sale, setSale] = useState<Sale | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    // Check initial prop or query string parameter
    let targetId = initialSaleId;
    if (!targetId && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      targetId = urlParams.get('id') || undefined;
    }

    if (targetId) {
      const sales = getSales();
      const found = sales.find((s) => s.id.toLowerCase() === targetId?.toLowerCase());
      if (found) {
        setSale(found);
        setHasSearched(true);
      }
    }
  }, [initialSaleId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    const sales = getSales();
    const found = sales.find((s) => {
      const matchId = s.id.toLowerCase() === q;
      const matchPhone = s.buyerPhone.includes(q);
      const matchTicket = s.ticketNumbers.some((n) => String(n) === q);
      return matchId || matchPhone || matchTicket;
    });

    setSale(found || null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Search Input for Public Buyer Lookup */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 text-center">
        <h2 className="font-heading font-extrabold text-2xl text-white mb-2">
          Consulta tu Boleto Digital Oficial
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          Ingresa tu número de celular (9 dígitos), número de boleto o ID de compra
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ej. 987654321 o N° de boleto (1001)"
            className="flex-1 bg-[#030617] border border-cyan-500/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-400 placeholder:text-slate-600 font-mono"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Result Display */}
      {sale ? (
        <div className="animate-fade-in">
          <VirtualTicketCard sale={sale} showShareActions={true} />
        </div>
      ) : hasSearched ? (
        <div className="glass-panel p-8 rounded-2xl border border-rose-500/30 text-center text-xs text-slate-400 space-y-2">
          <p className="text-white font-semibold">No se encontró ningún boleto con los datos ingresados.</p>
          <p>Verifica que el número de teléfono o boleto esté correcto, o comunícate con tu vendedor.</p>
        </div>
      ) : null}
    </div>
  );
};
