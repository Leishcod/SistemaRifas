import React, { useState, useEffect } from 'react';
import type { PromoCode, Sale, SaleStatus } from '../types';
import { PROMO_CODES } from '../data/students';
import { getSales, updateSaleStatus } from '../utils/storage';

export const AdminDashboard: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [activeRole, setActiveRole] = useState<'admin' | 'delegate'>('admin');
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | SaleStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVoucherSale, setSelectedVoucherSale] = useState<Sale | null>(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = () => {
    setSales(getSales());
  };

  const handleStatusChange = (saleId: string, newStatus: SaleStatus) => {
    updateSaleStatus(saleId, newStatus);
    loadSales();
    if (selectedVoucherSale && selectedVoucherSale.id === saleId) {
      setSelectedVoucherSale({ ...selectedVoucherSale, status: newStatus });
    }
  };

  // Filter sales
  const filteredSales = sales.filter((sale) => {
    // Role & Promo Filter
    if (activeRole === 'delegate' && selectedPromo !== 'all' && sale.promoCode !== selectedPromo) {
      return false;
    }
    if (activeRole === 'admin' && selectedPromo !== 'all' && sale.promoCode !== selectedPromo) {
      return false;
    }

    // Status Filter
    if (statusFilter !== 'all' && sale.status !== statusFilter) {
      return false;
    }

    // Search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchBuyer = sale.buyerName.toLowerCase().includes(term);
      const matchSeller = sale.sellerName.toLowerCase().includes(term) || sale.sellerStudentCode.toLowerCase().includes(term);
      const matchTickets = sale.ticketNumbers.some((n) => String(n).includes(term));
      const matchPhone = sale.buyerPhone.includes(term);
      const matchOp = sale.operationNumber?.toLowerCase().includes(term);
      if (!matchBuyer && !matchSeller && !matchTickets && !matchPhone && !matchOp) {
        return false;
      }
    }

    return true;
  });

  // Calculate Metrics
  const totalTickets = filteredSales.reduce((acc, s) => acc + s.ticketsCount, 0);
  const totalAmount = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const pendingCount = filteredSales.filter((s) => s.status === 'pending').length;
  const verifiedCount = filteredSales.filter((s) => s.status === 'verified').length;

  const exportToCSV = () => {
    if (filteredSales.length === 0) {
      alert('No hay ventas para exportar con los filtros seleccionados.');
      return;
    }

    const headers = [
      'ID Venta',
      'Fecha',
      'Base',
      'Cod Vendedor',
      'Nombre Vendedor',
      'Nombre Comprador',
      'Telefono Comprador',
      'Cant Rifas',
      'Boletos Asignados',
      'Total S/.',
      'Estado',
      'Nro Operacion'
    ];

    const rows = filteredSales.map((s) => [
      s.id,
      new Date(s.createdAt).toLocaleString('es-PE'),
      s.promoCode,
      s.sellerStudentCode,
      `"${s.sellerName.replace(/"/g, '""')}"`,
      `"${s.buyerName.replace(/"/g, '""')}"`,
      s.buyerPhone,
      s.ticketsCount,
      `"${s.ticketNumbers.join(', ')}"`,
      s.totalAmount.toFixed(2),
      s.status,
      s.operationNumber || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_rifas_fiis_${selectedPromo}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Role Selector */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
              Módulo de Supervisión & Vouchers
            </span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white">
            Panel de Control CEIIS - FIIS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Revisión de comprobantes Yape/Plin, control de cuotas y validación de boletos
          </p>
        </div>

        {/* Role toggle */}
        <div className="flex items-center gap-2 p-1 bg-[#030617] rounded-xl border border-cyan-500/30 text-xs">
          <button
            onClick={() => {
              setActiveRole('admin');
              setSelectedPromo('all');
            }}
            className={`px-3 py-2 rounded-lg font-semibold transition-all ${
              activeRole === 'admin'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(0,195,255,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🏛️ Vista General (Admin)
          </button>
          <button
            onClick={() => {
              setActiveRole('delegate');
              if (selectedPromo === 'all') setSelectedPromo('24-1');
            }}
            className={`px-3 py-2 rounded-lg font-semibold transition-all ${
              activeRole === 'delegate'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            👥 Vista por Delegado
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-cyan-500/20">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Rifas Vendidas</span>
          <p className="text-2xl sm:text-3xl font-heading font-black text-white mt-1">{totalTickets}</p>
          <span className="text-[11px] text-cyan-300">en {filteredSales.length} transacciones</span>
        </div>

        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-cyan-500/20">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Recaudado</span>
          <p className="text-2xl sm:text-3xl font-heading font-black text-cyan-400 mt-1">S/. {totalAmount.toFixed(2)}</p>
          <span className="text-[11px] text-slate-400">monto total registrado</span>
        </div>

        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-amber-950/10">
          <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block">Vouchers Pendientes</span>
          <p className="text-2xl sm:text-3xl font-heading font-black text-amber-400 mt-1">{pendingCount}</p>
          <span className="text-[11px] text-amber-300/80">requieren verificación</span>
        </div>

        <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/10">
          <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">Vouchers Verificados</span>
          <p className="text-2xl sm:text-3xl font-heading font-black text-emerald-400 mt-1">{verifiedCount}</p>
          <span className="text-[11px] text-emerald-300/80">pagos comprobados</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-cyan-500/20 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Base selector */}
          <div className="w-full sm:w-auto">
            <select
              value={selectedPromo}
              onChange={(e) => setSelectedPromo(e.target.value as any)}
              className="w-full sm:w-auto bg-[#030617] border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              {activeRole === 'admin' && <option value="all">Todas las Bases (11)</option>}
              {PROMO_CODES.map((code) => (
                <option key={code} value={code}>
                  Base {code}
                </option>
              ))}
            </select>
          </div>

          {/* Status selector */}
          <div className="w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full sm:w-auto bg-[#030617] border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="all">Todos los Estados</option>
              <option value="pending">⏳ Solo Pendientes</option>
              <option value="verified">✓ Solo Verificados</option>
              <option value="rejected">✗ Solo Rechazados</option>
            </select>
          </div>

          {/* Search box */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar comprador, vendedor o boleto..."
              className="w-full bg-[#030617] border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Export Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-700/60 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold border border-emerald-500/30 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            <span>📊</span> Exportar a Excel (CSV)
          </button>
        </div>
      </div>

      {/* Vouchers & Sales Table */}
      <div className="glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#030617]/90 text-slate-400 uppercase tracking-wider text-[11px] border-b border-cyan-500/20">
              <tr>
                <th className="py-3.5 px-4">Voucher</th>
                <th className="py-3.5 px-4">Boletos</th>
                <th className="py-3.5 px-4">Comprador</th>
                <th className="py-3.5 px-4">Vendedor (Estudiante)</th>
                <th className="py-3.5 px-4">Base</th>
                <th className="py-3.5 px-4">Monto</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No se encontraron registros con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Voucher Thumbnail */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedVoucherSale(sale)}
                        className="relative group rounded-lg overflow-hidden border border-cyan-500/30 w-14 h-14 bg-[#030617] flex items-center justify-center"
                      >
                        <img
                          src={sale.voucherImage}
                          alt="Voucher"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                          🔍 Ver
                        </div>
                      </button>
                    </td>

                    {/* Ticket numbers */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[140px]">
                        {sale.ticketNumbers.map((num) => (
                          <span
                            key={num}
                            className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-[10px]"
                          >
                            N° {num}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{sale.ticketsCount} boleto(s)</span>
                    </td>

                    {/* Buyer */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{sale.buyerName}</p>
                      <p className="text-slate-400 font-mono text-[11px]">📱 +51 {sale.buyerPhone}</p>
                    </td>

                    {/* Seller */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-cyan-200">{sale.sellerName}</p>
                      <p className="text-slate-400 font-mono text-[11px]">{sale.sellerStudentCode}</p>
                    </td>

                    {/* Promo Base */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-md bg-blue-950/60 border border-blue-500/40 text-blue-300 font-bold text-[11px]">
                        Base {sale.promoCode}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4">
                      <p className="font-heading font-bold text-white text-sm">S/. {sale.totalAmount.toFixed(2)}</p>
                      {sale.operationNumber && (
                        <p className="text-[10px] text-slate-500 font-mono">Op: {sale.operationNumber}</p>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          sale.status === 'verified'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : sale.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {sale.status === 'verified' ? '✓ Verificado' : sale.status === 'rejected' ? '✗ Rechazado' : '⏳ Pendiente'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleStatusChange(sale.id, 'verified')}
                          title="Aprobar Pago"
                          className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 transition-colors"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => handleStatusChange(sale.id, 'rejected')}
                          title="Rechazar Comprobante"
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 transition-colors"
                        >
                          ✗
                        </button>
                        <button
                          onClick={() => setSelectedVoucherSale(sale)}
                          title="Detalles y Voucher"
                          className="p-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 transition-colors"
                        >
                          🔍
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Voucher Inspection Modal */}
      {selectedVoucherSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-cyan-500/20 flex items-center justify-between bg-[#060621]">
              <div>
                <h3 className="font-heading font-bold text-lg text-white">Inspección de Comprobante de Pago</h3>
                <p className="text-xs text-slate-400">ID: {selectedVoucherSale.id} • Base {selectedVoucherSale.promoCode}</p>
              </div>
              <button
                onClick={() => setSelectedVoucherSale(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Voucher Image */}
              <div className="rounded-xl overflow-hidden border border-cyan-500/30 bg-[#030617] max-h-96 flex items-center justify-center p-2">
                <img
                  src={selectedVoucherSale.voucherImage}
                  alt="Voucher Ampliado"
                  className="max-h-80 w-auto object-contain rounded-lg shadow-lg"
                />
              </div>

              {/* Sale Info Summary */}
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Comprador</span>
                  <p className="text-sm font-bold text-white">{selectedVoucherSale.buyerName}</p>
                  <p className="font-mono text-slate-300">📱 +51 {selectedVoucherSale.buyerPhone}</p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Vendedor UNI</span>
                  <p className="text-sm font-bold text-cyan-300">{selectedVoucherSale.sellerName}</p>
                  <p className="font-mono text-slate-300">
                    Cód: {selectedVoucherSale.sellerStudentCode} (Base {selectedVoucherSale.promoCode})
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/40 to-cyan-950/40 border border-cyan-500/20 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-semibold">Total a verificar:</span>
                    <span className="text-lg font-heading font-extrabold text-cyan-300">
                      S/. {selectedVoucherSale.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Boletos: {selectedVoucherSale.ticketNumbers.map((n) => `N° ${n}`).join(', ')}
                  </p>
                  {selectedVoucherSale.operationNumber && (
                    <p className="text-[11px] text-slate-300 font-mono">
                      N° Operación: {selectedVoucherSale.operationNumber}
                    </p>
                  )}
                </div>

                {/* Status action buttons */}
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedVoucherSale.id, 'verified')}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    ✓ Aprobar Pago
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedVoucherSale.id, 'rejected')}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white font-bold transition-all"
                  >
                    ✗ Rechazar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
