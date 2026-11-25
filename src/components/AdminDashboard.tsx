import React, { useState, useEffect } from 'react';
import type { PromoCode, Sale, SaleStatus, SessionUser } from '../types';
import { PROMO_CODES } from '../data/students';
import { getSales, updateSaleStatusAsync, fetchSalesFromSupabase, generateWhatsAppLink } from '../utils/storage';
import { getAuthSession, clearAuthSession } from '../utils/auth';
import { LoginForm } from './LoginForm';

export const AdminDashboard: React.FC = () => {
  const [authUser, setAuthUser] = useState<SessionUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | SaleStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVoucherSale, setSelectedVoucherSale] = useState<Sale | null>(null);

  useEffect(() => {
    const session = getAuthSession();
    setAuthUser(session);
    setIsCheckingAuth(false);

    loadSales();
    fetchSalesFromSupabase().then((data) => {
      setSales(data);
    });
  }, []);

  const loadSales = () => {
    setSales(getSales());
  };

  const handleLogout = () => {
    clearAuthSession();
    setAuthUser(null);
  };

  const handleStatusChange = async (saleId: string, newStatus: SaleStatus) => {
    await updateSaleStatusAsync(saleId, newStatus);
    loadSales();
    if (selectedVoucherSale && selectedVoucherSale.id === saleId) {
      setSelectedVoucherSale({ ...selectedVoucherSale, status: newStatus });
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 mx-auto border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 mt-3">Verificando credenciales...</p>
      </div>
    );
  }

  // Si no ha iniciado sesión, mostrar login
  if (!authUser) {
    return <LoginForm targetPanel="admin" onLoginSuccess={(user) => setAuthUser(user)} />;
  }

  // Si tiene rol delegado pero entró a /admin, mostrar aviso y redirigir
  if (authUser.role === 'delegado') {
    return (
      <div className="py-6 sm:py-10 max-w-md mx-auto">
        <div className="glass-panel p-8 rounded-2xl border border-amber-500/30 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="font-heading font-black text-2xl text-white">Acceso Restringido</h3>
          <p className="text-[16px] text-slate-300">
            Hola, <strong className="text-white">{authUser.fullName}</strong>. Tu cuenta tiene rol de{' '}
            <strong>Delegado ({authUser.promoCode === 'CEIIS' ? 'CEIIS' : `Código ${authUser.promoCode}`})</strong>.
            La vista general está reservada exclusivamente para el CEIIS.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <a
              href="/delegados"
              className="py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#000c18] font-bold text-xs transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] text-center"
            >
              Ir a mi Panel de Delegado
            </a>
            <button
              onClick={handleLogout}
              className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si tiene rol ninguno
  if (authUser.role === 'ninguno') {
    return (
      <div className="py-6 sm:py-10 max-w-md mx-auto">
        <div className="glass-panel p-8 rounded-2xl border border-rose-500/30 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h3 className="font-heading font-black text-2xl text-white">Acceso Denegado</h3>
          <p className="text-xs text-slate-300">
            Tu cuenta no cuenta con permisos de administración ni de delegado.
          </p>
          <div className="pt-2">
            <button
              onClick={handleLogout}
              className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Rol CEIIS: Acceso total
  // Filter sales
  const filteredSales = sales.filter((sale) => {
    // Promo Filter
    if (selectedPromo !== 'all' && sale.promoCode !== selectedPromo) {
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
      const matchSeller =
        sale.sellerName.toLowerCase().includes(term) ||
        sale.sellerStudentCode.toLowerCase().includes(term);
      const matchTickets = sale.ticketNumbers.some((n) => String(n).includes(term));
      const matchPhone = sale.buyerPhone.includes(term);
      if (!matchBuyer && !matchSeller && !matchTickets && !matchPhone) {
        return false;
      }
    }

    return true;
  });

  // Calculate Metrics (solo ventas no rechazadas aportan dinero y boletos vendidos)
  const activeFilteredSales = filteredSales.filter((s) => s.status !== 'rejected');
  const totalTickets = activeFilteredSales.reduce((acc, s) => acc + s.ticketsCount, 0);
  const totalAmount = activeFilteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
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
      'Código',
      'Cod Vendedor',
      'Nombre Vendedor',
      'Nombre Comprador',
      'Telefono Comprador',
      'Cant Rifas',
      'Boletos Asignados',
      'Total S/.',
      'Estado',
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
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `reporte_rifas_fiis_${selectedPromo}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & CEIIS User Info */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-cyan-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-[11px] sm:text-xs uppercase font-bold tracking-widest text-cyan-400">
              Módulo de Supervisión & Vouchers (CEIIS)
            </span>
          </div>
          <h1 className="font-heading font-extrabold text-xl sm:text-3xl text-white">
            Panel de Control General
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Revisión de comprobantes Plin, control de códigos y validación de boletos
          </p>
        </div>

        {/* User Card & Logout */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm font-bold text-white">{authUser.fullName}</p>
            <p className="text-[11px] font-bold text-cyan-300 tracking-wider">
              CEIIS
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all active:scale-95 shrink-0"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Metrics Row: 2x2 en móvil con textos compactos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-panel p-3.5 sm:p-5 rounded-2xl border border-cyan-500/20">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Rifas Vendidas
          </span>
          <p className="text-xl sm:text-3xl font-heading font-black text-white mt-1">
            {totalTickets}
          </p>
          <span className="text-[10px] sm:text-[11px] text-cyan-300 block truncate">boletos emitidos</span>
        </div>

        <div className="glass-panel p-3.5 sm:p-5 rounded-2xl border border-cyan-500/20">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Recaudado
          </span>
          <p className="text-xl sm:text-3xl font-heading font-black text-cyan-400 mt-1 whitespace-nowrap">
            S/. {totalAmount.toFixed(2)}
          </p>
          <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">monto registrado</span>
        </div>

        <div className="glass-panel p-3.5 sm:p-5 rounded-2xl border border-cyan-500/20">
          <span className="text-[10px] sm:text-[11px] font-semibold text-amber-300 uppercase tracking-wider block">
            Vouchers Pendientes
          </span>
          <p className="text-xl sm:text-3xl font-heading font-black text-amber-300 mt-1">
            {pendingCount}
          </p>
          <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">por verificar</span>
        </div>

        <div className="glass-panel p-3.5 sm:p-5 rounded-2xl border border-cyan-500/20">
          <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
            Vouchers Verificados
          </span>
          <p className="text-xl sm:text-3xl font-heading font-black text-emerald-400 mt-1">
            {verifiedCount}
          </p>
          <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">aprobados</span>
        </div>
      </div>

      {/* Filter and Action Bar: En móvil organizado en filas limpias */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-cyan-500/20 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="grid grid-cols-2 md:flex items-center gap-2">
          {/* CEIIS puede alternar libremente entre todos los códigos */}
          <select
            value={selectedPromo}
            onChange={(e) => setSelectedPromo(e.target.value as any)}
            className="w-full md:w-auto bg-[#030617] border border-cyan-500/30 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 truncate"
          >
            <option value="all">Todos los Códigos ({PROMO_CODES.length})</option>
            {PROMO_CODES.map((code) => (
              <option key={code} value={code}>
                {code === 'CEIIS' ? 'CEIIS' : `Código ${code}`}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full md:w-auto bg-[#030617] border border-cyan-500/30 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="all">Todos los Estados</option>
            <option value="pending">Pendientes</option>
            <option value="verified">Verificados</option>
            <option value="rejected">Rechazados</option>
          </select>
        </div>

        {/* Search & Export Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar comprador, vendedor o boleto..."
            className="w-full md:w-64 bg-[#030617] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
          />

          <button
            onClick={exportToCSV}
            className="w-full sm:w-auto justify-center px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-500/40"
          >
            Exportar a Excel (CSV)
          </button>
        </div>
      </div>

      {/* Sales Table with Verification Actions */}
      <div className="glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#030617] text-slate-400 text-[11px] uppercase font-bold tracking-wider border-b border-cyan-500/20">
              <tr>
                <th className="py-3 px-4">Voucher</th>
                <th className="py-3 px-4">Boletos</th>
                <th className="py-3 px-4">Comprador</th>
                <th className="py-3 px-4">Vendedor (Estudiante)</th>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Monto</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-normal">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    No se encontraron registros de ventas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Voucher preview */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedVoucherSale(sale)}
                        className="w-10 h-10 rounded-lg overflow-hidden border border-cyan-500/30 hover:border-cyan-400 transition-colors relative group block bg-[#030617]"
                        title="Ver comprobante"
                      >
                        <img
                          src={sale.voucherImage}
                          alt="Voucher"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold transition-opacity">
                          Ver
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
                            N°{num}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {sale.ticketsCount} boleto(s)
                      </span>
                    </td>

                    {/* Buyer */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{sale.buyerName}</p>
                      <p className="text-slate-400 font-mono text-[11px]">+51 {sale.buyerPhone}</p>
                    </td>

                    {/* Seller */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-cyan-200">{sale.sellerName}</p>
                      <p className="text-slate-400 font-mono text-[11px]">
                        {sale.sellerStudentCode}
                      </p>
                    </td>

                    {/* Promo Code: En móvil muestra solo el número para ahorrar espacio, en PC muestra Código [num] */}
                    <td className="py-3 px-3 sm:px-4">
                      <span className="px-2 py-0.5 sm:py-1 rounded-md bg-blue-950/60 border border-blue-500/40 text-blue-300 font-bold text-[11px] whitespace-nowrap inline-block text-center">
                        {sale.promoCode === 'CEIIS' ? (
                          'CEIIS'
                        ) : (
                          <>
                            <span className="sm:hidden">{sale.promoCode}</span>
                            <span className="hidden sm:inline">Código {sale.promoCode}</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Amount: Fuente compacta y en una sola línea fija */}
                    <td className="py-3 px-3 sm:px-4">
                      <p className="font-heading font-bold text-white text-xs sm:text-sm whitespace-nowrap">
                        S/. {sale.totalAmount.toFixed(2)}
                      </p>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${sale.status === 'verified'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : sale.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                      >
                        {sale.status === 'verified'
                          ? 'Verificado'
                          : sale.status === 'rejected'
                            ? 'Rechazado'
                            : 'Pendiente'}
                      </span>
                    </td>

                    {/* Actions: CEIIS tiene Aprobar, Rechazar y Ver */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleStatusChange(sale.id, 'verified')}
                          title="Aprobar Pago"
                          className="px-2 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold transition-colors"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleStatusChange(sale.id, 'rejected')}
                          title="Rechazar Comprobante"
                          className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-[11px] font-bold transition-colors"
                        >
                          Rechazar
                        </button>
                        <button
                          onClick={() => setSelectedVoucherSale(sale)}
                          title="Detalles y Voucher"
                          className="px-2 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold transition-colors"
                        >
                          Ver
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

      {/* Voucher Inspection Modal with Approval Actions for CEIIS */}
      {selectedVoucherSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          {/* Backdrop click to close */}
          <div className="fixed inset-0 -z-10" onClick={() => setSelectedVoucherSale(null)}></div>

          <div className="glass-panel w-full max-w-6xl xl:max-w-7xl max-h-[95vh] flex flex-col rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl my-auto">
            {/* Modal Header: Fijo arriba */}
            <div className="p-3.5 sm:p-5 px-4 sm:px-8 border-b border-cyan-500/20 flex items-center justify-between bg-[#060621] shrink-0">
              <div>
                <h3 className="font-heading font-bold text-base sm:text-xl text-white">
                  Inspección de Comprobante de Pago
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  ID: {selectedVoucherSale.id} •{' '}
                  {selectedVoucherSale.promoCode === 'CEIIS'
                    ? 'CEIIS'
                    : `Código ${selectedVoucherSale.promoCode}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedVoucherSale(null)}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: flex en móvil (scroll natural vertical) y grid en PC */}
            <div className="p-3 sm:p-6 md:p-8 overflow-y-auto flex-1 flex flex-col md:grid md:grid-cols-12 gap-4 sm:gap-8">
              {/* Voucher Image Container: en móvil altura generosa (400px - 460px) con poco padding para que la imagen ocupe todo el ancho disponible */}
              <div className="w-full md:col-span-7 lg:col-span-8 rounded-2xl border border-cyan-500/30 bg-[#030617] h-[400px] sm:h-[460px] md:h-[600px] lg:h-[680px] flex items-center justify-center p-1 sm:p-4 shrink-0">
                <img
                  src={selectedVoucherSale.voucherImage}
                  alt="Voucher Ampliado"
                  className="w-full h-full object-contain rounded-xl shadow-2xl block"
                />
              </div>

              {/* Sale Info Summary */}
              <div className="w-full md:col-span-5 lg:col-span-4 space-y-3 sm:space-y-4 text-xs sm:text-sm flex flex-col justify-between">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] sm:text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
                    Comprador
                  </span>
                  <p className="text-base sm:text-lg font-bold text-white">{selectedVoucherSale.buyerName}</p>
                  <p className="font-mono text-slate-300 text-xs sm:text-sm">+51 {selectedVoucherSale.buyerPhone}</p>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] sm:text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
                    Vendedor(a) Autorizado(a)
                  </span>
                  <p className="text-base sm:text-lg font-bold text-cyan-300">
                    {selectedVoucherSale.sellerName}
                  </p>
                  <p className="font-mono text-slate-300 text-xs sm:text-sm">
                    Cód: {selectedVoucherSale.sellerStudentCode} (
                    {selectedVoucherSale.promoCode === 'CEIIS'
                      ? 'CEIIS'
                      : `Código ${selectedVoucherSale.promoCode}`}
                    )
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 to-cyan-950/40 border border-cyan-500/20 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-semibold text-xs sm:text-sm">Total a verificar:</span>
                    <span className="text-xl sm:text-2xl font-heading font-extrabold text-cyan-300">
                      S/. {selectedVoucherSale.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Boletos: {selectedVoucherSale.ticketNumbers.map((n) => `N°${n}`).join(', ')}
                  </p>
                </div>

                {/* Status action buttons for CEIIS */}
                <div className="pt-2 space-y-2.5">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleStatusChange(selectedVoucherSale.id, 'verified')}
                      className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] text-xs sm:text-sm active:scale-95"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedVoucherSale.id, 'rejected')}
                      className="flex-1 py-3 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white font-bold transition-all text-xs sm:text-sm active:scale-95"
                    >
                      Rechazar
                    </button>
                  </div>

                  <a
                    href={generateWhatsAppLink(selectedVoucherSale)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold transition-all shadow-[0_0_15px_rgba(0,240,255,0.25)] text-xs sm:text-sm active:scale-95 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                    Entregar Boletos por WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
