import React, { useState, useEffect } from 'react';
import type { Sale } from '../types';
import { getSales, fetchSalesFromSupabase } from '../utils/storage';
import { VirtualTicketCard } from './VirtualTicketCard';

interface Props {
  initialSaleId?: string;
}

export const TicketViewer: React.FC<Props> = ({ initialSaleId }) => {
  const [sale, setSale] = useState<Sale | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [unassignedTicketNumber, setUnassignedTicketNumber] = useState<number | null>(null);

  useEffect(() => {
    // Check initial prop or query string parameter
    let targetId = initialSaleId;
    if (!targetId && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      targetId = urlParams.get('id') || undefined;
    }

    if (targetId) {
      const q = targetId.toLowerCase();
      const sales = getSales();
      const found = sales.find((s) => s.id.toLowerCase() === q);
      if (found) {
        setSale(found);
        setHasSearched(true);
      }
      fetchSalesFromSupabase().then((latestSales) => {
        const remoteFound = latestSales.find((s) => s.id.toLowerCase() === q);
        if (remoteFound) {
          setSale(remoteFound);
          setHasSearched(true);
        }
      });
    }
  }, [initialSaleId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = searchQuery.trim();
    if (!raw) return;

    setHasSearched(true);
    setSale(null);
    setUnassignedTicketNumber(null);

    const q = raw.toLowerCase();
    const cleanNum = q.replace(/^n[°º#\s-]*/i, '').trim();
    const isPureNumber = /^\d+$/.test(cleanNum);
    const searchTicketNum = isPureNumber && cleanNum.length < 8 ? parseInt(cleanNum, 10) : null;
    const isPhoneNumber = isPureNumber && cleanNum.length >= 7;

    const findMatch = (salesList: Sale[]): Sale | undefined => {
      // 1. Si buscó un número de boleto específico
      if (searchTicketNum !== null && !isPhoneNumber) {
        const byTicket = salesList.find((s) => s.ticketNumbers.includes(searchTicketNum));
        if (byTicket) return byTicket;
      }

      // 2. Por ID exacto o coincidencia de ID
      const byId = salesList.find((s) => s.id.toLowerCase() === q);
      if (byId) return byId;

      // 3. Por teléfono (requiere al menos 7 dígitos para evitar coincidencias erróneas de dígitos sueltos)
      if (isPhoneNumber) {
        const cleanPhone = cleanNum;
        const byPhone = salesList.find((s) => {
          const sPhone = s.buyerPhone.replace(/\D/g, '');
          return sPhone === cleanPhone || sPhone.endsWith(cleanPhone);
        });
        if (byPhone) return byPhone;
      }

      // 4. Fallback si es número y no es teléfono
      if (searchTicketNum !== null) {
        return salesList.find((s) => s.ticketNumbers.includes(searchTicketNum));
      }

      return undefined;
    };

    let sales = getSales();
    let found = findMatch(sales);

    if (!found) {
      const remoteSales = await fetchSalesFromSupabase();
      found = findMatch(remoteSales);
    }

    if (found) {
      setSale(found);
    } else if (searchTicketNum !== null && !isPhoneNumber) {
      // Búsqueda de número de rifa no encontrada
      setUnassignedTicketNumber(searchTicketNum);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Search Input for Public Buyer Lookup */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/20 text-center">
        <h2 className="font-heading font-extrabold text-2xl text-white mb-2">
          Consulta tu Boleto
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          Ingresa tu número de celular (9 dígitos), número de boleto o ID de compra
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ej. 987654321 o N° de boleto (ej. 1)"
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
          {/* Al consultar en el verificador no se muestran los botones de compartir/imprimir */}
          <VirtualTicketCard sale={sale} showShareActions={false} />
        </div>
      ) : hasSearched ? (
        unassignedTicketNumber !== null ? (
          <div className="glass-panel p-8 rounded-2xl border border-amber-500/30 text-center space-y-3 animate-fade-in">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 font-mono font-black text-xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              N° {unassignedTicketNumber}
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-2xl text-amber-300 tracking-wide">
                Rifa aún no vendida
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 max-w-md mx-auto">
                El boleto oficial <strong className="text-white font-mono">N° {unassignedTicketNumber}</strong> todavía no ha sido vendido ni registrado en el sistema.
              </p>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-8 rounded-2xl border border-rose-500/30 text-center text-xs text-slate-400 space-y-2 animate-fade-in">
            <p className="text-white font-semibold text-sm">No se encontró ningún boleto con los datos ingresados.</p>
            <p>Verifica que el número de teléfono (9 dígitos), número de boleto o ID de compra esté correcto.</p>
          </div>
        )
      ) : null}
    </div>
  );
};
