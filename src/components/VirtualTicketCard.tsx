import React from 'react';
import type { Sale } from '../types';
import { generateWhatsAppLink } from '../utils/storage';

interface Props {
  sale: Sale;
  showShareActions?: boolean;
}

export const VirtualTicketCard: React.FC<Props> = ({ sale, showShareActions = true }) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    typeof window !== 'undefined' ? `${window.location.origin}/ticket/${sale.id}` : `https://rifa-fiis.ceiis.uni.edu.pe/ticket/${sale.id}`
  )}&bgcolor=060621&color=00f0ff`;

  const waLink = generateWhatsAppLink(sale);

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Ticket Container */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0c1236] via-[#070b24] to-[#030615] border border-cyan-500/30 shadow-[0_0_40px_rgba(0,195,255,0.18)]">
        {/* Holographic Top Glow */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500"></div>

        {/* Header Section */}
        <div className="p-6 pb-4 border-b border-cyan-500/20 bg-blue-950/20">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Base {sale.promoCode}
              </span>
              <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-white/5 text-slate-300 border border-white/10">
                CEIIS - FIIS UNI
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-400 block">ID #{sale.id.slice(-6)}</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                sale.status === 'verified'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : sale.status === 'rejected'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {sale.status === 'verified' ? '✓ Pago Verificado' : sale.status === 'rejected' ? '✗ Rechazado' : '⏳ Pago Pendiente'}
              </span>
            </div>
          </div>

          <h3 className="font-heading font-extrabold text-xl text-white tracking-wide">
            GRAN RIFA PRO-FONDOS FIIS 2026
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Participa por grandes premios tecnológicos y sorpresas exclusivas.
          </p>
        </div>

        {/* Perforated Divider with Side Notches */}
        <div className="relative py-2 flex items-center justify-between overflow-hidden">
          <div className="w-5 h-5 rounded-full bg-[#000c18] -ml-2.5 border-r border-cyan-500/30"></div>
          <div className="flex-1 border-b-2 border-dashed border-cyan-500/25 mx-2"></div>
          <div className="w-5 h-5 rounded-full bg-[#000c18] -mr-2.5 border-l border-cyan-500/30"></div>
        </div>

        {/* Middle Numbers Section */}
        <div className="px-6 py-4 bg-gradient-to-r from-cyan-950/20 via-blue-950/30 to-indigo-950/20 text-center">
          <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold block mb-1">
            {sale.ticketsCount > 1 ? 'Números Oficiales Asignados' : 'Número Oficial Asignado'}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2 my-2">
            {sale.ticketNumbers.map((num) => (
              <div
                key={num}
                className="px-4 py-2 rounded-xl bg-[#060621] border border-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.2)] text-2xl font-mono font-black text-cyan-300 tracking-wider"
              >
                N° {String(num).padStart(4, '0')}
              </div>
            ))}
          </div>
          <span className="text-[11px] text-slate-400">
            Total: {sale.ticketsCount} boleto(s) — S/. {sale.totalAmount.toFixed(2)}
          </span>
        </div>

        {/* Buyer & Seller Info Body */}
        <div className="p-6 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
              Comprador(a)
            </span>
            <p className="font-bold text-sm text-white">{sale.buyerName}</p>
            <p className="text-slate-300 font-mono">📱 +51 {sale.buyerPhone}</p>
          </div>

          <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
              Vendedor(a) Autorizado(a)
            </span>
            <p className="font-bold text-sm text-cyan-200">{sale.sellerName}</p>
            <p className="text-slate-300 font-mono">
              Cód. {sale.sellerStudentCode} • Base {sale.promoCode}
            </p>
          </div>
        </div>

        {/* Footer with QR Code and Validity note */}
        <div className="px-6 py-4 bg-[#05081c] border-t border-cyan-500/20 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] text-slate-300 font-medium">Boleto Digital Autenticado</p>
            <p className="text-[10px] text-slate-500">
              Emitido: {new Date(sale.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
            {sale.operationNumber && (
              <p className="text-[10px] font-mono text-cyan-400/90">Operación: {sale.operationNumber}</p>
            )}
          </div>
          <div className="p-1 rounded-lg bg-[#060621] border border-cyan-500/40 shadow-sm shrink-0">
            <img src={qrUrl} alt="QR Verificación" className="w-14 h-14 rounded" />
          </div>
        </div>
      </div>

      {/* Share / WhatsApp Actions */}
      {showShareActions && (
        <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98]"
          >
            <span>📲</span> Enviar Boleto por WhatsApp
          </a>
          <button
            onClick={() => window.print()}
            className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-medium text-sm flex items-center justify-center gap-2 border border-white/10 transition-all"
          >
            <span>🖨️</span> Imprimir / PDF
          </button>
        </div>
      )}
    </div>
  );
};
