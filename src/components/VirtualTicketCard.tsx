import React from 'react';
import type { Sale } from '../types';
import { generateWhatsAppLink } from '../utils/storage';
import boletoTemplate from '../assets/Boletos/Boleto_Template.webp';

interface Props {
  sale: Sale;
  showShareActions?: boolean;
}

export const VirtualTicketCard: React.FC<Props> = ({ sale, showShareActions = true }) => {
  const waLink = generateWhatsAppLink(sale);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Ticket Container */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0c1236] via-[#070b24] to-[#030615] border border-cyan-500/30 shadow-[0_0_40px_rgba(0,195,255,0.18)]">
        {/* Holographic Top Glow */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500"></div>

        {/* Header Section */}
        <div className="p-5 sm:p-6 pb-4 border-b border-cyan-500/20 bg-blue-950/20">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading font-extrabold text-xl text-white tracking-wide">
              GRAN RIFA FIIS 2026
            </h3>
            <span
              className={`text-[13px] font-bold px-3 py-1 rounded-full border shadow-sm shrink-0 ${sale.status === 'verified'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : sale.status === 'rejected'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
            >
              {sale.status === 'verified'
                ? 'Aprobado'
                : sale.status === 'rejected'
                  ? 'Rechazado'
                  : 'Pendiente'}
            </span>
          </div>
        </div>

        {/* Espacio para la Imagen de los Boletos Oficiales de la Rifa */}
        <div className="p-3 sm:p-5 pb-3 bg-[#030617]/70 space-y-3">
          {sale.status === 'verified' && sale.ticketNumbers && sale.ticketNumbers.length > 0 ? (
            <div className="space-y-3">
              {sale.ticketNumbers.map((num) => {
                const formattedNum = String(num).padStart(4, '0');
                const boletoUrl = `https://hazmgfjnevtdtssthnso.supabase.co/storage/v1/object/public/boletos/rifa_${formattedNum}.png`;

                return (
                  <div key={num} className="relative w-full rounded-xl overflow-hidden border border-cyan-500/30 bg-[#020617] p-2 space-y-2 shadow-inner">
                    <img
                      src={boletoUrl}
                      alt={`Boleto Oficial N°${num} Gran Rifa FIIS 2026`}
                      className="w-full h-auto max-h-[300px] object-contain rounded-lg mx-auto"
                      loading="lazy"
                    />
                    <div className="flex justify-between items-center px-1">
                      <span className="font-mono font-bold text-xs text-cyan-300">
                        Boleto Oficial N°{num}
                      </span>
                      <a
                        href={boletoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={`rifa_${formattedNum}.png`}
                        className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-[11px] font-bold text-cyan-200 transition-colors inline-flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Descargar Imagen
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="relative w-full rounded-xl overflow-hidden border border-cyan-500/30 bg-[#020617] flex items-center justify-center shadow-inner">
              <img
                src={typeof boletoTemplate === 'string' ? boletoTemplate : (boletoTemplate as any).src}
                alt="Boleto Oficial Gran Rifa FIIS 2026"
                className="w-full h-auto max-h-[300px] object-contain rounded-lg"
              />
            </div>
          )}

          {/* Textos informativos condicionales según el estado del registro */}
          <div className="text-center space-y-1.5 pt-1">
            {sale.status !== 'verified' && (
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium tracking-wide">
                (Imagen Referencial)
              </p>
            )}

            {sale.status === 'verified' && (
              <p className="text-sm sm:text-base font-bold text-emerald-300 leading-snug">
                ¡Compra Aprobada! Aquí tienes tus boletos oficiales para el sorteo.
              </p>
            )}

            {sale.status === 'pending' && (
              <p className="text-sm sm:text-base font-bold text-cyan-200 leading-snug">
                ¡Gracias! El pago está en revisión por el CEIIS. Una vez aprobado, los boletos se entregarán, a más tardar, en 24 hrs.
              </p>
            )}

            {sale.status === 'rejected' && (
              <p className="text-sm sm:text-base font-bold text-rose-400 leading-snug max-w-lg mx-auto">
                El pago no pudo ser validado. Los números han sido liberados. En caso de error, contacte al vendedor o al CEIIS.
              </p>
            )}
          </div>
        </div>

        {/* Perforated Divider with Side Notches */}
        <div className="relative py-1 flex items-center justify-between overflow-hidden">
          <div className="w-5 h-5 rounded-full bg-[#000c18] -ml-2.5 border-r border-cyan-500/30"></div>
          <div className="flex-1 border-b-2 border-dashed border-cyan-500/25 mx-2"></div>
          <div className="w-5 h-5 rounded-full bg-[#000c18] -mr-2.5 border-l border-cyan-500/30"></div>
        </div>

        {/* Numbers, Total, Buyer & Seller Information */}
        <div className="p-5 sm:p-6 pt-3 space-y-4">
          {/* Números de Rifa Vendidos, Total y Precio */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/25 via-blue-950/35 to-indigo-950/25 border border-cyan-500/25 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-white/10 pb-2.5">
              <span className="text-xs uppercase tracking-wider font-bold text-cyan-400">
                {sale.ticketsCount > 1 ? 'Números de Rifa Vendidos' : 'Número de Rifa Vendido'}
              </span>
              <span className="text-xs text-slate-300 font-semibold">
                Total: <span className="text-cyan-300 font-bold">{sale.ticketsCount} {sale.ticketsCount > 1 ? 'boletos' : 'boleto'}</span> — <span className="text-emerald-400 font-bold">S/. {sale.totalAmount.toFixed(2)}</span>
              </span>
            </div>

            {/* Badges de números de rifa vendidos (1 al n) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {sale.ticketNumbers.map((num) => (
                <span
                  key={num}
                  className="px-3.5 py-1.5 rounded-lg bg-[#060621] border border-cyan-400/50 shadow-[0_0_12px_rgba(0,240,255,0.2)] text-cyan-300 font-mono font-black text-lg tracking-wider"
                >
                  N°{num}
                </span>
              ))}
            </div>
          </div>

          {/* Comprador y Vendedor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                Comprador(a)
              </span>
              <p className="font-bold text-sm text-white">{sale.buyerName}</p>
              <p className="text-slate-300 font-mono">+51 {sale.buyerPhone}</p>
            </div>

            <div className="space-y-1.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                Vendedor(a) Autorizado(a)
              </span>
              <p className="font-bold text-sm text-cyan-200">{sale.sellerName}</p>
              <p className="text-slate-300 font-mono">
                Cód. {sale.sellerStudentCode} | {sale.promoCode}
              </p>
            </div>
          </div>
        </div>

        {/* Footer with Validity note */}
        <div className="px-6 py-3.5 bg-[#05081c] border-t border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p className="text-[11px] text-slate-300 font-medium">Boleto Digital Autenticado</p>
          <p className="text-[10px] text-slate-500">
            Emitido: {new Date(sale.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
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
            Enviar Boleto por WhatsApp
          </a>
          <button
            onClick={() => window.print()}
            className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-medium text-sm flex items-center justify-center gap-2 border border-white/10 transition-all"
          >
            Imprimir / Guardar PDF
          </button>
        </div>
      )}
    </div>
  );
};
