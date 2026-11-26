import React, { useState, useEffect } from 'react';
import type { Sale, SaleStatus, SessionUser, Student } from '../types';
import { getSales, fetchSalesFromSupabase, getStudents, fetchStudentsByPromoFromSupabase } from '../utils/storage';
import { getAuthSession, clearAuthSession } from '../utils/auth';
import { LoginForm } from './LoginForm';

export const DelegateDashboard: React.FC = () => {
  const [authUser, setAuthUser] = useState<SessionUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | SaleStatus>('all');
  const [showSellersView, setShowSellersView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVoucherSale, setSelectedVoucherSale] = useState<Sale | null>(null);

  useEffect(() => {
    const session = getAuthSession();
    setAuthUser(session);
    setIsCheckingAuth(false);

    loadSales();
    setStudents(getStudents());
    fetchSalesFromSupabase().then((data) => {
      setSales(data);
    });
    if (session?.promoCode) {
      fetchStudentsByPromoFromSupabase(session.promoCode).then((data) => {
        setStudents(data);
      });
    }
  }, []);

  useEffect(() => {
    if (authUser?.promoCode) {
      fetchStudentsByPromoFromSupabase(authUser.promoCode).then((data) => {
        setStudents(data);
      });
    }
  }, [authUser?.promoCode]);

  const loadSales = () => {
    setSales(getSales());
  };

  const handleLogout = () => {
    clearAuthSession();
    setAuthUser(null);
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
    return <LoginForm targetPanel="delegados" onLoginSuccess={(user) => setAuthUser(user)} />;
  }

  // Si tiene rol CEIIS pero entró a /delegados, mostrar aviso y redirigir a /admin
  if (authUser.role === 'ceiis') {
    return (
      <div className="py-6 sm:py-10 max-w-md mx-auto">
        <div className="glass-panel p-8 rounded-2xl border border-cyan-500/30 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="font-heading font-black text-2xl text-white">Acceso de Administrador</h3>
          <p className="text-[16px] text-slate-300">
            Hola, <strong className="text-white">{authUser.fullName}</strong>. Tu cuenta tiene rol de{' '}
            <strong className="text-cyan-400">Directiva CEIIS</strong>. Este módulo está diseñado exclusivamente para delegados de código.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <a
              href="/admin"
              className="py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#000c18] font-bold text-xs transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] text-center"
            >
              Ir al Panel General de Administrador
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
            Hola, <strong className="text-white">{authUser.fullName}</strong>. Tu código de estudiante no tiene permisos de delegado ni de administración.
          </p>
          <p className="text-[11px] text-slate-400">
            Si eres delegado de tu código, comunícate con la directiva del CEIIS para que te asignen los accesos.
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

  // El código del delegado queda FIJO a su propio código
  const delegatePromo = authUser.promoCode;

  // Filtrar solo las ventas del código del delegado
  const filteredSales = sales.filter((sale) => {
    // Si es delegado, solo puede ver SU código asignado
    if (authUser.role === 'delegado' && sale.promoCode !== delegatePromo) {
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

  // Métricas del código del delegado (solo ventas no rechazadas aportan dinero y boletos)
  const activeFilteredSales = filteredSales.filter((s) => s.status !== 'rejected');
  const totalTickets = activeFilteredSales.reduce((acc, s) => acc + s.ticketsCount, 0);
  const totalAmount = activeFilteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const pendingCount = filteredSales.filter((s) => s.status === 'pending').length;
  const verifiedCount = filteredSales.filter((s) => s.status === 'verified').length;

  // Consolidado de todos los vendedores (estudiantes) del código del delegado
  const promoSalesActive = sales.filter(
    (s) => s.promoCode === delegatePromo && s.status !== 'rejected'
  );

  const sellersMap = new Map<
    string,
    { studentCode: string; fullName: string; ticketsCount: number; ticketNumbers: number[] }
  >();

  students
    .filter((st) => st.promoCode === delegatePromo)
    .forEach((st) => {
      sellersMap.set(st.studentCode.toUpperCase(), {
        studentCode: st.studentCode,
        fullName: st.fullName,
        ticketsCount: 0,
        ticketNumbers: [],
      });
    });

  promoSalesActive.forEach((sale) => {
    const codeKey = sale.sellerStudentCode.toUpperCase();
    const current = sellersMap.get(codeKey) || {
      studentCode: sale.sellerStudentCode,
      fullName: sale.sellerName,
      ticketsCount: 0,
      ticketNumbers: [],
    };
    current.ticketsCount += sale.ticketsCount;
    current.ticketNumbers.push(...sale.ticketNumbers);
    sellersMap.set(codeKey, current);
  });

  const filteredSellers = Array.from(sellersMap.values())
    .map((seller) => ({
      ...seller,
      ticketNumbers: [...seller.ticketNumbers].sort((a, b) => a - b),
    }))
    .filter((seller) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        seller.fullName.toLowerCase().includes(term) ||
        seller.studentCode.toLowerCase().includes(term) ||
        seller.ticketNumbers.some((n) => String(n).includes(term))
      );
    })
    .sort((a, b) => b.ticketsCount - a.ticketsCount || a.fullName.localeCompare(b.fullName));

  return (
    <div className="space-y-6">
      {/* Top Header & Delegado Info */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-cyan-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-[11px] sm:text-xs uppercase font-bold tracking-widest text-cyan-400">
              Módulo de Supervisión de Delegados
            </span>
          </div>
          <h1 className="font-heading font-extrabold text-xl sm:text-3xl text-white">
            Panel de Delegado {delegatePromo === 'CEIIS' ? 'CEIIS' : `${delegatePromo}`}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visualización y supervisión de boletos y comprobantes de tu código
          </p>
        </div>

        {/* User Card & Logout */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm font-bold text-white">{authUser.fullName}</p>
            <p className="text-[11px] font-bold text-cyan-300 tracking-wider">
              Delegado: {delegatePromo === 'CEIIS' ? 'CEIIS' : `Código ${delegatePromo}`}
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
            Rifas en tu Código
          </span>
          <p className="text-xl sm:text-3xl font-heading font-black text-white mt-1">
            {totalTickets}
          </p>
          <span className="text-[10px] sm:text-[11px] text-cyan-300 block truncate">boletos emitidos</span>
        </div>

        <div className="glass-panel p-3.5 sm:p-5 rounded-2xl border border-cyan-500/20">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Monto Total Recaudado
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
          <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">en revisión CEIIS</span>
        </div>

        <div className="glass-panel p-3.5 sm:p-5 rounded-2xl border border-cyan-500/20">
          <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
            Vouchers Aprobados
          </span>
          <p className="text-xl sm:text-3xl font-heading font-black text-emerald-400 mt-1">
            {verifiedCount}
          </p>
          <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">aprobados CEIIS</span>
        </div>
      </div>

      {/* Filter and Search Bar: En móvil organizado en filas limpias */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-cyan-500/20 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="grid grid-cols-2 md:flex items-center gap-2">
          {/* El código se mantiene FIJO */}
          <div className="px-3 py-2 rounded-xl bg-blue-950/60 border border-blue-500/40 text-blue-200 text-xs font-bold font-mono text-center truncate">
            {delegatePromo === 'CEIIS' ? 'CEIIS' : `Código ${delegatePromo}`}
          </div>

          {/* Status Filter: bloqueado cuando está activa la vista de vendedores */}
          <select
            value={statusFilter}
            disabled={showSellersView}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={`w-full md:w-auto bg-[#030617] border border-cyan-500/30 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 transition-opacity ${
              showSellersView ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            <option value="all">Todos los Estados</option>
            <option value="pending">Pendientes</option>
            <option value="verified">Aprobados</option>
            <option value="rejected">Rechazados</option>
          </select>

          {/* Botón para alternar a la cinta de Vendedores del Código */}
          <button
            type="button"
            onClick={() => setShowSellersView((prev) => !prev)}
            className={`col-span-2 md:col-span-1 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
              showSellersView
                ? 'bg-cyan-500 text-[#000c18] border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                : 'bg-cyan-950/60 hover:bg-cyan-900 border-cyan-500/40 text-cyan-300'
            }`}
          >
            {showSellersView ? 'Ver Ventas' : 'Ver Vendedores'}
          </button>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              showSellersView
                ? 'Buscar vendedor, código UNI o boleto...'
                : 'Buscar comprador, vendedor o boleto...'
            }
            className="w-full md:w-64 bg-[#030617] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
          />
        </div>
      </div>

      {showSellersView ? (
        /* Sellers Table: Todos los usuarios del código y su avance de ventas */
        <div className="glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#030617] text-slate-400 text-[11px] uppercase font-bold tracking-wider border-b border-cyan-500/20">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Vendedor</th>
                  <th className="py-3 px-4">Cant. Rifas Vendidas</th>
                  <th className="py-3 px-4">Números Vendidos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-normal">
                {filteredSellers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500 text-xs">
                      No se encontraron vendedores para tu código con la búsqueda ingresada.
                    </td>
                  </tr>
                ) : (
                  filteredSellers.map((seller) => (
                    <tr key={seller.studentCode} className="hover:bg-white/[0.02] transition-colors">
                      {/* Código UNI */}
                      <td className="py-3 px-3 sm:px-4">
                        <span className="px-2 py-0.5 sm:py-1 rounded-md bg-blue-950/60 border border-blue-500/40 text-blue-300 font-mono font-bold text-[11px] whitespace-nowrap inline-block text-center">
                          {seller.studentCode}
                        </span>
                      </td>

                      {/* Vendedor */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-cyan-200">{seller.fullName}</p>
                      </td>

                      {/* Cant. Rifas Vendidas */}
                      <td className="py-3 px-4">
                        <span className="font-heading font-bold text-white text-xs sm:text-sm">
                          {seller.ticketsCount}
                        </span>{' '}
                        <span className="text-[11px] text-slate-400">
                          {seller.ticketsCount === 1 ? 'rifa' : 'rifas'}
                        </span>
                      </td>

                      {/* Números Vendidos */}
                      <td className="py-3 px-4">
                        {seller.ticketNumbers.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[260px]">
                            {seller.ticketNumbers.map((num) => (
                              <span
                                key={num}
                                className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-[10px]"
                              >
                                N°{num}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">Sin ventas</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Sales Table (Delegados SOLO tienen botón VER, sin Aprobar ni Rechazar) */
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
                    No se encontraron registros de ventas para tu código con los filtros seleccionados.
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
                          ? 'Aprobado'
                          : sale.status === 'rejected'
                            ? 'Rechazado'
                            : 'Pendiente'}
                      </span>
                    </td>

                    {/* Actions: SOLO VER para delegados */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedVoucherSale(sale)}
                        title="Ver Comprobante"
                        className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold transition-colors"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Voucher Inspection Modal (SOLO LECTURA PARA DELEGADOS: Sin Aprobar ni Rechazar) */}
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
                    <span className="text-slate-300 font-semibold text-xs sm:text-sm">Total registrado:</span>
                    <span className="text-xl sm:text-2xl font-heading font-extrabold text-cyan-300">
                      S/. {selectedVoucherSale.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Boletos: {selectedVoucherSale.ticketNumbers.map((n) => `N°${n}`).join(', ')}
                  </p>
                </div>

                {/* Nota para delegado */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                  <span>
                    Como delegado puedes revisar el comprobante y validar la información. La aprobación final es gestionada por el CEIIS.
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setSelectedVoucherSale(null)}
                    className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-all text-xs sm:text-sm active:scale-95"
                  >
                    Cerrar Detalle
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
